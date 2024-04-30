// Three.jsの基本設定
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // 背景色を白に設定
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 300); // カメラの位置を調整
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// コントロールの設定
const controls = setupControls(camera, renderer);

// TransformControlsの設定
const transformControls = setupTransformControls(camera, renderer, scene);

// グリッドヘルパーの追加
addGridHelper(scene);

// ポイントグループの読み込み
const pointGroupObjects = loadPointGroups(scene);

// パーティクルシステムの設定
const particleSystem = setupParticleSystem(scene);

// イベントリスナーの設定
setupEventListeners(transformControls, controls, camera, pointGroupObjects);

// デバイス設定の調整
adjustSettingsForDevice();

// シーン要素の設定
setupSceneElements();


// アニメーションループ
animate();


// 画像と枠、雲の平面を追加する関数
function setupSceneElements() {
    const textureLoader = new THREE.TextureLoader();
    const imgTexture = textureLoader.load('20220821-_MG_8759.jpg', function(texture) {
        const imgMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const imgGeometry = new THREE.PlaneGeometry(texture.image.width / 100, texture.image.height / 100);
        const imgMesh = new THREE.Mesh(imgGeometry, imgMaterial);
        imgMesh.position.set(0, 0, 0);
        scene.add(imgMesh);

        const frameMaterial = new THREE.LineBasicMaterial({ color: 0xFFC0CB });
        const frameGeometry = new THREE.EdgesGeometry(imgMesh.geometry);
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        imgMesh.add(frame);
    });

    // 星空の背景を追加（より密集）
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        size: 15,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.1,
        vertexColors: true
    });
    const stars = [];
    const starColors = [];
    const numStars = 20000; // 星の数を増やす
    for (let i = 0; i < numStars; i++) {
        const x = Math.random() * 400 - 200; // 星の範囲を広げる
        const y = Math.random() * 400 - 200;
        const z = Math.random() * 400 - 200;
        stars.push(x, y, z);
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        starColors.push(color.r, color.g, color.b);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 星空の動きを設定
    function animateStars() {
        starGeometry.attributes.position.array.forEach((v, i) => {
            if (i % 3 === 0) { // X座標
                const delta = (Math.random() - 0.5) * 5; // 動きを大きくする
                starGeometry.attributes.position.array[i] += delta;
            } else if (i % 3 === 1) { // Y座標
                const delta = (Math.random() - 0.5) * 0.2;
                starGeometry.attributes.position.array[i] += delta;
            } else { // Z座標
                const delta = (Math.random() - 0.5) * 0.2;
                starGeometry.attributes.position.array[i] += delta;
            }
        });
        starGeometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateStars);
    }
    animateStars();
}


function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

function adjustSettingsForDevice() {
    if (isMobileDevice()) {
        // モバイルデバイス用の設定
        renderer.setPixelRatio(window.devicePixelRatio);
        controls.enableDamping = false;
        controls.dampingFactor = 0.0;
        setupParticleSystem = setupMobileParticleSystem;
    } else {
        // デスクトップ用の設定
        renderer.setPixelRatio(1);
    }
}

function setupControls(camera, renderer) {
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

        // 垂直方向の回転角度の制限を設定
    const maxAngle = 30 * Math.PI / 180; // 45度をラジアンに変換
    controls.minPolarAngle = Math.PI / 2 - maxAngle; // 下限
    controls.maxPolarAngle = Math.PI / 2 + maxAngle; // 上限
    // 水平方向の回転角度の制限を設定
    const maxAzimuthAngle = 30 * Math.PI / 180; // 45度をラジアンに変換
    controls.minAzimuthAngle = -maxAzimuthAngle; // 左限
    controls.maxAzimuthAngle = maxAzimuthAngle; // 右限

    return controls;
}

function setupTransformControls(camera, renderer, scene) {
    const transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.setMode("rotate");
    scene.add(transformControls);
    return transformControls;
}

function addGridHelper(scene) {
    //const gridHelper = new THREE.GridHelper(200, 200);
    //scene.add(gridHelper);
}

