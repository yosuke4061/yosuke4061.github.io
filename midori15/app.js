let scene, camera, renderer, controls, startButton;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 150;

    renderer = new THREE.WebGLRenderer({ alpha: true }); // 透明度を有効にする
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(100, 100, 100);
    scene.add(light);

    startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
        addCustomWaterEffect();
    });

    window.addEventListener('resize', onWindowResize, false);

    setupControls();
    addSphere();
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
                minHeight: { value: 0 }, // 表示する最小の高さ
                maxHeight: { value: 1 }  // 表示する最大の高さ
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float height = sin(pos.x * 2.0 + time) * cos(pos.y * 2.0 + time) * 0.5 + 0.5;
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
                    if (texColor.a < 0.1) discard; // 透明度が低い部分は描画しない
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
    controls.update();
    renderer.render(scene, camera);
}

init();