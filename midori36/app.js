import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;

let cloud;
let clock = new THREE.Clock(); // グローバルスコープでクロックを初期化

function init() {

     // カメラの作成
     camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
     camera.position.set(0, 5, 10);
     camera.lookAt(0, 0, 0);
    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000, 0); // クリアカラーを透明に設定
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

}

function startAnimation() {


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



    cloud = createVolumetricCloud();  // 雲を作成してシーンに追加
    animate(); // アニメーションループを開始する
}

function setupScene() {
    const SCENE_SETTINGS = {
        fogColor: 0x000000,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,                // 霧の終了距離
        ambientLightColor: 0xFFFFFF // 環色
    };

    scene = new THREE.Scene();
    // scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar); // 霧の設定をコメントアウト

    // CSSグラデーションを使用して背景を設定
    renderer.domElement.style.background = 'linear-gradient(to top, #87CEEB, #B0E0E6)'; // 明るい青空の色に変更

    // の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor);
    scene.add(ambientLight);

    // 平行光源の追加と設定の強化
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 光の強度を強くする
    directionalLight.position.set(0, 300, 500);
    scene.add(directionalLight);

    // スポットライトの追加
    const spotLight = new THREE.SpotLight(0xffffff, 1.5, 1000, Math.PI / 4, 0.5, 2);
    spotLight.position.set(100, 300, 100);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // ポイントライトの追加
    const pointLight = new THREE.PointLight(0xffffff, 1, 500);
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
    controls.maxAzimuthAngle = Math.PI / 2; // 90度
    controls.minAzimuthAngle = -Math.PI / 2; // -90度
    controls.enablePan = true;

    // スマートフォンでの二点タッチによるパン操作を有効にする
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

function animate() {
    requestAnimationFrame(animate);



    // 時間に基づいてユニフォームを更新
    const elapsedTime = clock.getElapsedTime();
    const slowFactor = 0.1;  // 時間の進行を遅くするためのファクター
    cloud.material.uniforms.time.value = elapsedTime * slowFactor;


    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

function createVolumetricCloud() {
    const cloudGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    cloudGeometry.scale(10000, 0.01, 10000);  // x軸方向にスケールを拡大して楕円体を形成

    const cloudMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vPosition;
            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vPosition;
            uniform float time;
            uniform float amplitude;
            uniform vec3 baseColor;
            uniform vec3 viewPosition;
            uniform samplerCube envMap;

            float rand(float n) {
                return fract(sin(n) * 43758.5453123);
            }

            float noise(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f*f*(3.0-2.0*f);

                float n = dot(i, vec3(1.0, 57.0, 113.0));

                float a = mix(rand(n), rand(n + 1.0), f.x);
                float b = mix(rand(n + 57.0), rand(n + 58.0), f.x);
                float c = mix(a, b, f.y);
                float d = mix(rand(n + 113.0), rand(n + 114.0), f.x);
                float e = mix(rand(n + 170.0), rand(n + 171.0), f.x);
                float f1 = mix(d, e, f.y);
                return mix(c, f1, f.z);
            }

            float density(vec3 position) {
                return noise(position * 0.09 + time * 0.5);//数値を変えれば密度が変わる
            }

            void main() {
                float d = density(vPosition);
                float alpha = smoothstep(0.5, 0.55, d);
                if (alpha < 0.1) discard;
                vec3 color = mix(vec3(1.0), baseColor, d);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        uniforms: {
            time: { value: 0.0 },
            amplitude: { value: 5.0 },
            baseColor: { value: new THREE.Color(0.8, 0.8, 0.9) }, // 雲の色を少し青みがかった白に設定
            viewPosition: { value: camera.position },
            envMap: { value: null }
        },
        transparent: true,
        side: THREE.DoubleSide
    });
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(0, 300, 0); // 雲の位置をより高い天井に設定
    scene.add(cloud);
    return cloud;
}

init();

