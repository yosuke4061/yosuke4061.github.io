let scene, camera, renderer, controls, startButton,stats;
let shapes = []; // 形状を格納する配列
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

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

    createSuperShape3D();
}


function createSuperShape3D() {
    const numShapes = 100;
    const spread = 200;
    const scale = 18;
    const holeSize = 50; // 中央の空洞のサイズを定義

    const light = new THREE.PointLight(0xffffff, 0.5, 1000);
    light.position.set(50, 50, 50);
    scene.add(light);

    for (let n = 0; n < numShapes; n++) {
        const positions = [];
        const indices = [];
        const m = Math.floor(Math.random() * 11 + 1);
        const a = 1, b = 1;
        const n1 = Math.random() * 4 + 0.5;
        const n2 = Math.random() * 4 + 0.5;
        const n3 = Math.random() * 4 + 0.5;
        const numPoints = 128;

        for (let phi = 0; phi < 2 * Math.PI; phi += Math.PI / numPoints) {
            for (let theta = 0; theta < Math.PI; theta += Math.PI / numPoints) {
                const r = Math.pow(Math.pow(Math.abs(Math.cos(m * phi / 4) / a), n2) + Math.pow(Math.abs(Math.sin(m * phi / 4) / b), n3), -1 / n1);
                const x = r * Math.sin(theta) * Math.cos(phi) * scale;
                const y = r * Math.sin(theta) * Math.sin(phi) * scale;
                const z = r * Math.cos(theta) * scale;
                const index = positions.length / 3;
                positions.push(x, y, z);
                if (phi > 0 && theta > 0) {
                    const cols = numPoints + 1;
                    const a = index - 1;
                    const b = index - cols;
                    const c = index - cols - 1;
                    const d = index;
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 1.0, 0.75),
            flatShading: true,
            metalness: 0.5,
            roughness: 0.3
        });

        const shape = new THREE.Mesh(geometry, material);
        let posX = Math.random() * spread - spread / 2;
        let posY = Math.random() * spread - spread / 2;
        let posZ = Math.random() * spread - spread / 2;

        // 中央部分の空洞を作成するための条件
        if (Math.sqrt(posX * posX + posY * posY + posZ * posZ) < holeSize) {
            continue; // 中央部分の範囲内なら配置をスキップ
        }

        shape.position.set(posX, posY, posZ);
        scene.add(shape);
        shapes.push(shape); // 形状を配列に追加
    }
}

function updateShapes() {
    shapes.forEach(shape => {
        shape.rotation.x += 0.01;
        shape.rotation.y += 0.01;
        shape.position.x += Math.random() * 0.1 - 0.05;
        shape.position.y += Math.random() * 0.1 - 0.05;
        shape.position.z += Math.random() * 0.1 - 0.05;
    });
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

function animate() {
    requestAnimationFrame(animate);
    updateShapes(); // 形状の更新を行う関数を呼び出す
    controls.update();
    renderer.render(scene, camera);
}

init();
