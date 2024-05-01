let scene, camera, renderer, controls, startButton;

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

    createWhaleShape();
    setupControls();
}

function createWhaleShape(color = 0xffffff) {
    const loader = new THREE.FileLoader();

    // XYZファイルのパス
    loader.load('9412d4291863_27d72b473c98_Make_a_whale_using_.xyz', function(data) {
        const points = [];
        const lines = data.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].trim().split(' ');
            if (parts.length === 3) {
                const x = parseFloat(parts[0]);
                const y = parseFloat(parts[1]);
                const z = parseFloat(parts[2]);
                points.push(new THREE.Vector3(x, y, z));
            }
        }

        // 元の点群データの数の20%を計算
        const numPoints = Math.floor(points.length * 0.2);

        // CatmullRomCurve3を使用して滑らかな曲線を生成
        const curve = new THREE.CatmullRomCurve3(points);
        const pointsSmooth = curve.getPoints(numPoints);
        const geometry = new THREE.BufferGeometry().setFromPoints(pointsSmooth);

        // 線のマテリアルを作成、色をパラメータから設定
        const material = new THREE.LineBasicMaterial({ color: color });

        // 線を作成
        const curveObject = new THREE.Line(geometry, material);
        scene.add(curveObject);

        // 追加の線を作成するための処理
        const additionalLinesMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // 緑色で追加の線を表示
        for (let i = 0; i < points.length; i += 5) { // 5点ごとに線を追加
            const segmentGeometry = new THREE.BufferGeometry();
            const segmentPoints = [];
            segmentPoints.push(points[i]);
            if (points[i + 5]) {
                segmentPoints.push(points[i + 5]);
            } else {
                segmentPoints.push(points[0]); // ループして最初の点に戻る
            }
            segmentGeometry.setFromPoints(segmentPoints);
            const line = new THREE.Line(segmentGeometry, additionalLinesMaterial);
            scene.add(line);
        }
    });
}


function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.minAzimuthAngle = -Math.PI / 4;
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