let scene, camera, renderer, controls, startButton,stats;
let shapes = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xCCE5CC);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);

    startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
    });

    window.addEventListener('resize', onWindowResize, false);


    setupControls();
    addEnhancedSmokeEffect();
    addFlatSpiralRotationEffect();



}

function addFlatSpiralRotationEffect() {
    let cubes = [];
    let maxTrailCount = 50; // 各立方体のトレイルの最大数
    let maxHeight = 10; // Z軸の最大高さ

    // 立方体を20個生成し、それぞれ異なる初期設定を行う
    for (let i = 0; i < 150; i++) {
        const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const cubeMaterial = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, transparent: true, opacity: 1.0 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        scene.add(cube);

        cubes.push({
            cube: cube,
            angle: Math.random() * Math.PI * 2,
            speed: 0.01 + Math.random() * 0.02,
            radius: 2 + Math.random() * 3,
            zSpeed: 0.05 + Math.random() * 0.05,
            maxHeight: maxHeight,
            direction: Math.random() < 0.5 ? 1 : -1, // ランダムに上または下
            trail: []
        });
    }

    function updateCubePositions() {
        cubes.forEach((obj, index) => {
            obj.angle += obj.speed;
            obj.cube.position.x = obj.radius * Math.cos(obj.angle);
            obj.cube.position.y = obj.radius * Math.sin(obj.angle);

            // Z軸の更新
            if (obj.cube.position.z >= obj.maxHeight || obj.cube.position.z <= 0) {
                obj.direction *= -1; // 方向転換
            }
            obj.cube.position.z += obj.zSpeed * obj.direction;

            // トレイルの追加
            let trailCube = obj.cube.clone();
            trailCube.material = obj.cube.material.clone();
            trailCube.material.opacity = 0.5; // 初期の透明度
            scene.add(trailCube);
            obj.trail.push(trailCube);

            // トレイルの数が最大数を超えたら古いものから削除
            if (obj.trail.length > maxTrailCount) {
                let oldTrail = obj.trail.shift();
                scene.remove(oldTrail);
            }

            // トレイルの透明度を更新
            obj.trail.forEach(t => {
                t.material.opacity *= 0.95; // 透明度を徐々に下げる
            });
        });
    }

    shapes.push({ update: updateCubePositions }); // 更新関数を形状配列に追加
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
    
    // デバイスの種類に基づいてパラメータを調整
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        // スマートフォン用の設定
        controls.panSpeed = 0.3; // パンの速度を低く設定
        controls.touchDampingFactor = 0.2; // タッチ操作時のダンピング係数を高く設定
    } else {
        // PC用の設定
        controls.panSpeed = 0.5; // パンの速度を標準に設定
        controls.touchDampingFactor = 0.1; // タッチ操作時のダンピング係数を標準に設定
    }
}

function addEnhancedSmokeEffect() {
    const particles = 10000; // パーティクルの数を増やす
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < particles; i++) {
        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;
        positions.push(x, y, z);

        // 完全にランダムな色を設定
        color.setRGB(Math.random(), Math.random(), Math.random());
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function startAnimation() {
    animate();
}

// animate関数内で形状の位置を更新
function animate() {
    requestAnimationFrame(animate);
    shapes.forEach(shape => shape.update()); // 各形状の更新関数を呼び出す
    controls.update();
    renderer.render(scene, camera);
}

init();
