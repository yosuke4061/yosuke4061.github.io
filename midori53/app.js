import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;


function createProceduralClouds() {
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
    precision highp float;
    uniform float time;
    varying vec2 vUv;

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f*f*(3.0-2.0*f);

        float a = fract(sin(dot(i, vec2(12.9898,78.233))) * 43758.5453);
        float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898,78.233))) * 43758.5453);
        float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898,78.233))) * 43758.5453);
        float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898,78.233))) * 43758.5453);

        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
        float total = 0.0;
        float persistence = 0.5;
        int octaves = 8;
        float freq = 1.0;
        float amp = 0.5;
        for(int i = 0; i < octaves; i++) {
            total += noise(p * freq) * amp;
            freq *= 2.0;
            amp *= persistence;
        }
        return total;
    }

    void main() {
        vec2 p = vUv * 10.0 - vec2(10.0 * time * 0.1, 0.0);
        float q = fbm(p - time * 0.05);
        float fbmVal = fbm(p + q + time * 0.1);
        float alpha = smoothstep(0.4, 0.6, fbmVal);
        vec3 cloudColor = mix(vec3(1.0), vec3(0.427, 0.352, 0.388), fbmVal); // 0x6d5a63 に対応するRGB値に変更
        gl_FragColor = vec4(cloudColor, alpha);
    }
