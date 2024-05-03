let scene, camera, renderer, controls, startButton,shapes;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = 150;
    camera.position.z = 200;
    camera.position.y = 80;
    renderer = new THREE.WebGLRenderer({ alpha: true }); // 透明度を有効にする
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    document.body.appendChild(renderer.domElement);

    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(100, 100, 100);
    scene.add(light);

    startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
        //addCustomWaterEffect();
        shapes = [];
        addTexturedWavyGround();
        addRotatingImageEnhanced();
        addFreeMovingRectangularTubeEffect();
        
        //addSphere();
    });

    window.addEventListener('resize', onWindowResize, false);

    setupControls();
    addSkyAndGround();  
    
}

function addRotatingImageEnhanced() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('DSC03365.jpg', function(texture) {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const image = texture.image;
        const aspectRatio = image.width / image.height;
        const height = 80
        const width = height * aspectRatio;

        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0,
            roughness: 0,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 100, 0);
        scene.add(mesh);

        // ポイントライトを追加
        const pointLight = new THREE.PointLight(0xffffff, 1.5, 1000);
        pointLight.position.set(10, 150, 100); // ライトの位置をメッシュの前に設定
        scene.add(pointLight);

        let isAnimating = false;
        let animationFrameId;

        function animateMesh() {
            if (isAnimating) {
                animationFrameId = requestAnimationFrame(animateMesh);
                mesh.rotation.x += Math.random() * 0.02;
                mesh.rotation.y += Math.random() * 0.02;
                pointLight.position.set(mesh.position.x, mesh.position.y, mesh.position.z + 100); // ライトがメッシュに追従
                renderer.render(scene, camera);
            }
        }

        animateMesh();

        renderer.domElement.addEventListener('dblclick', function() {
            isAnimating = !isAnimating; // 状態を切り替える
            if (isAnimating) {
                animateMesh(); // アニメーション再開
            } else {
                cancelAnimationFrame(animationFrameId); // アニメーション停止
                mesh.rotation.x = 0;
                mesh.rotation.y = 0;
                mesh.rotation.z = 0;
                mesh.lookAt(camera.position);
            }
        }, false);
    }, undefined, function(error) {
        console.error('テクスチャの読み込みに失敗しました:', error);
    });
}

function addTexturedRectangle() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('DSC03365.jpg', function(texture) {
        const image = texture.image;
        const aspectRatio = image.width / image.height;
        const height = 100; // 高さを設定
        const width = height * aspectRatio; // 縦横比を保持して幅を設定

        const vertices = new Float32Array([
            -width / 2, -height / 2, 0,  // Vertex 0
            width / 2, -height / 2, 0,   // Vertex 1
            width / 2, height / 2, 0,    // Vertex 2
            -width / 2, height / 2, 0    // Vertex 3
        ]);

        const indices = [
            0, 1, 2,  // Face 1
            2, 3, 0   // Face 2
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals(); // 法線を計算

        const material = new THREE.MeshBasicMaterial({ map: texture });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 70, 0); // 原点の真上に配置
        scene.add(mesh);

        let isAnimating = true;
        let animationFrameId;

        function animateMesh() {
            if (isAnimating) {
                animationFrameId = requestAnimationFrame(animateMesh);
                mesh.rotation.x += 0.01;
                mesh.rotation.y += 0.01;
                renderer.render(scene, camera);
            }
        }

        animateMesh();

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        function onMouseClick(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children);

            if (intersects.length > 0 && intersects[0].object === mesh) {
                if (isAnimating) {
                    cancelAnimationFrame(animationFrameId);
                    mesh.rotation.x = 0;
                    mesh.rotation.y = 0;
                    mesh.rotation.z = 0;
                    renderer.render(scene, camera);
                } else {
                    isAnimating = true;
                    animateMesh();
                }
                isAnimating = !isAnimating;
            }
        }

        window.addEventListener('click', onMouseClick, false);
    }, undefined, function(error) {
        console.error('テクスチャの読み込みに失敗しました:', error);
    });
}

