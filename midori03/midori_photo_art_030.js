// Three.jsの基本設定
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // 背景色を黒に設定
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50); // カメラの位置を調整
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

// シーン要素の設定関数
function setupSceneElements() {
    addImagePlane(scene);
    addStarField(scene);
    addRedStrings(scene);
}


function addRedStrings(scene) {
    const numStrings = 200; // 紐の数
    const strings = []; // 紐を格納する配列
    const stringMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 }); // 赤色

    for (let i = 0; i < numStrings; i++) {
        const points = [
            new THREE.Vector3((Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800),
            new THREE.Vector3((Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, stringMaterial);
        scene.add(line);
        strings.push({ line, geometry, points });
    }

    animateStrings(strings);
}
function animateStrings(strings) {
    strings.forEach(obj => {
        const { line, geometry, points } = obj;
        const speed = 10; // 伸びる速度

        function animate() {
            // 点をランダムに動かす
            points.forEach(point => {
                point.x += (Math.random() - 0.5) * speed;
                point.y += (Math.random() - 0.5) * speed;
                point.z += (Math.random() - 0.5) * speed;
            });

            // ジオメトリを更新
            geometry.setFromPoints(points);
            geometry.attributes.position.needsUpdate = true;

            requestAnimationFrame(animate);
        }

        animate();
    });
}

// 画像と枠を追加する関数
function addImagePlane(scene) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('20220102-_MG_1196.jpg', function(texture) {
        const imgMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const imgGeometry = new THREE.PlaneGeometry(texture.image.width / 100, texture.image.height / 100);
        const imgMesh = new THREE.Mesh(imgGeometry, imgMaterial);
        imgMesh.position.set(0, 0, 0);

        const frameMaterial = new THREE.LineBasicMaterial({ color: 0xFFC0CB });
        const frameGeometry = new THREE.EdgesGeometry(imgMesh.geometry);
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        imgMesh.add(frame);

        scene.add(imgMesh);
    });
}

// 星空の背景を追加する関数
function addStarField(scene) {
    const starGeometry = new THREE.BufferGeometry();
    const stars = [];
    const starColors = [];
    const numStars = 2000;

    for (let i = 0; i < numStars; i++) {
        stars.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
        const color = new THREE.Color(0xffffff);
        starColors.push(color.r, color.g, color.b);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: Math.random() * 0.5 + 0.1,
        sizeAttenuation: true,
        transparent: true,
        opacity: Math.random() * 0.5 + 0.5,
        vertexColors: true
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

// 星空の動きを設定する関数
function animateStars(starGeometry) {
    function animate() {
        starGeometry.attributes.position.array.forEach((v, i) => {
            if (i % 3 === 0) { // X座標
                const delta = (Math.random() - 0.5) * 5;
                starGeometry.attributes.position.array[i] += delta;
            } else if (i % 3 === 1) { // Y座標
                const delta = (Math.random() - 0.5) * 0.2;
                starGeometry.attributes.position.array[i] += delta;
            } else { // Z座標
                const delta = (Math                .random() - 0.5) * 0.2;
                starGeometry.attributes.position.array[i] += delta;
            }
        });
        starGeometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animate);
    }
    animate();
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
    const maxAngle = 30 * Math.PI / 180; // 30度をラジアンに変換
    controls.minPolarAngle = Math.PI / 2 - maxAngle; // 下限
    controls.maxPolarAngle = Math.PI / 2 + maxAngle; // 上限
    // 水平方向の回転角度の制限を設定
    const maxAzimuthAngle = 30 * Math.PI / 180; // 30度をラジアンに変換
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
    // グリッドヘルパーの追加は現在コメントアウトされています
}

function loadPointGroups(scene) {
    const fileNames = [];
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

function setupParticleSystem(scene, imageWidth, imageHeight) {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 9000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3); // カラー情報を格納する配列

    // パーティクルの初期位置を画像の中心に設定
    for (let i = 0; i < particlesCount * 3; i += 3) {
        posArray[i] = 0; // X座標
        posArray[i + 1] = 0; // Y座標
        posArray[i + 2] = 0; // Z座標
        colorsArray[i] = 1.0; // 赤色のR成分
        colorsArray[i + 1] = 0.0; // 赤色のG成分
        colorsArray[i + 2] = 0.0; // 赤色のB成分
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);

    // アニメーション関数を追加
    animateParticles(particleSystem, imageWidth, imageHeight);
    return particleSystem;
}

function animateParticles(particleSystem, imageWidth, imageHeight) {
    const positions = particleSystem.geometry.attributes.position.array;
    const velocity = new Float32Array(positions.length);

    // 初期速度をランダムに設定
    for (let i = 0; i < positions.length; i += 3) {
        velocity[i] = (Math.random() - 0.5) * 2; // X方向の速度
        velocity[i + 1] = (Math.random() - 0.5) * 2; // Y方向の速度
        velocity[i + 2] = (Math.random() - 0.5) * 2; // Z方向の速度
    }

    function update() {
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocity[i];
            positions[i + 1] += velocity[i + 1];
            positions[i + 2] += velocity[i + 2];

            // 画像の範囲を超えたら速度を反転
            if (Math.abs(positions[i]) > imageWidth / 2 || Math.abs(positions[i + 1]) > imageHeight / 2) {
                velocity[i] *= -0.5;
                velocity[i + 1] *= -0.5;
                velocity[i + 2] *= -0.5;
            }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(update);
    }

    update();
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
    let rotationSpeed = 0.01; // 回転速度
    const moveSpeed = 0.2; // 移動速度

    for (let i = 0; i < positions.length; i += 3) {
        // Y軸を中心に回転
        let x = positions[i];
        let z = positions[i + 2];
        const cosTheta = Math.cos(rotationSpeed);
        const sinTheta = Math.sin(rotationSpeed);

        positions[i] = x * cosTheta - z * sinTheta; // X座標の更新
        positions[i + 2] = x * sinTheta + z * cosTheta; // Z座標の更新

        // Z軸方向に移動
        positions[i + 2] += moveSpeed;

        // パーティクルが一定の距離を超えたら、初期位置に戻す
        if (positions[i + 2] > 300) {
            positions[i + 2] = -300;
        }
    }

    // ジオメトリの位置情報を更新
    particleSystem.geometry.attributes.position.needsUpdate = true;
}