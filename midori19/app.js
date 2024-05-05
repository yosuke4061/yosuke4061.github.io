let scene, camera, renderer, controls, startButton;
let cloud; // グローバル変数として雲を保持

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 100, 200); // カメラの位置を調整
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラが中心を向くように

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(50, 200, 100);
    scene.add(light);

    startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
    });

    window.addEventListener('resize', onWindowResize, false);

    setupControls();
    createWideSpreadCloud();
    //createUnifiedCloud();

}

function createWideSpreadCloud() {
    cloud = new THREE.Group(); // 雲を形成するグループをグローバル変数に保存

    const cloudCenter = new THREE.Vector3(0, 50, 0);
    const numSpheres = 100;
    const spread = 300;

    for (let i = 0; i < numSpheres; i++) {
        const size = Math.random() * 10 + 5;
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const hue = Math.random() * 360;
        const saturation = Math.random() * 100;
        const lightness = Math.random() * 50 + 50;
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`),
            opacity: 0.9,
            transparent: true
        });
        const sphere = new THREE.Mesh(geometry, material);

        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread * 0.5,
            (Math.random() - 0.5) * spread
        );
        sphere.position.addVectors(cloudCenter, offset);

        // 個々の球体に速度と加速度を追加
        sphere.userData = {
            velocity: 0,
            acceleration: 0.01 * (Math.random() - 0.5)
        };

        cloud.add(sphere);
    }

    scene.add(cloud);
}


function createUnifiedCloud() {
    const cloud = new THREE.Group(); // 雲を形成するグループ

    const cloudCenter = new THREE.Vector3(0, 50, 0); // 雲の中心位置

    for (let i = 0; i < 50; i++) {
        const size = Math.random() * 20 + 5; // 球体のサイズをランダムに設定
        const geometry = new THREE.SphereGeometry(size, 32, 32); // 球体ジオメトリを使用
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(`hsl(0, 0%, ${Math.random() * 50 + 50}%)`), // 色を白っぽく設定
            opacity: 1.0,
            //transparent: true
        });
        const sphere = new THREE.Mesh(geometry, material);

        // 球体の位置を雲の中心からのランダムな位置に設定
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 150,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 150
        );
        sphere.position.addVectors(cloudCenter, offset);

        cloud.add(sphere); // グループに球体を追加
    }

    scene.add(cloud); // シーンにグループを追加
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
    
    // 雲の各球体の位置を更新
    if (cloud) {
        cloud.children.forEach(sphere => {
            // 速度に加速度を加える
            sphere.userData.velocity += sphere.userData.acceleration;
            // 位置に速度を加える
            sphere.position.y += sphere.userData.velocity;
            // 慣性の効果（速度を減衰させる）
            sphere.userData.velocity *= 0.98;
        });
    }

    controls.update();
    renderer.render(scene, camera);
}

init();