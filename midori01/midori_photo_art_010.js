// Three.jsの基本設定
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF); // 背景色を白に設定
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
    const imgTexture = textureLoader.load('_MG_8012.jpg', function(texture) {
        const imgMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }); // 両面表示
        const imgGeometry = new THREE.PlaneGeometry(texture.image.width / 100, texture.image.height / 100);
        const imgMesh = new THREE.Mesh(imgGeometry, imgMaterial);
        imgMesh.position.set(0, 0, 0);
        scene.add(imgMesh);

        // 画像の枠を追加
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0xFFC0CB }); // 薄ピンク色
        const frameGeometry = new THREE.EdgesGeometry(imgMesh.geometry);
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        imgMesh.add(frame);

        // 薄い雲のような平面を複数追加
        const cloudTexture = textureLoader.load('dark clouds.png');
        const cloudMaterial = new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true, opacity: 0.5 });
        const cloudGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
        for (let i = 0; i < 5; i++) {
            const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudMesh.position.set(Math.random() * 600 - 200, Math.random() * 600 - 200, -5 - i * 2);
            scene.add(cloudMesh);
        }
    });
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
    const loader = new THREE.TextureLoader();
    const sakuraTexture = loader.load('00000124.png');
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 9000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 200;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 1,
        map: sakuraTexture,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
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
