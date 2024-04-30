let scene, camera, renderer, controls, light,particleGroup;
let particleType = 'sphere'; // 'sphere', 'box', 'sprite'
let loader = new THREE.GLTFLoader();

function init() {
    const canvas = document.getElementById('webgl-canvas');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // 背景色を白に設定

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 200);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

    light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(50, 50, 50);
    scene.add(light);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.minAzimuthAngle = -Math.PI / 4;

    // パーティクルグループの追加
    particleGroup = new THREE.Group();
    addParticles();
    scene.add(particleGroup);

    addBackground(); // 背景を追加
    addRotatingSphere(); // 回転する球体を追加
    addCenterImage();
    window.addEventListener('resize', onWindowResize, false);

    animate();
}
function addRotatingSphere() {
    const sphereGeometry = new THREE.SphereGeometry(15, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 0, 0); // 中央に配置
    scene.add(sphere);

    // アニメーション関数内で球体を回転させる
    function rotateSphere() {
        requestAnimationFrame(rotateSphere);
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
    }

    rotateSphere(); // 回転アニメーションを開始
}

function addBackground() {
    const loader = new THREE.GLTFLoader();
    const radius = 150; // 円の半径
    const numObjects = 120; // 配置するオブジェクトの数

    loader.load('0e66d003e070_cb873327fca1_Wall_with_luxurious.glb', function(gltf) {
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff }); // 光を反射するマテリアルに変更
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.material = material;
            }
        });

        for (let i = 0; i < numObjects; i++) {
            const angle = 2 * Math.PI * (i / numObjects); // 0 から 2π までの角度

            const model = gltf.scene.clone();
            model.scale.set(98, 98, 98); // スケール調整
            model.position.set(
                radius * Math.cos(angle), // X座標
                radius * Math.sin(angle),
                0                      // Y座標
            );
            model.rotation.y = -angle + Math.PI / 2; // 各モデルが中心を向くように調整
            scene.add(model);
        }
    }, undefined, function(error) {
        console.error('An error happened', error);
    });
}

function addParticles() {
    const textureLoader = new THREE.TextureLoader();
    const spriteMaterial = new THREE.SpriteMaterial({
        map: textureLoader.load('pic02.png')
    });

    for (let i = 0; i < 300; i++) {
        let particle;
        switch (particleType) {
            case 'sphere':
                const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
                const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
                particle = new THREE.Mesh(sphereGeometry, sphereMaterial);
                break;
            case 'box':
                const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
                const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
                particle = new THREE.Mesh(boxGeometry, boxMaterial);
                break;
            case 'sprite':
                particle = new THREE.Sprite(spriteMaterial);
                particle.scale.set(5, 5, 1);
                break;
        }
        particle.position.set(0, 0, 0); // Start from the center
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        particleGroup.add(particle);
    }
}
function addCenterImage() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('20220102-_MG_1198.jpg', function(tex) {
        // テクスチャがロードされた後にアスペクト比を取得
        const aspectRatio = tex.image.width / tex.image.height;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: tex,
            side: THREE.DoubleSide // 両面が表示されるように設定
        }));
        sprite.scale.set(10 * aspectRatio, 10, 1); // アスペクト比に基づいてスケールを設定
        sprite.position.set(0, 0, 0); // 中央に配置
        scene.add(sprite);

        // 枠を追加
        const outerRadius = 7.5; // 枠の外半径を調整
        const geometry = new THREE.RingGeometry(outerRadius, outerRadius + 0.5, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(geometry, material);
        ring.position.set(0, 0, 0.1); // 画像のすぐ前に配置
        scene.add(ring);
    });
}
function updateParticles() {
    const resetDistance = 150; // パーティクルがこの距離を超えたらリセット

    particleGroup.children.forEach(particle => {
        particle.position.add(particle.velocity);

        // 中心からの距離を計算
        if (particle.position.length() > resetDistance) {
            // パーティクルを中心にリセットし、新しい速度を与える
            particle.position.set(0, 0, 0);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateParticles();  // パーティクルの動きを更新
    renderer.render(scene, camera);

}

document.getElementById('startButton').addEventListener('click', function () {
    init();

    this.style.display = 'none';
});