import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

let scene, camera, renderer, controls, stats;

function init() {
    
    // カメラの作成
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // シーンの設定を行う関数を呼び出す
    setupScene();  
    // コントロールの設定
    setupControls();

    // グリッドの平面の作成
    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    // XYZ軸の矢印の作成
    const axesHelper = new THREE.AxesHelper(10);  // サイズを大きく設定
    scene.add(axesHelper);

    // Statsの設定
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';  // 左側の位置指定を解除    
    document.body.appendChild(stats.dom);

    // ウィンドウリサイズのハンドリング
    window.addEventListener('resize', onWindowResize, false);

    

    addTerrain();

}
function addTerrain() {
    const worldWidth = 1024, worldDepth = 1024;
    const data = generateHeight(worldWidth, worldDepth);

    const geometry = new THREE.PlaneGeometry(5000, 5000, worldWidth - 1, worldDepth - 1);
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
        vertices[j + 1] = data[i] * 10;
    }

    const texture = new THREE.CanvasTexture(generateTexture(data, worldWidth, worldDepth));
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    // 法線マップの生成（generateTexture()からよりリアルな感じに
    const normalTexture = generateNormalMap(data, worldWidth, worldDepth);

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: normalTexture
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -500; // 地形の位置を下に調整
    scene.add(mesh);
}
function generateNormalMap(data, width, height) {
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = width;
    normalCanvas.height = height;
    const ctx = normalCanvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    const vector3 = new THREE.Vector3();

    for (let i = 0, j = 0, l = data.length; i < l; i++, j += 4) {
        vector3.x = data[i - 1] - data[i + 1];
        vector3.y = 2;
        vector3.z = data[i - width] - data[i + width];
        vector3.normalize();

        imageData.data[j] = vector3.x * 127 + 128;
        imageData.data[j + 1] = vector3.y * 127 + 128;
        imageData.data[j + 2] = vector3.z * 127 + 128;
        imageData.data[j + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(normalCanvas);
}
function generateHeight(width, height) {
    let seed = Math.PI / 4;
    window.Math.random = function() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const size = width * height, data = new Uint8Array(size);
    const perlin = new ImprovedNoise(), z = Math.random() * 100;

    let quality = 1;
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < size; i++) {
            const x = i % width, y = ~~(i / width);
            data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
        }
        quality *= 5;
    }

    return data;
}

function generateTexture(data, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const image = context.getImageData(0, 0, width, height);
    const imageData = image.data;
    const vector3 = new THREE.Vector3(0, 0, 0);
    const sun = new THREE.Vector3(1, 1, 1);
    sun.normalize();

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
        vector3.x = data[j - 2] - data[j + 2];
        vector3.y = 2;
        vector3.z = data[j - width * 2] - data[j + width * 2];
        vector3.normalize();

        const shade = vector3.dot(sun);
        imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
        imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
        imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);
    }

    context.putImageData(image, 0, 0);
    return canvas;
}

function setupScene() {
    // シーンの作成に関連する設定
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色
        fogColor: 0xaaccff,         // 霧の色
        fogNear: 200,                 // 霧の開始距離
        fogFar: 1500,               // 霧の終了距離
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
    controls.zoomSpeed = 2.0; // ズームの速度を上げる

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
animate();