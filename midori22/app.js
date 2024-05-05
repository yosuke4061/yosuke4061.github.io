let scene, camera, renderer, controls, startButton;
let buildings = []; // ビルを格納する配列
let swirlParticles;
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 100, 200); // カメラの位置を調整
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラが中心を向くように

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

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
    setupFPSCounter();  // FPSカウンターのセットアップを追加
    createRealisticCityscape();
    swirlParticles = createParticleSwirl(); // パーティクルの渦を作成
    addCentralImage();

}

function createRealisticCityscape() {
    const numberOfBuildings = 50;
    const maxBuildingHeight = 200;
    const minBuildingHeight = 50;
    const maxBuildingWidth = 70;
    const minBuildingWidth = 30;
    const maxBuildingDepth = 70;
    const minBuildingDepth = 30;

    const loader = new THREE.TextureLoader();
    const buildingTexture = loader.load('tower.png'); // ビルのテクスチャのパスを指定

    for (let i = 0; i < numberOfBuildings; i++) {
        const width = Math.random() * (maxBuildingWidth - minBuildingWidth) + minBuildingWidth;
        const height = Math.random() * (maxBuildingHeight - minBuildingHeight) + minBuildingHeight;
        const depth = Math.random() * (maxBuildingDepth - minBuildingDepth) + minBuildingDepth;
        const positionX = Math.random() * 1000 - 500;
        const positionZ = Math.random() * 1000 - 500;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            map: buildingTexture,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(positionX, height / 2, positionZ);
        scene.add(mesh);
        buildings.push(mesh); // ビルを配列に追加
    }

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 1000);
    pointLight.position.set(0, 300, 0);
    scene.add(pointLight);
}
const vertexShader = `
    uniform float size;
    attribute float pointSize;
    attribute vec3 customColor; // 頂点カラーを属性として追加
    varying vec3 vColor; // フラグメントシェーダーに色情報を渡すための変数

    void main() {
        vColor = customColor; // 頂点カラーを受け取る
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = pointSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying vec3 vColor; // 頂点シェーダーから受け取る色情報

    void main() {
        gl_FragColor = vec4(vColor, 1.0); // 受け取った色を使用
    }
`;
function createParticleSwirl() {
    const particleCount = 10000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * 200 - 100;
        const y = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;

        positions.push(x, y, z);

        // ランダムな色を生成
        color.setHSL(Math.random(), 1.0, 0.5); // HSL色空間で色を設定
        colors.push(color.r, color.g, color.b);

        const size = Math.random() * 2 + 0.1;
        sizes.push(size);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('pointSize', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3)); // シェーダーで使用するカラー属性

    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
            pointTexture: { value: new THREE.TextureLoader().load('path/to/particleTexture.png') }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        alphaTest: 0.9,
        transparent: true,
        vertexColors: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    return particles;
}

function addCentralImage() {
    const loader = new THREE.TextureLoader();
    loader.load('20221121-_MG_2979.jpg', function(texture) {
        // 画像の元の縦横比を取得
        const imageAspect = texture.image.width / texture.image.height;
        let planeWidth = 90; // 平面の幅を適当に設定
        let planeHeight = planeWidth / imageAspect; // 幅に基づいて高さを計算して縦横比を維持

        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);

        // 画像をシーンの中央に配置
        mesh.position.set(0, 0, 0);
        scene.add(mesh);
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

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3;
        controls.touchDampingFactor = 0.2;
    } else {
        controls.panSpeed = 0.5;
        controls.touchDampingFactor = 0.1;
    }
}

function setupFPSCounter() {
    const fpsCounter = document.createElement('div');
    fpsCounter.style.position = 'absolute';
    fpsCounter.style.top = '80px';
    fpsCounter.style.left = '10px';
    fpsCounter.style.color = 'white';
    document.body.appendChild(fpsCounter);

    const clock = new THREE.Clock();

    function updateFPS() {
        requestAnimationFrame(updateFPS);
        const delta = clock.getDelta();
        const fps = 1 / delta;
        fpsCounter.textContent = `FPS: ${Math.round(fps)}`;
        controls.update();
        renderer.render(scene, camera);
    }

    updateFPS();
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
    // ビルの上下運動
    buildings.forEach((building, index) => {
        const time = Date.now() * 0.001 + index; // 各ビルに異なる位相を与える
        building.position.y = building.geometry.parameters.height / 2 + Math.sin(time) * 100; // 上下運動
    });
    // パーティクルの渦巻き動作
    if (swirlParticles) {
        const positions = swirlParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            // 渦巻きパターンを計算
            positions[i] += Math.sin(y * 0.1 + (Date.now() * 0.001)) * 0.5;
            positions[i + 1] += Math.cos(x * 0.1 + (Date.now() * 0.001)) * 0.5;
            positions[i + 2] += Math.sin(z * 0.1 + (Date.now() * 0.001)) * 0.5;
        }
        swirlParticles.geometry.attributes.position.needsUpdate = true;
    }


    controls.update();
    renderer.render(scene, camera);
}

init();