function addFreeMovingRectangularTubeEffect() {
    let spheres = []; // 名前を `tubes` から `spheres` に変更
    let maxTrailCount = 50;
    let sceneBounds = 300; // シーンの境界を設定

    for (let i = 0; i < 150; i++) {
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32); // 球体のジオメトリを作成
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, transparent: true, opacity: 0.8 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(0, 100, 0); // 初期位置を (0, 100, 0) に設定
     
        scene.add(sphere);

        spheres.push({
            sphere: sphere,
            velocity: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2) // 速度ベクトルを設定
        });
    }

    function updateSpherePositions() {
        spheres.forEach(obj => {
            // 位置を更新
            obj.sphere.position.add(obj.velocity);

            // 境界での反射
            ['x', 'y', 'z'].forEach(axis => {
                if (Math.abs(obj.sphere.position[axis]) > sceneBounds) {
                    obj.velocity[axis] *= -1;
                }
            });

            // トレイルの更新
            let trailSphere = obj.sphere.clone();
            trailSphere.material = obj.sphere.material.clone();
            trailSphere.material.opacity = 0.5;
            scene.add(trailSphere);
            obj.trail = obj.trail || [];
            obj.trail.push(trailSphere);

            if (obj.trail.length > maxTrailCount) {
                let oldTrail = obj.trail.shift();
                scene.remove(oldTrail);
            }

            obj.trail.forEach(t => {
                t.material.opacity *= 0.95;
            });
        });
    }

    shapes.push({ update: updateSpherePositions }); // 更新関数を形状配列に追加
}