function loadPointGroups(scene) {
    const fileNames = [

    ];
    const pointGroupObjects = [];
    const radius = 30;
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(light);
    fileNames.forEach((fileName, index) => {
        const angle = (index / fileNames.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        fetch(fileName)
            .then(response => response.text())
            .then(text => {
                const points = parseXYZ(text);
                const pointGroup = new THREE.Group();
                points.forEach(point => {
                    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
                    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
                    const material = new THREE.MeshPhongMaterial({
                        color: color,
                        specular: 0x555555,
                        shininess: 30
                    });
                    const cube = new THREE.Mesh(geometry, material);
                    cube.position.set(point.x, point.y, point.z);
                    pointGroup.add(cube);
                });
                pointGroup.position.set(x, 0, z);
                scene.add(pointGroup);
                pointGroupObjects.push(pointGroup);
            });
    });
    return pointGroupObjects;
}

function parseXYZ(data) {
    const points = [];
    const lines = data.split('\n');
    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length === 3) {
            const x = parseFloat(parts[0]) * 15;
            const y = parseFloat(parts[1]) * 20;
            const z = parseFloat(parts[2]) * 20;
            points.push({ x, y, z });
        }
    });
    return points;
}

function setupParticleSystem(scene) {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 9000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3); // カラー情報を格納する配列
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 200;
        colorsArray[i] = Math.random(); // RGBの各成分にランダムな値を設定
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3)); // カラー属性を追加

    // カスタム星形のジオメトリを作成
    const starShape = new THREE.Shape();
    starShape.moveTo(0, 0.5);
    for (let i = 1; i < 5; i++) {
        starShape.lineTo(Math.cos((0.8 * Math.PI * i) / 2) * 0.5, Math.sin((0.8 * Math.PI * i) / 2) * 0.5);
    }
    const starGeometry = new THREE.ShapeGeometry(starShape);

    // ギラギラ光る星のテクスチャを作成
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true, // 頂点カラーを使用
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    // 星形のパーティクルを作成
    const starPoints = new THREE.Points(starGeometry, particlesMaterial);

    // 光る効果を強化するために、光源を追加
    const pointLight = new THREE.PointLight(0xffffff, 2, 500);
    pointLight.position.set(0, 0, 250);
    scene.add(pointLight);

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);
    return particleSystem;
}
function setupMobileParticleSystem(scene) {
    const loader = new THREE.TextureLoader();
    const sakuraTexture = loader.load('00000124.png');
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500; // モバイル用にパーティクル数を減少
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 70;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.5,
        map: sakuraTexture,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);
    return particleSystem;
}

function setupEventListeners(transformControls, controls, camera, pointGroupObjects) {
    window.addEventListener('dblclick', function(event) {
        if (!isMobileDevice()) {
            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(pointGroupObjects, true);

            if (intersects.length > 0) {
                const selectedObject = intersects[0].object.parent;
                if (transformControls.object === selectedObject) {
                    if (transformControls.mode === 'rotate') {
                        transformControls.setMode('translate');
                    } else if (transformControls.mode === 'translate') {
                        transformControls.detach();
                    } else {
                        transformControls.setMode('rotate');
                    }
                } else {
                    transformControls.attach(selectedObject);
                    transformControls.setMode('rotate');
                }
            } else {
                transformControls.detach();
            }
        }
    });

    transformControls.addEventListener('dragging-changed', function(event) {
        controls.enabled = !event.value;
    });
}

function animate() {
    requestAnimationFrame(animate);
    updateParticles();
    controls.update();
    renderer.render(scene, camera);
}
function updateParticles() {
    let positions = particleSystem.geometry.attributes.position.array;
    let rotationSpeed = 0.01;
    const cosTheta = Math.cos(rotationSpeed);
    const sinTheta = Math.sin(rotationSpeed);

    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.1; // Y軸方向の移動（落下）
        if (positions[i + 1] < -50) {
            positions[i + 1] = 50; // 画面上部に戻す
        }
        // Y軸を中心に回転
        let x = positions[i];
        let z = positions[i + 2];
        positions[i] = x * cosTheta - z * sinTheta;
        positions[i + 2] = x * sinTheta + z * cosTheta;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
}