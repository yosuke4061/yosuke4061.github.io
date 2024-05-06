import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

let scene, camera, renderer, controls, stats;
let speed = 5; // 初期速度

function init() {

    // カメラの作成
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // シーンの設定を行う関数を呼び出す
    setupScene();  

    // グリッドの平面の作成
    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

    // XYZ軸の矢印の作成
    //const axesHelper = new THREE.AxesHelper(10);  // サイズを大きく設定
    //scene.add(axesHelper);


    // コントロールの設定
    setupControls();

    // Statsの設定
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';  // 左側の位置指定を解除    
    document.body.appendChild(stats.dom);

    // ウィンドウリサイズのハンドリング
    window.addEventListener('resize', onWindowResize, false);
// イベントリスナーの追加
document.addEventListener('click', () => {
    speed -= 1; // クリックするごとに速度を減少
    if (speed < 1) speed = 1; // 速度が1未満にならないように制限
});

document.addEventListener('dblclick', () => {
    speed += 1; // ダブルクリックするごとに速度を増加
    if (speed > 10) speed = 10; // 速度が10を超えないように制限
});

    createGalaxy();
    createWarpEffectWithLines();
}

function createWarpEffectWithLines() {
    const starGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000); // 星のX座標
        const y = THREE.MathUtils.randFloatSpread(2000); // 星のY座標
        const z = THREE.MathUtils.randFloatSpread(2000); // 星のZ座標
        vertices.push(x, y, z);
        vertices.push(x, y, z + 100); // 線の終点をZ軸方向にさらに長く設定

        // ランダムな色を生成
        const startColor = new THREE.Color(Math.random(), Math.random(), Math.random());
        const endColor = new THREE.Color(Math.random(), Math.random(), Math.random());
        colors.push(startColor.r, startColor.g, startColor.b);
        colors.push(endColor.r, endColor.g, endColor.b);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const starMaterial = new THREE.LineBasicMaterial({ vertexColors: true });
    const starField = new THREE.LineSegments(starGeometry, starMaterial);
    scene.add(starField);

    // ワープエフェクトのアニメーション
    function animateWarp() {
        const positions = starGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 6) { // 2点で1セットなので6ずつ増やす
            positions[i + 2] += 20; // Z座標を更新
            positions[i + 5] += 20; // 終点のZ座標も更新
            if (positions[i + 2] > 2000) {
                positions[i + 2] -= 4000; // 始点をリセット
                positions[i + 5] -= 4000; // 終点をリセット
            }
        }
        starGeometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateWarp);
        renderer.render(scene, camera);
    }

    animateWarp();
}

const vertexShader = `
    attribute float size;
    varying vec3 vColor;
    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying vec3 vColor;
    void main() {
        float intensity = 0.1 + 0.9 * (1.0 - distance(gl_PointCoord, vec2(0.5, 0.5)));
        gl_FragColor = vec4(vColor * intensity, 1.0);
    }
`;
function createGalaxy() {
    const galaxyGeometry = new THREE.BufferGeometry();
    const particles = 20000;
    const positions = [];
    const sizes = [];
    const colors = [];
    const color = new THREE.Color();

    const spiralArms = 3;
    const spread = 0.5;

    for (let i = 0; i < particles; i++) {
        const armIndex = i % spiralArms;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * 500; // 銀河の半径
        const armAngle = angle + Math.PI * 2 * (armIndex / spiralArms) + Math.log(radius + 1) * spread;

        const x = Math.cos(armAngle) * radius;
        const y = Math.random() * 50 - 25; // 銀河の厚み
        const z = Math.sin(armAngle) * radius;

        positions.push(x, y, z);
        sizes.push((0.5 + Math.random() * 0.5) * 5.0);

        const hue = (radius / 500) * 0.8; // 中心に近いほど暖色
        color.setHSL(hue, 0.8, 0.5 + Math.random() * 0.5);
        colors.push(color.r, color.g, color.b);
    }

    galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    galaxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const galaxyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
    });

    const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);

    // アニメーション関数
    function animateGalaxy() {
        const positions = galaxyGeometry.attributes.position.array;
        for (let i = 2; i < positions.length; i += 3) {
            positions[i] += speed; // Z座標を増加させる（視聴者から遠ざかる）
            if (positions[i] > 500) { // 一定距離を超えたらリセット
                positions[i] -= 1000; // Z座標をリセット
            }
        }
        galaxyGeometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateGalaxy);
        renderer.render(scene, camera);
    }

    animateGalaxy();
}



function setupScene() {
    // シーンの作成に関連する設定
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色
        fogColor: 0xaaccff,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 1000,               // 霧の終了距離
        ambientLightColor: 0x404040 // 環境光の色
    };

    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);  // 背景色の設定
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);  // 霧の設定

    // 環境光の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor);
    scene.add(ambientLight);

    // 平行光源の追加
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // シャドウの有効化
    renderer.shadowMap.enabled = true;
    directionalLight.castShadow = true;

    // シャドウの設定
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ソフトシャドウ
    directionalLight.shadow.mapSize.width = 1024; // シャドウマップの幅
    directionalLight.shadow.mapSize.height = 1024; // シャドウマップの高さ
    directionalLight.shadow.camera.near = 0.5; // シャドウカメラのニアクリップ
    directionalLight.shadow.camera.far = 500; // シャドウカメラのファークリップ
}
function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;

    // 上下の回転制限を180度に設定
    controls.maxPolarAngle = Math.PI; // 180度
    controls.minPolarAngle = 0; // 0度 (下向きの回転を防ぐため)

    // 左右の回転制限を90度に設定
    controls.maxAzimuthAngle = Math.PI / 2; // 90度
    controls.minAzimuthAngle = -Math.PI / 2; // -90度

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

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

init();
animate();