function addWaterSurfaceEffect(position) {
    // 水面エフェクト用のジオメトリとマテリアルを作成
    const geometry = new THREE.CircleGeometry(5, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff, // 水色
        transparent: true,
        opacity: 0.5
    });
    const circle = new THREE.Mesh(geometry, material);

    // エフェクトの位置を設定し、水面の高さに合わせる
    circle.position.copy(position);
    circle.position.z = 0; // 水面の高さに設定

    // シーンにエフェクトを追加
    scene.add(circle);

    // エフェクトのフェードアウト処理
    let fadeOut = function() {
        if (circle.material.opacity > 0) {
            circle.material.opacity -= 0.05; // 透明度を徐々に下げる
            requestAnimationFrame(fadeOut); // 次のフレームで再度フェードアウトを実行
        } else {
            scene.remove(circle); // 透明度が0になったらシーンから削除
        }
    };

    // フェードアウト処理を開始
    fadeOut();
}
function addTexturedWavyGround() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('water_2.jpg', function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // テクスチャの繰り返し設定

        const groundGeometry = new THREE.PlaneGeometry(2500, 2500, 256, 256);
        const groundMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterTexture: { value: texture }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float height = sin(pos.x * 0.025 + time) * cos(pos.y * 0.025 + time) * 10.0; // 波の高さと頻度を調整
                    pos.z += height;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D waterTexture;
                varying vec2 vUv;
                void main() {
                    vec4 textureColor = texture2D(waterTexture, vUv);
                    gl_FragColor = textureColor;
                }
            `,
            transparent: true,
            opacity: 0.8,
            wireframe: false
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = 0;
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        function animateGround() {
            requestAnimationFrame(animateGround);
            groundMaterial.uniforms.time.value += 0.01; // アニメーションの速度を調整
            renderer.render(scene, camera);
        }

        animateGround();
    }, undefined, function(error) {
        console.error('テクスチャの読み込みに失敗しました:', error);
    });
}
function addSkyAndGround(){
    // 空の色
    const skyColor = new THREE.Color(0x94d6d2); // 明るい青
    // 地面の色
    const groundColor = new THREE.Color(0x000000); // 明るい黄色

    // シーンの背景を空の色に設定
    scene.background = skyColor;

    // 地面を作成
    const groundMaterial = new THREE.MeshLambertMaterial({ color: groundColor });
    const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -100; // 地面の位置を下げる
    ground.rotation.x = -Math.PI / 2; // 地面を水平にする
    ground.position.z = -150;
    scene.add(ground);

    // フォグを追加して、遠くの景色が徐々に消えるようにする
    scene.fog = new THREE.Fog(skyColor, 1, 1000);
}



//波の影響を球体にも適用する
function addSphere() {
    const geometry = new THREE.SphereGeometry(15, 32, 32);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0x000000) }
        },
        vertexShader: `
            uniform float time;
            varying vec3 vNormal;
            void main() {
                vNormal = normal;
                vec3 pos = position;
                float height = sin(pos.x * 2.0 + time) * cos(pos.y * 2.0 + time) * 0.05;
                pos.z += height;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying vec3 vNormal;
            void main() {
                float intensity = dot(normalize(vNormal), vec3(0, 0, 1));
                gl_FragColor = vec4(color * intensity, 1.0);
            }
        `,
        transparent: true
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0); // 中心に配置
    scene.add(sphere);

    function animateSphere() {
        requestAnimationFrame(animateSphere);
        material.uniforms.time.value += 0.05;
        renderer.render(scene, camera);
    }

    animateSphere();
}

function addCustomWaterEffect() {
    const waterGeometry = new THREE.PlaneGeometry(100, 100, 256, 256);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('water_1.png', function(waterTexture) {
        waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
        waterTexture.repeat.set(50 / waterTexture.image.width, 50 / waterTexture.image.height);

        const waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterTexture: { value: waterTexture },
                minHeight: { value: 0 },
                maxHeight: { value: 1 },
                randomValue: { value: Math.random() * 5 }, // ランダムな値を追加
                waveHeight: { value: 0.9 }, // 波の高さ
                waveSpeed: { value: 2.0 } // 波の速度
            },
            vertexShader: `
                uniform float time;
                uniform float randomValue;
                uniform float waveHeight;
                uniform float waveSpeed;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float height = sin((pos.x + randomValue) * waveSpeed + time) * cos((pos.y + randomValue) * waveSpeed + time) * waveHeight;
                    pos.z = height;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D waterTexture;
                uniform float minHeight;
                uniform float maxHeight;
                varying vec2 vUv;
                void main() {
                    vec4 texColor = texture2D(waterTexture, vUv);
                    if (texColor.a < 0.1) discard;
                    if (texColor.r < minHeight || texColor.r > maxHeight) {
                        discard;
                    }
                    gl_FragColor = texColor;
                }
            `,
            transparent: true
        });

        const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        waterMesh.rotation.x = -Math.PI / 2;
        scene.add(waterMesh);

        function animate() {
            requestAnimationFrame(animate);
            waterMaterial.uniforms.time.value += 0.05;
            renderer.render(scene, camera);
        }

        animate();

        // ダブルクリックイベントを追加
        renderer.domElement.addEventListener('dblclick', function() {
            waterMaterial.uniforms.randomValue.value = Math.random() * 5;
            waterMaterial.uniforms.waveHeight.value = Math.random() * 0.5 + 0.1; // 0.1 から 0.6 の間でランダムに波の高さを設定
            waterMaterial.uniforms.waveSpeed.value = Math.random() * 3 + 1; // 1 から 4 の間でランダムに波の速度を設定
        });
    }, undefined, function(error) {
        console.error('テクスチャの読み込みに失敗しました:', error);
    });
}

function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = -Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.enablePan = true;

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3;
        controls.touchDampingFactor = 0.2;
    } else {
        controls.panSpeed = 0.5;
        controls.touchDampingFactor = 0.1;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function startAnimation() {
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    shapes.forEach(shape => shape.update()); // 各形状の更新関数を呼び出す
    controls.update();
    renderer.render(scene, camera);
}

init();