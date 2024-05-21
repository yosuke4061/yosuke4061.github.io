import * as THREE from 'three';

export class WaterFluidSimulation {
    constructor(scene) {
        this.scene = scene; // THREE.jsのシーンオブジェクト
    
        this.particleSystem = new THREE.Group(); // パーティクルシステムのグループ
        this.particles = []; // パーティクルオブジェクトを格納する配列
        this.options = {
            particleCount: 1000, // パーティクルの総数
            particleSize: 5, // パーティクルのサイズ
            particleColor: 0x00ff00, // パーティクルの色（緑）
            cohesionDistance: 0.5, // 粒子の体積の0.5倍の距離まで結合できる
            kernelRadius:15,//particleSizeの数倍に設定
            stiffness: 1000, // 圧力の応答の強さを調整する係数 この値が高いほど、粒子間の反発力が強くなります。
            restDensity: 1000 // 粒子の理想的な密度 この値は、粒子がどれだけ密集しているか（または密集すべきか）を示します。
        };
        this.gravity = new THREE.Vector3(0, -9.8, 0); // 重力の設定（地球の重力加速度に近似）
        this.bounds = 50; // X軸とZ軸の境界の大きさ
        this.heightBounds = 300; // Y軸の境界の大きさを別に設定
        this.deltaTime = 1 / 15; // フレームレートの逆数（秒単位の時間ステップ）
    
        this.shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vNormal = normalMatrix * normal; // 法線ベクトルの変換
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); // モデルビュー変換を適用
                    vViewPosition = -mvPosition.xyz; // 視点位置の計算
                    gl_Position = projectionMatrix * mvPosition; // 最終的な頂点の位置
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                uniform vec3 color; // ユニフォーム変数として色を受け取る
                uniform float threshold; // メタボールのしきい値
                void main() {
                    vec3 normalizedNormal = normalize(vNormal); // 法線の正規化
                    vec3 lightDirection = normalize(vec3(0.5, 0.5, 1.0)); // 簡単な光源方向
                    float lightIntensity = max(dot(normalizedNormal, lightDirection), 0.0); // 光の強度計算
                    vec3 diffuse = color * lightIntensity; // 拡散反射光の計算

                    // メタボールのエフェクトを強化
                    float viewDistance = length(vViewPosition);
                    float metaballEffect = smoothstep(threshold - 0.2, threshold, viewDistance);
                    vec3 metaballColor = mix(color * 0.5, diffuse, metaballEffect);

                    gl_FragColor = vec4(metaballColor, 1.0); // フラグメントの色
                }
            `,
            uniforms: {
                color: { value: new THREE.Color(this.options.particleColor) }, // パーティクルの色を設定
                threshold: { value: 0.5 } // メタボールのしきい値を設定
            },
            transparent: true, // 透明度を有効化
            depthWrite: false // 深度バッファへの書き込みを無効化
        });
    
        this.initParticles(); // パーティクルの初期化関数を呼び出し
    }

    initParticles() {
        // パーティクルの形状と材質を設定
        const geometry = new THREE.SphereGeometry(this.options.particleSize, 32, 32);
        const material = this.shaderMaterial;

        // パーティクル生成の開始高さ
        let startHeight = this.heightBounds - 50; // 高さの初期値を設定
        let count = 0; // 生成されたパーティクルの数をカウント

        const generateParticle = () => {
            if (count >= this.options.particleCount) {
                return; // 生成上限に達したら生成を停止
            }

            const particle = new THREE.Mesh(geometry, material);
            particle.position.x = (Math.random() - 0.5) * (this.bounds - this.options.particleSize * 2);
            particle.position.y = startHeight; // 粒子が生成される高さを設定
            particle.position.z = (Math.random() - 0.5) * (this.bounds - this.options.particleSize * 2);
            particle.userData.velocity = new THREE.Vector3(0, -0.2, 0); // 落下速度を設定
            particle.userData.mass = 1; // 粒子の質量
            particle.userData.isActive = true; // 初期状態でアクティブに設定

            // パーティクルシステムにパーティクルを追加
            this.particleSystem.add(particle);
            this.particles.push(particle);

            count++; // 生成されたパーティクルの数を更新
            setTimeout(generateParticle, 60); // 次のパーティクル生成をスケジュール
        };

        generateParticle(); // 最初のパーティクル生成を開始

        // シーンにパーティクルシステムを追加
        this.scene.add(this.particleSystem);
    }

    calculateDensityAndPressure() {
        // 各粒子に対して密度と圧力を計算します
        this.particles.forEach(particle => {
            let density = 0; // 密度の初期値を0に設定
    
            // 他の全粒子との距離を計算して、カーネル半径内の粒子から密度を加算
            this.particles.forEach(otherParticle => {
                let r = particle.position.distanceTo(otherParticle.position); // 粒子間の距離
                if (r < this.options.kernelRadius && r > 0) { // カーネル半径内かつ自分自身ではない場合
                    // 密度計算式（カーネル関数を使用）
                    const h = this.options.kernelRadius;
                    if (r < h) {
                        const factor = 315 / (64 * Math.PI * Math.pow(h, 9));
                        density += this.options.mass * (factor * Math.pow(h * h - r * r, 3));
                    }
                }
            });
    
            // 計算された密度を元に圧力を計算
            particle.userData.density = density; // 粒子の密度を更新
            particle.userData.pressure = this.options.stiffness * (density - this.options.restDensity); // 圧力計算式
        });
    }

    applySurfaceTension() {
        // 表面張力の係数を設定します。この値を調整することで、粒子間の表面張力の影響を変更できます。
        const surfaceTensionCoefficient = 0.2; // 表面張力の値を高めに設定

        // 全ての粒子に対して表面張力を計算し適用します。
        this.particles.forEach((particle, index) => {
            let surfaceForce = new THREE.Vector3(0, 0, 0); // 表面張力のベクトルを初期化

            // 他の全粒子との相互作用を計算
            this.particles.forEach((otherParticle) => {
                if (particle !== otherParticle) { // 自分自身とは計算しない
                    let distance = particle.position.distanceTo(otherParticle.position); // 粒子間の距離を計算
                    // 距離が粒子サイズの2倍以下の場合、表面張力を計算
                    if (distance < this.options.particleSize * 2) {
                        let forceDirection = particle.position.clone().sub(otherParticle.position).normalize(); // 力の方向を計算
                        surfaceForce.add(forceDirection.multiplyScalar(surfaceTensionCoefficient)); // 表面張力を加算
                    }
                }
            });

            // 計算された表面張力を粒子の速度に適用
            particle.userData.velocity.add(surfaceForce.multiplyScalar(this.deltaTime / particle.userData.mass));
        });
    }

    applyForces() {
        // すべての粒子に対して力を適用します
        this.particles.forEach(particle => {
            // 重力による加速度を計算します
            const acceleration = this.gravity.clone().multiplyScalar(this.deltaTime / particle.userData.mass);
            // 粒子の速度に加速度を加算します
            particle.userData.velocity.add(acceleration);
        });
    }
    
    applyViscosity() {
        // 粘性係数を設定します。この値を調整することで、粒子間の粘性の強さを変更できます。
        const viscosity = 0.09; // 粘性係数をオプションから取得またはデフォルト値を使用

        // 全粒子に対して粘性力を計算し適用します。
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                let particleI = this.particles[i];
                let particleJ = this.particles[j];

                // 二粒子間の距離ベクトルを計算します。
                let distanceVector = particleJ.position.clone().sub(particleI.position);
                let distance = distanceVector.length();

                // 距離が粒子サイズの2倍以下の場合、粘性力を計算します。
                if (distance < this.options.particleSize * 2) {
                    // 速度差を計算します。
                    let velocityDifference = particleI.userData.velocity.clone().sub(particleJ.userData.velocity);

                    // 粘性力を計算します。
                    let force = distanceVector.normalize().multiplyScalar(velocityDifference.dot(distanceVector) / distance * viscosity);

                    // 粘性力を粒子の速度に適用します。
                    particleI.userData.velocity.add(force.clone().multiplyScalar(1 / particleI.userData.mass));
                    particleJ.userData.velocity.sub(force.clone().multiplyScalar(1 / particleJ.userData.mass));
                }
            }
        }
    }
    applyCohesion() {
        // 凝集力の強度を設定します。この値を調整することで、粒子間の引力の強さを変更できます。
        const cohesionStrength = 0.05; // 凝集力の強度

        // 全粒子に対して凝集力を計算し適用します。
        this.particles.forEach((particle, index) => {
            let cohesionForce = new THREE.Vector3(0, 0, 0); // 凝集力のベクトルを初期化
            let neighborCount = 0; // 近隣の粒子数をカウント

            // 他の全粒子との相互作用を計算
            this.particles.forEach((otherParticle) => {
                if (particle !== otherParticle) { // 自分自身とは計算しない
                    let distance = particle.position.distanceTo(otherParticle.position); // 粒子間の距離を計算
                    let cohesionRange = this.options.particleSize * this.options.cohesionDistance; // 凝集力の作用範囲

                    // 凝集力の範囲内の場合、凝集力を計算
                    if (distance < cohesionRange) {
                        cohesionForce.add(otherParticle.position.clone().sub(particle.position)); // 力の方向を計算
                        neighborCount++; // 近隣粒子数をインクリメント
                    }
                }
            });

            // 近隣粒子が存在する場合、凝集力を粒子の速度に適用
            if (neighborCount > 0) {
                cohesionForce.divideScalar(neighborCount); // 平均の力を計算
                cohesionForce.normalize(); // 力のベクトルを正規化
                cohesionForce.multiplyScalar(cohesionStrength); // 凝集力の強度を乗算
                particle.userData.velocity.add(cohesionForce); // 粒子の速度に凝集力を加算
            }
        });
    }

    /*applyRepulsion()
    目的: 粒子間に反発力を適用し、粒子が互いに近づきすぎるのを防ぐことです。このメソッドは、粒子間の理想的な距離を保つために設計されています。
    計算: 粒子間の距離が一定範囲内にある場合に、反発力を計算して適用します。この力は、粒子が互いに離れるように作用します。 */
    applyRepulsion() {
        // 反発力の強度と理想的な距離を設定可能なオプションとして追加
        const repulsionStrength = 0.2; // 反発力の強度
        const idealDistance = this.options.particleSize * 2; // 理想的な距離２倍サイズの２倍

        // 全粒子に対して反発力を計算し適用
        this.particles.forEach((particle, index) => {
            let repulsionForce = new THREE.Vector3(0, 0, 0); // 反発力の初期ベクトル

            // 他の全粒子との相互作用を計算
            this.particles.forEach((otherParticle) => {
                if (particle !== otherParticle) { // 自分自身とは計算しない
                    let distance = particle.position.distanceTo(otherParticle.position); // 粒子間の距離を計算
                    // 理想的な距離より小さく、0より大きい場合に反発力を計算
                    if (distance < idealDistance && distance > 0) {
                        let forceDirection = particle.position.clone().sub(otherParticle.position).normalize(); // 力の方向を計算
                        repulsionForce.add(forceDirection.multiplyScalar(repulsionStrength * (idealDistance - distance))); // 反発力を加算
                    }
                }
            });

            // 計算された反発力を粒子の速度に適用
            particle.userData.velocity.add(repulsionForce);
        });
    }
    
    update() {
        // 設定可能なパラメータ
        const activationProbability = 0.01; // 粒子をアクティブにする確率
        const initialVelocityY = 5; // アクティブ化時の初期Y方向速度
        const restitutionCoefficient = 0.01; // 反発係数

        // 力の適用
        this.applyViscosity(); // 粘性力
        this.applyForces(); // その他の力
        this.applyCohesion(); // 凝集力
        this.applyRepulsion(); // 反発力
        this.applySurfaceTension(); // 表面張力
        this.calculateDensityAndPressure(); // 密度と圧力の計算

        // 粒子の状態更新
        this.particles.forEach(particle => {
            // 粒子をランダムにアクティブ化
            if (!particle.userData.isActive && Math.random() < activationProbability) {
                particle.userData.isActive = true;
                particle.userData.velocity.y = -Math.random() * initialVelocityY;
            }
    
            // アクティブな粒子の位置更新
            if (particle.userData.isActive) {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(this.deltaTime));
                this.checkBounds(particle);
            }
        });
        /*粒子間の衝突処理（update()内）
        目的: 実際に粒子が衝突した際の物理的な反応（反発）をシミュレートすることです。これは、粒子が互いに衝突した後の挙動を決定します。
        計算: 粒子が互いに接触した（距離が粒子の直径以下になった）場合に、衝突の物理法則に基づいて反発力を計算し、粒子の速度を更新します。 */
        // 粒子間の衝突処理
        this.particles.forEach((particle, index) => {
            const velocityEffect = particle.userData.velocity.clone().multiplyScalar(this.deltaTime);
            particle.position.add(velocityEffect);
            this.checkBounds(particle);
    
            for (let i = index + 1; i < this.particles.length; i++) {
                let otherParticle = this.particles[i];
                let distance = particle.position.distanceTo(otherParticle.position);
                let sumRadius = this.options.particleSize * 2;
    
                if (distance < sumRadius) {
                    let normal = new THREE.Vector3().subVectors(particle.position, otherParticle.position).normalize();
                    let relativeVelocity = particle.userData.velocity.clone().sub(otherParticle.userData.velocity);
                    let velocityAlongNormal = relativeVelocity.dot(normal);
                    if (velocityAlongNormal > 0) continue;
    
                    let impulseMagnitude = -(1 + restitutionCoefficient) * velocityAlongNormal / (1 / particle.userData.mass + 1 / otherParticle.userData.mass);
                    let impulse = normal.multiplyScalar(impulseMagnitude);
    
                    particle.userData.velocity.add(impulse.clone().multiplyScalar(1 / particle.userData.mass));
                    otherParticle.userData.velocity.sub(impulse.clone().multiplyScalar(1 / otherParticle.userData.mass));
                }
            }
        });
    }


    checkBounds(particle) {
        // 中心座標
        const centerX = 0;
        const centerZ = 0;
        // 境界の半径
        const radius = this.bounds;

        // X軸とZ軸での粒子の位置から中心までの距離を計算
        const distanceFromCenter = Math.sqrt((particle.position.x - centerX) ** 2 + (particle.position.z - centerZ) ** 2);
    
        // 距離が半径より大きい場合、粒子を境界内に戻す
        if (distanceFromCenter > radius) {
            // 中心から粒子へのベクトルを計算し、正規化
            const direction = new THREE.Vector3(particle.position.x - centerX, 0, particle.position.z - centerZ).normalize();
            
            // 粒子の位置を円の境界上に設定
            particle.position.x = centerX + direction.x * radius;
            particle.position.z = centerZ + direction.z * radius;
    
            // 速度を反射させる
            const velocityComponentNormal = direction.multiplyScalar(direction.dot(particle.userData.velocity));
            const velocityComponentTangent = particle.userData.velocity.clone().sub(velocityComponentNormal);
            particle.userData.velocity.copy(velocityComponentTangent.sub(velocityComponentNormal));
        }
    
        // Y軸の境界チェック
        if (particle.position.y > this.heightBounds - this.options.particleSize) {
            particle.position.y = this.heightBounds - this.options.particleSize;
            particle.userData.velocity.y *= -0.5; // 反射
        } else if (particle.position.y < this.options.particleSize) {
            particle.position.y = this.options.particleSize;
            particle.userData.velocity.y *= -0.5; // 反射
        }
    }
}


