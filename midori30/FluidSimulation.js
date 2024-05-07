import * as THREE from 'three';

export class FluidSimulation {
    constructor(scene, options, objects) {
        this.scene = scene;
        this.particleSystem = new THREE.Group();
        this.particles = [];
        this.options = options;
        this.interactiveObjects = objects; // Added this line to store the interactive objects
        this.gravity = new THREE.Vector3(0, -6, 0); // 地球の重力加速度に近い値に設定
        this.bounds = 300; // 境界の大きさ
        this.deltaTime = 1 / 60; // 60fpsを想定したデルタタイム

        this.initParticles();
    }

    initParticles() {
        const geometry = new THREE.SphereGeometry(this.options.particleSize, 16, 16);
        for (let i = 0; i < this.options.particleCount; i++) {
            // ランダムな色を生成
            const color = new THREE.Color(Math.random(), Math.random(), Math.random());
            // 金属質感のマテリアルを設定
            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 1, // 金属感を強調
                roughness: 0.5  // 表面の粗さを減らす
            });
    
            const particle = new THREE.Mesh(geometry, material);
            particle.position.x = Math.random() * 150 - 50;
            particle.position.y = Math.random() * 150 + 100;
            particle.position.z = Math.random() * 150 - 50;
            particle.userData.velocity = new THREE.Vector3(0, 0, 0); // ここで velocity を初期化
            particle.userData.mass = 1; // 各粒子に質量を設定
            this.particleSystem.add(particle);
            this.particles.push(particle);
        }
        this.scene.add(this.particleSystem);
    }

    applyForces() {
        this.particles.forEach(particle => {
            const acceleration = this.gravity.clone().multiplyScalar(this.deltaTime / particle.userData.mass);
            particle.userData.velocity.add(acceleration);
        });
    }

    update() {
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

                    let restitution = 3;//反発係数
                    let impulseMagnitude = -(1 + restitution) * velocityAlongNormal / (1 / particle.userData.mass + 1 / otherParticle.userData.mass);
                    let impulse = normal.multiplyScalar(impulseMagnitude);

                    particle.userData.velocity.add(impulse.clone().multiplyScalar(1 / particle.userData.mass));
                    otherParticle.userData.velocity.sub(impulse.clone().multiplyScalar(1 / otherParticle.userData.mass));
                }
            }

            // Added this loop to check for collisions with interactive objects
            this.interactiveObjects.forEach(object => {
                if (this.checkCollision(particle, object)) {
                    this.respondToCollision(particle, object);
                }
            });
        });

        this.applyForces();
    }

    checkBounds(particle) {
        ['x', 'y', 'z'].forEach(axis => {
            if (particle.position[axis] > this.bounds) {
                particle.position[axis] = this.bounds;
                particle.userData.velocity[axis] *= -0.5;
            } else if (particle.position[axis] < -100 && axis === 'y') {
                particle.position[axis] = 0;
                particle.userData.velocity[axis] *= -0.5;
            } else if (particle.position[axis] < -this.bounds) {
                particle.position[axis] = -this.bounds;
                particle.userData.velocity[axis] *= -0.5;
            }
        });
    }

    checkCollision(particle, object) {
        // AABB collision detection
        const bounds = new THREE.Box3().setFromObject(object);
        return bounds.containsPoint(particle.position);
    }

    respondToCollision(particle, object) {
        const bounds = new THREE.Box3().setFromObject(object);
        const particleRadius = this.options.particleSize / 2; // 粒子の半径

        // 粒子の現在の位置から半径を考慮した球体を作成
        const particleSphere = new THREE.Sphere(particle.position, particleRadius);

        // 粒子の球体とオブジェクトのバウンディングボックスが交差するかチェック
        if (bounds.intersectsSphere(particleSphere)) {
            // オブジェクトの中心と粒子の位置のベクトル
            const objectCenter = new THREE.Vector3();
            bounds.getCenter(objectCenter);
            const toParticle = new THREE.Vector3().subVectors(particle.position, objectCenter).normalize();

            // 最も近い面の法線を計算
            const normals = [
                new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
            ];
            let closestNormal = normals[0];
            let maxDot = -Infinity;
            for (let normal of normals) {
                const dot = normal.dot(toParticle);
                if (dot > maxDot) {
                    maxDot = dot;
                    closestNormal = normal;
                }
            }

            // 粒子をオブジェクトの表面から適切な距離に押し出す
            const closestPoint = bounds.clampPoint(particle.position, new THREE.Vector3());
            particle.position.copy(closestPoint);
            particle.position.add(closestNormal.multiplyScalar(particleRadius * 2));

            // 反発処理
            if (particle.userData.velocity) {
                const reflectVelocity = particle.userData.velocity.reflect(closestNormal);
                particle.userData.velocity.copy(reflectVelocity.multiplyScalar(1.2)); // 反発係数を適用して速度を更新
            }
        }
    }
}

