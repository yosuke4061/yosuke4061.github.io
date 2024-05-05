let scene, camera, renderer, controls, startButton;

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
   // AxesHelperを追加
   const axesHelper = new THREE.AxesHelper(50);
   scene.add(axesHelper);
    startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
    });

    window.addEventListener('resize', onWindowResize, false);

    setupControls();
    // 球体を作成してシーンに追加
    //createExplodableSphere();
    createMultipleExplodableSpheres();
}

function createMultipleExplodableSpheres() {
    const numberOfSpheres = 10;  // 生成する球体の数

    for (let i = 0; i < numberOfSpheres; i++) {
        // 球体のジオメトリとランダムな色のマテリアルを定義
        const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
        const randomColor = Math.random() * 0xffffff;  // ランダムな色
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: randomColor });

        // 球体を作成し、シーンに追加
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(
            (Math.random() - 0.5) * 100,  // ランダムな位置
            10,
            (Math.random() - 0.5) * 100
        );
        scene.add(sphere);

        // クリックイベントのリスナーを追加
        addClickListener(sphere);
    }
}

function addClickListener(sphere) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
        // マウス位置を正規化
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // レイキャスターを更新
        raycaster.setFromCamera(mouse, camera);

        // 交差判定
        const intersects = raycaster.intersectObject(sphere);
        if (intersects.length > 0) {
            explodeSphere(sphere);
        }
    });
}

function explodeSphere(sphere) {
    const sphereGeometry = sphere.geometry;
    const sphereMaterial = sphere.material;
    const color = sphereMaterial.color;

    // パーティクル用の小さな球体ジオメトリを作成
    const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const particleMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1.0  // 光の強度を最大にする
    });

    // パーティクルを作成し、初期位置を球体の中心に設定
    const particles = [];
    for (let i = 0; i < 300; i++) {  // パーティクルの数をさらに増やす
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(sphere.position);
        particles.push(particle);
        scene.add(particle);
    }

    // パーティクルにより強い初速を与える
    particles.forEach(particle => {
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 6,  // 初速をさらに強くする
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
        );
        particle.userData = { velocity };
    });

    function updateParticles() {
        particles.forEach(particle => {
            particle.position.add(particle.userData.velocity);
        });

        // パーティクルがより広がったら停止し、シーンから削除
        if (particles[0].position.distanceTo(sphere.position) > 150) {  // 広がる距離をさらに延ばす
            particles.forEach(particle => {
                scene.remove(particle);
            });
            cancelAnimationFrame(animationId);
        } else {
            animationId = requestAnimationFrame(updateParticles);
        }
    }

    let animationId = requestAnimationFrame(updateParticles);
}


function checkAllParticlesStopped(velocities) {
    for (let i = 0; i < velocities.length; i += 3) {
        const speed = Math.sqrt(velocities[i] ** 2 + velocities[i + 1] ** 2 + velocities[i + 2] ** 2);
        if (speed >= 0.01) {
            return false;
        }
    }
    return true;
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