let scene, camera, renderer, controls, startButton;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 30);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(50, 50, 50);
    scene.add(light);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.maxPolarAngle = Math.PI / 4;
    controls.minPolarAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.minAzimuthAngle = -Math.PI / 4;

    startButton = document.createElement('button');
    startButton.innerHTML = '表示';
    startButton.id = 'startButton';
    document.body.appendChild(startButton);
    startButton.addEventListener('click', () => {
        setTimeout(() => {
            startButton.style.display = 'none';
            createWhaleShape();
            animate();
        }, 3000);
    });
}
function createWhaleShape(scaleFactor = 35, transitionDuration = 5000) {  // colorパラメータを削除
    const loader = new THREE.FileLoader();

    // XYZファイルのパス
    loader.load('9412d4291863_27d72b473c98_Make_a_whale_using_.xyz', function(data) {
        const points = [];
        const lines = data.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].trim().split(' ');
            if (parts.length === 3) {
                const x = parseFloat(parts[0]) * scaleFactor;  // スケール適用
                const y = parseFloat(parts[1]) * scaleFactor;  // スケール適用
                const z = parseFloat(parts[2]) * scaleFactor;  // スケール適用
                points.push(new THREE.Vector3(x, y, z));
            }
        }

        // 点群データをランダムに配置
        const randomPoints = points.map(p => new THREE.Vector3(
            p.x + (Math.random() - 0.5) * 200,
            p.y + (Math.random() - 0.5) * 200,
            p.z + (Math.random() - 0.5) * 200
        ));

        // 各点にランダムな色を設定
        const colors = [];
        for (let i = 0; i < points.length; i++) {
            const color = new THREE.Color(Math.random(), Math.random(), Math.random());
            colors.push(color.r, color.g, color.b);
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(randomPoints);
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({ size: 0.5, vertexColors: true });
        const pointsObject = new THREE.Points(geometry, material);
        scene.add(pointsObject);

        // ランダムに配置された点群をクジラの形状に徐々に移動させる
        const tween = new TWEEN.Tween({ t: 0 }).to({ t: 1 }, transitionDuration);
        tween.onUpdate(function (object) {
            const currentPoints = points.map((point, index) => {
                return new THREE.Vector3(
                    THREE.MathUtils.lerp(randomPoints[index].x, point.x, object.t),
                    THREE.MathUtils.lerp(randomPoints[index].y, point.y, object.t),
                    THREE.MathUtils.lerp(randomPoints[index].z, point.z, object.t)
                );
            });
            pointsObject.geometry.setFromPoints(currentPoints);
            pointsObject.geometry.attributes.position.needsUpdate = true;
        });
        tween.start();
    });
}
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    TWEEN.update();
    controls.update();
}

init();