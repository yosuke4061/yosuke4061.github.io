import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

let scene, camera, renderer, controls, stats,sunLight;
let sphere; 
let particles;
let particleCount = 1000;
let maxParticles = 5000;  // 最大パーティクル数
let currentParticleCount = 0;

function init() {
    
    // カメラの作成
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
    camera.position.set(100, 90, 1000);
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
    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

    // XYZ軸の矢印の作成
    //const axesHelper = new THREE.AxesHelper(10);  // サイズを大きく設定
    //scene.add(axesHelper);

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
    createCrystal();  // クリスタルを作成してシーンに追加
    createParticleExplosion();  // パーティクル生成
}


function createCrystal() {
    const terrain = scene.getObjectByName('terrain');
    if (!terrain) {
        console.error('Terrain object not found!');
        return;
    }

    // 球体ジオメトリの作成
    const geometry = new THREE.SphereGeometry(60, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00FFFF,
        specular: 0xFFFFFF,
        shininess: 100,
        emissive: 0x222222,
        transparent: true,
        opacity: 0.0
    });
    sphere = new THREE.Mesh(geometry, material);  // グローバル変数に格納
    sphere.position.set(0, 0, 0);
    scene.add(sphere);

    // 網目模様の作成
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframe = new THREE.LineSegments(wireframeGeometry);
    wireframe.material.vertexColors = true;
    const colors = [];
    const color = new THREE.Color();
    for (let i = 0; i < wireframeGeometry.attributes.position.count; i++) {
        color.setHSL((i / wireframeGeometry.attributes.position.count), 1.0, 0.5);
        colors.push(color.r, color.g, color.b);
    }
    wireframeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    sphere.add(wireframe);
    
    const loader = new THREE.TextureLoader();
    loader.load('20190203-20190203-DSC03583.jpg', function(texture) {
        const geometry = new THREE.SphereGeometry(50, 32, 32);  // 半径5、縦横32の分割で球体を作成
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide  // 球体の内側と外側の両方にテクスチャを適用
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(0, 0, 0);  // 球体の位置を原点に設定
        scene.add(sphere);
    });

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
    mesh.name = 'terrain'; // 地形オブジェクトに名前を設定
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


function addSunLight() {
    // 太陽の光源を作成
    sunLight = new THREE.DirectionalLight(0xffffff, 0.5); // 光の強さを調整
    sunLight.position.set(100, 100, 100); // 太陽の位置を設定

    // 太陽の光線がはっきり見えるように影を有効化
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048; // シャドウマップの解像度を高く設定
    sunLight.shadow.mapSize.height = 2048;

    // シャドウの範囲を調整
    sunLight.shadow.camera.left = -500;
    sunLight.shadow.camera.right = 500;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 1000;

    // シーンに太陽の光源を追加
    scene.add(sunLight);
    scene.add(sunLight.target);
}

function createParticleExplosion() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const alphas = new Float32Array(maxParticles);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3, true));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3, true));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1, true));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.75
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    setInterval(addParticles, 100);  // 100ミリ秒ごとにパーティクルを追加
}
function addParticles() {
    if (currentParticleCount < maxParticles) {
        const positions = particles.geometry.attributes.position.array;
        const colors = particles.geometry.attributes.color.array;
        const alphas = particles.geometry.attributes.alpha.array;

        for (let i = 0; i < particleCount * 3; i += 3) {
            if (currentParticleCount >= maxParticles) break;
            const x = Math.random() * 2 - 1;
            const y = Math.random() * 2 - 0;
            const z = Math.random() * 2 - 1;
            const direction = new THREE.Vector3(x, y, z).normalize().multiplyScalar(Math.random() * 50);
            const index = currentParticleCount * 3;
            positions[index] = direction.x;
            positions[index + 1] = direction.y;
            positions[index + 2] = direction.z;

            const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.5);
            colors[index] = color.r;
            colors[index + 1] = color.g;
            colors[index + 2] = color.b;

            alphas[currentParticleCount] = 1.0;  // 初期透明度を1.0に設定

            currentParticleCount++;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;
        particles.geometry.attributes.alpha.needsUpdate = true;
    }
}
function resetParticles(positions, colors, alphas) {
    for (let i = 0; i < positions.length; i += 3) {
        const x = Math.random() * 2 - 1;
        const y = Math.random() * 2 - 1;
        const z = Math.random() * 2 - 1;
        const direction = new THREE.Vector3(x, y, z).normalize().multiplyScalar(Math.random() * 50);  // 飛距離を伸ばす
        positions[i] = direction.x;
        positions[i + 1] = direction.y;
        positions[i + 2] = direction.z;

        const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.5);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;

        alphas[i / 3] = Math.random() * 0.5;  // 初期透明度をランダムに設定
    }
}


function setupScene() {
    // シーンの作成に関連する設定
    const SCENE_SETTINGS = {
        backgroundColor: 0x87CEEB,  // 薄い青色の背景
        fogColor: 0xF0F8FF,         // 雲海のような霧の色（薄い青白色）
        fogNear: 50,                // 霧の開始距離を近くに設定
        fogFar: 800,                // 霧の終了距離を遠くに設定
        ambientLightColor: 0x202020 // 環境光の色を暗く設定 
        //ambientLightColor: 0x404040 // 環境光の色
    };

    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);  // 背景色の設定
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);  // 霧の設定
    // 霧の密度を増やす
    scene.fog.density = 0.1; // 霧の密度を増やすことで粒子をはっきりと見せる

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

    addSunLight();
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

    // 拡大縮小の最大値を限定
    controls.minDistance = -100; // 最小距離
    controls.maxDistance = 1500; // 最大距離
    

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

    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        const alphas = particles.geometry.attributes.alpha.array;
        let resetNeeded = false;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] *= 1.007;  // 拡散速度を遅くする
            positions[i + 1] *= 1.007;
            positions[i + 2] *= 1.007;
            alphas[i / 3] = Math.min(alphas[i / 3] + 0.01, 1.0);  // 透明度を徐々に増加させる

            if (Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2) > 200) {
                resetNeeded = true;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.alpha.needsUpdate = true;

        // パーティクルが一定範囲を超えたらリセット
        if (resetNeeded) {
            resetParticles(positions, particles.geometry.attributes.color.array, alphas);
            particles.geometry.attributes.color.needsUpdate = true;
        }
    }



    // 太陽の光線の向きを時間とともに変化させる
    const time = Date.now() * 0.0009;
    const targetX = Math.sin(time) * 100;
    const targetY = Math.cos(time) * 100;
    sunLight.target.position.set(targetX, targetY, 0);
    // 球体が存在する場合、回転させる
    if (sphere) {
        sphere.rotation.y += 0.01;  // Y軸周りに回転
    }
    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

init();
animate();