`;
    const uniforms = {
        time: { type: 'f', value: 0.0 }
    };

    const geometry = new THREE.SphereGeometry(500, 64, 64); // 球体ジオメトリの作成
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        side: THREE.BackSide, // 内側を向くように設定
        transparent: true
    });

    const cloudSphere = new THREE.Mesh(geometry, material);
    cloudSphere.position.set(0, 0, 0);
    scene.add(cloudSphere);

    addAnimationCallback(() => {
        uniforms.time.value += 0.001;  // 時間によるアニメーション効果
    });
}

let lastLightningTime = 0;
let lightningInterval = 1000; // 稲妻の生成間隔をミリ秒で設定

function createRefinedLightningEffect() {
    function generateRefinedLightning(startX, startY, startZ, endX, endY, endZ, depth) {
        if (depth > 2) return; // 分岐の深さを制限

        const points = [];
        const segments = Math.floor(Math.random() * 20 + 10); // 10から30のセグメント
        let x = endX, y = endY, z = endZ; // 終点から始める

        points.push(new THREE.Vector3(x, y, z)); // 終点を最初に追加
        const dx = (startX - endX) / segments;
        const dy = (startY - endY) / segments;
        const dz = (startZ - endZ) / segments;

        for (let i = 0; i < segments; i++) {
            x += dx + Math.random() * 20 - 10; // 前回のxから-10から10の範囲で変化
            y += dy + Math.random() * 20 - 10; // 前回のyから-10から10の範囲で変化
            z += dz + Math.random() * 20 - 10; // 前回のzから-10から10の範囲で変化
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, segments, 0.2, 20, false);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffff00, // 黄色に設定
            emissive: 0x222222, // 発光色を控えめに
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // ライトの追
        const light = new THREE.PointLight(0xffffff, 0.5, 100); // ライトの強度を下げる
        light.position.set(x, y, z);
        scene.add(light);

        // 稲妻のフェードアウトと削除
        let count = 0;
        function fadeOut() {
            if (count > 100) {
                scene.remove(mesh);
                scene.remove(light);
                return;
            }
            mesh.material.opacity = Math.max(0, 0.9 - (count / 100) * 0.9);
            light.intensity = Math.max(0, 0.5 - (count / 100) * 0.5); // ライトの強度を徐々に下げる
            mesh.material.needsUpdate = true;
            requestAnimationFrame(fadeOut);
            count++;
        }

        fadeOut();


    }

    function repeatRefinedLightning() {
        const currentTime = performance.now();
        if (currentTime - lastLightningTime > lightningInterval) {
            // ランダムな初期終���を生成
            const startX = Math.random() * 600 - 200; // -300から300の範囲で
            const startY = Math.random() * 600 - 200; // -300から300の範囲で
            const startZ = Math.random() * 600 - 100; // -300から300の範囲で
            const endX = Math.random() * 600 - 300;   // -300から300の範囲で
            const endY = Math.random() * 600 - 300;   // -300から300の範囲で
            const endZ = Math.random() * 600 - 300;   // -300から300の範囲で

            generateRefinedLightning(startX, startY, startZ, endX, endY, endZ, 0); // 分岐の深さは0
            lastLightningTime = currentTime;
            lightningInterval = Math.random() * 3000 ; // 次の稲妻までの間隔をランダムに設定
        }
    }

    addAnimationCallback(repeatRefinedLightning);
}

function displayImagesInCircle() {
    const imageNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const loader = new THREE.TextureLoader();
    const radius = 20; // 円の半径
    const angleStep = Math.PI * 2 / imageNames.length; // 画像を配置する角度のステップ

    imageNames.forEach((name, index) => {
        loader.load(`pic/${name}.jpg`, (texture) => {
            const aspectRatio = texture.image.width / texture.image.height;
            const imageWidth = 15; // 像の基本幅を設定
            const imageHeight = imageWidth / aspectRatio; // 縦横比に基づいて高さを計算
            const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(imageWidth, imageHeight, 1);
            const angle = angleStep * index;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            sprite.position.set(x, y, 0); // 画像を円周上に配置
            scene.add(sprite);

            // クリックイベントの追加
            sprite.userData = { isEnlarged: false, originalPosition: sprite.position.clone(), originalScale: sprite.scale.clone() };
        });
    });
}

function createRain() {
    const rainCount = 1000;
    const rainGeometry = new THREE.BufferGeometry();
    const rainMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.8,
        transparent: true
    });

    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
        positions[i * 3] = Math.random() * 400 - 200; // x
        positions[i * 3 + 1] = Math.random() * 500 - 250; // y
        positions[i * 3 + 2] = Math.random() * 400 - 200; // z
    }
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rain = new THREE.Points(rainGeometry, rainMaterial);
    scene.add(rain);

    addAnimationCallback(() => {
        const positions = rain.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 1.5; // y
            if (positions[i + 1] < -250) {
                positions[i + 1] = 250;
            }
        }
        rain.geometry.attributes.position.needsUpdate = true;
    });
}


function init() {

     // カメラの作成
     camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
     camera.position.set(0, 5, 10);
     camera.lookAt(0, 0, 0);
    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    document.body.appendChild(renderer.domElement);
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        // ローディングインジケーターを表示
        let loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';

        setupScene();
        setupControls();
        // アニメーションの開始を少し遅らせる
        setTimeout(() => {
            startAnimation();
            loadingIndicator.style.display = 'none';
        }, 2000);
    });

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
}

function onDocumentMouseDown(event) {
    event.preventDefault();

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    if (!scene) {
        return;
    }
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object instanceof THREE.Sprite) {
            toggleSprite(object);
        }
    }
}

function toggleSprite(sprite) {
    const userData = sprite.userData;
    if (!userData.isEnlarged) {
        // 拡大アニメーション
        userData.originalPosition = sprite.position.clone();
        userData.originalScale = sprite.scale.clone();
        userData.originalRenderOrder = sprite.renderOrder;
        sprite.renderOrder = 1000;

        let progress = 0;
        function animateScaleUp() {
            if (progress < 1) {
                progress += 0.05;
                const scale = userData.originalScale.clone().multiplyScalar(1 + 4 * progress);
                sprite.scale.copy(scale);
                requestAnimationFrame(animateScaleUp);
            } else {
                sprite.scale.set(userData.originalScale.x * 5, userData.originalScale.y * 5, 1);
            }
        }
        animateScaleUp();
        userData.isEnlarged = true;
    } else if (userData.isEnlarged && !userData.isScaling) {
        // 縮小アニメーション
        userData.isScaling = true; // スケーリング中フラグを設定
        let progress = 1;
        function animateScaleDown() {
            if (progress > 0) {
                progress -= 0.05;
                const scale = userData.originalScale.clone().multiplyScalar(1 + 4 * progress);
                sprite.scale.copy(scale);
                requestAnimationFrame(animateScaleDown);
            } else {
                sprite.scale.copy(userData.originalScale);
                sprite.position.copy(userData.originalPosition);
                sprite.renderOrder = userData.originalRenderOrder;
                userData.isEnlarged = false;
                userData.isScaling = false; // スケーリング中フラグを解除
            }
        }
        animateScaleDown();
    }
}



function startAnimation() {


    // グリッドの平面の作成
    const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

    // XYZ軸の矢印の作成
    const axesHelper = new THREE.AxesHelper(10);  // サイズを大きく設定
    //scene.add(axesHelper);

    // Statsの設定
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';  // 左側の位置指定を解除    
    document.body.appendChild(stats.dom);
    createRefinedLightningEffect();
    createProceduralClouds();
    displayImagesInCircle();
    createRain();
    animate(); // アニメーションループを開始する
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0x333344,  // 背景色を少し暗めの色に変更
        fogColor: 0x333344,         // 霧の色を背景色と同じに設定
        fogNear: 50,                 // 霧の開始距離を調整
        fogFar: 800,               // 霧の終了距離を調整
        ambientLightColor: 0xFFFFFF // 環境光の色
    };

    scene = new THREE.Scene();
    
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);

    // の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor);
    scene.add(ambientLight);

    // 平行光源の追加と設定の強化
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 光の強度を強くる
    directionalLight.position.set(0, 300, 500);
    scene.add(directionalLight);

    // スポットライトの追加
    const spotLight = new THREE.SpotLight(0xffffff, 2, 1000, Math.PI / 4, 0.25, 2); // 強度と減衰を調整
    spotLight.position.set(100, 300, 100);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // ポイントライトの追加
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 500); // 強度を少し上げる
    pointLight.position.set(-100, 200, -100);
    scene.add(pointLight);

    renderer.shadowMap.enabled = true;
    directionalLight.castShadow = true;
    spotLight.castShadow = true;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
}

function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI; // 180度
    controls.minPolarAngle = 0; // 0度
    controls.maxAzimuthAngle = Math.PI / 8; // 90度
    controls.minAzimuthAngle = -Math.PI; // -90度
    controls.enablePan = true;
    // ズームアウトの最大距離を設定
    controls.maxDistance = 50; // この値を適切な距離に設定してください

    // スマートフォンでの二点タッチによパン操作を有効にする
    controls.enableTouchPan = true;

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

let animationCallbacks = [];

function addAnimationCallback(callback) {
    animationCallbacks.push(callback);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // 登録されたすべてのアニメーションコールバックを実行
    animationCallbacks.forEach(callback => {
        callback();
    });

    renderer.render(scene, camera);
    stats.update();
}


init();
