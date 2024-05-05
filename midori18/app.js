let scene, camera, renderer, controls, startButton;
function init() {
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 150, 200); // カメラの位置を調整
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラが中心を向くように

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;  // ガンマ補正
      
    document.body.appendChild(renderer.domElement);


    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(0, 300, 500);
    scene.add(light);


    // 環境光を追加することで、全体的な明るさを向上
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
        loadCloudModel();
    });

    window.addEventListener('resize', onWindowResize, false);

    setupControls();


 

}

function loadCloudModel() {
    const loader = new THREE.GLTFLoader();
    const clouds = [];
    const cloudFiles = [
        '1.glb',
        '2.glb',
        '3.glb',
        '4.glb',
        '5.glb',
        '6.glb',
        '7.glb',
        '8.glb',
    ];

    // 雲の数に応じてX座標を均等に配置
    const numClouds = 20; // 雲の総数
    const spacing = 200; // 雲間のスペース

    for (let i = 0; i < numClouds; i++) {
        const fileIndex = Math.floor(Math.random() * cloudFiles.length);
        const cloudFile = cloudFiles[fileIndex];

        loader.load(
            cloudFile,
            function (gltf) {
                const cloud = gltf.scene;
                // X座標をグリッド状に配置
                const x = i * spacing - ((numClouds * spacing) / 2);
                const y = Math.random() * 200 + 100;  // Y位置を100から300の範囲に
                const z = (Math.random() * 2000 - 1000) * (Math.random() < 0.5 ? 1 : -1);
                cloud.position.set(x, y, z);

                const scale = Math.random() + 0.5;  // スケールをランダムに設定
                cloud.scale.set(scale * 300, scale * 170, scale * 150);

                cloud.traverse((child) => {
                    if (child.isMesh) {
                        child.material.color.setHex(0xffffff);
                        child.material.emissive = new THREE.Color(0xffffff);
                        child.material.emissiveIntensity = 0.5;
                    }
                });
                // ここで各雲の速度をランダムに設定
                const velocity = Math.random() * 0.5 + 0.1; // 0.1から0.6の範囲で速度を設定

                clouds.push({ cloud, velocity: Math.random() * 0.5 + 0.2, opacity: 0, initialX: x, initialY: y, initialZ: z }); // 初期位置を保存
                scene.add(cloud);
            },
            undefined,
            function (error) {
                console.error('An error happened while loading the model:', error);
            }
        );
    }

    function animateClouds() {
        clouds.forEach((cloudObj, index) => {
            cloudObj.cloud.position.x += cloudObj.velocity;
            cloudObj.cloud.position.y += Math.sin(Date.now() * 0.001) * 0.2;
    
            // 雲が画面外に出たら透明度を下げる
            if (cloudObj.cloud.position.x > 800 || cloudObj.cloud.position.x < -800) {
                cloudObj.opacity -= 0.005; // 透明度を徐々に下げる
                cloudObj.cloud.traverse((child) => {
                    if (child.isMesh) {
                        child.material.opacity = cloudObj.opacity;
                        child.material.transparent = true;
                    }
                });
    
                // 完全に透明になったら初期位置に戻す
                if (cloudObj.opacity <= 0) {
                    cloudObj.cloud.position.x = cloudObj.initialX; // 初期X位置にリセット
                    cloudObj.cloud.position.y = cloudObj.initialY; // Y位置も再設定
                    cloudObj.cloud.position.z = cloudObj.initialZ; // Z位置も再設定
                    cloudObj.opacity = 0; // 透明度を0にリセット
                    cloudObj.cloud.traverse((child) => {
                        if (child.isMesh) {
                            child.material.opacity = cloudObj.opacity;
                            child.material.transparent = true;
                            child.material.color.setHex(0xffffff); // 色を白にリセット
                            child.material.emissive.setHex(0xffffff); // 発光色も白にリセット
                        }
                    });
                }
            }
    
            // 雲が初期位置に戻ったら透明度を上げる
            if (cloudObj.cloud.position.x === cloudObj.initialX && cloudObj.opacity < 1) {
                cloudObj.opacity += 0.005; // 透明度を徐々に上げる
                cloudObj.cloud.traverse((child) => {
                    if (child.isMesh) {
                        child.material.opacity = cloudObj.opacity;
                        if (cloudObj.opacity > 0) {
                            child.material.transparent = false;
                        }
                    }
                });
            }
        });
    
        requestAnimationFrame(animateClouds);
        renderer.render(scene, camera);
    }

    animateClouds();
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