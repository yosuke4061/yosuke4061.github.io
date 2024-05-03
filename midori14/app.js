let scene, camera, renderer, controls, startButton;

let water,customMaterial;
let mesh; 
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20); // カメラの位置を調整
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラが原点を向くように設定

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);
    // 強い光源を追加
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // 光の強さを1.5に設定
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(100, 100, 100);
    scene.add(light);

    startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
    });

    window.addEventListener('resize', onWindowResize, false);

    setupControls();
    addCustomWaterEffect();
    //addWaterWithTexture(); // 水面の追加
}
function addCustomWaterEffect() {
    const waterGeometry = new THREE.PlaneGeometry(50, 50, 256, 256);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('_MG_0070.jpg', function(waterTexture) {
        waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
        waterTexture.repeat.set(10, 10); // テクスチャの繰り返し回数を増やす

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
                    float height = texture2D(waterTexture, vUv).r;
                    if (height < minHeight || height > maxHeight) {
                        discard;
                    }
                    gl_FragColor = vec4(texture2D(waterTexture, vUv).rgb, 1.0);
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
    });
}


function addWaterWithTexture() {
    const waterGeometry = new THREE.PlaneGeometry(10, 10);

    const water = new THREE.Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('water_1_tex.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        alpha: 1.0,
        sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined,
        transparent: true, // 透明度を有効にする
        opacity: 0.8 // 透明度を設定
    });

    water.rotation.x = -Math.PI / 2;
    water.position.y = -1;
    scene.add(water);

    // アニメーション関数を更新
    function animate() {
        requestAnimationFrame(animate);
        water.material.uniforms['time'].value += 1.0 / 60.0;
        renderer.render(scene, camera);
    }

    animate();
}


function addWaveEffectAlternative() {
    const textureLoader = new THREE.TextureLoader();
    const baseTexture = textureLoader.load('water_1_tex.jpg', function(texture) {
        console.log("Base texture loaded successfully.");
    }, undefined, function(err) {
        console.error("Error loading base texture:", err);
    });
    const normalTexture = textureLoader.load('water_1.jpg', function(texture) {
        console.log("Normal texture loaded successfully.");
    }, undefined, function(err) {
        console.error("Error loading normal texture:", err);
    });

    const customMaterial = new THREE.MeshPhongMaterial({
        map: baseTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(1, 1)
    });

    const geometry = new THREE.PlaneGeometry(10, 10, 100, 100);
    mesh = new THREE.Mesh(geometry, customMaterial);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
}

function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.minAzimuthAngle = -Math.PI / 4;
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