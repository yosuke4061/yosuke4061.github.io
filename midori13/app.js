let scene, camera, renderer, controls, startButton;

let water;
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
    addWater();
}


function addWater() {
    const waterGeometry = new THREE.PlaneGeometry(100, 100);
    water = new THREE.Water(waterGeometry, {
        textureWidth: 3840,
        textureHeight: 2413,
        waterNormals: new THREE.TextureLoader().load('water_1.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        alpha: 0.8, // 透明度を少し下げる
        sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
        sunColor: 0xffffff,
        waterColor: 0x2d8382, // 明るい水色に設定
        distortionScale: 1,
        fog: scene.fog !== undefined
    });

    water.rotation.x = -Math.PI / 2;
    water.position.y = -5;
    scene.add(water);
}

function updateWater() {
    if (water) {
        water.material.uniforms['time'].value += 1.0 / 60.0; // 時間を更新して波の動きをシミュレート
    }
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
    updateWater(); // 水のアニメーションを更新

}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateWater(); // 水のアニメーションを更新

    renderer.render(scene, camera);
}

init();