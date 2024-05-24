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
            vec2 p = vUv * 20.0 - vec2(20.0 * time * 0.1, 0.0); // Increase scale for more spread
            float q = fbm(p - time * 0.1);
            float fbmVal = fbm(p + q + time * 0.2);
            float alpha = smoothstep(0.3, 0.7, fbmVal); // Adjust alpha for more softness
            vec3 cloudColor = mix(vec3(0.6, 0.7, 0.8), vec3(1.0, 1.0, 1.0), fbmVal); // Adjust color for more natural look
            gl_FragColor = vec4(cloudColor, alpha);
        }
    `;

    const uniforms = {
        time: { type: 'f', value: 0.0 }
    };

    const geometry = new THREE.PlaneGeometry(4000, 4000, 100, 100); // Increase geometry size
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        transparent: true,
        side: THREE.DoubleSide
    });

    const cloudPlane = new THREE.Mesh(geometry, material);
    cloudPlane.position.set(0, 800, -1000); // Adjust position to simulate horizon
    cloudPlane.rotation.x = -Math.PI / 2;
    scene.add(cloudPlane);

    addAnimationCallback(() => {
        uniforms.time.value += 0.01; // Adjust time increment for smoother animation
    });
}


function init() {

     // カメラの作成
     camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
     camera.position.set(0, 5, 10);
     camera.lookAt(0, 0, 0);
    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    document.body.appendChild(renderer.domElement);
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        // ローディングインジケータを表示
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


    // リッドの平面の作
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


     
     createProceduralClouds();
    animate(); // アニメーションループを開始する
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色
        fogColor: 0x000000,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,               // 霧の了距離
        ambientLightColor: 0xFFFFFF // 環境光の色
    };

    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);

    // の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor);
    scene.add(ambientLight);

    // 平行光源の追加と設定の強化
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 光の強度を強くする
    directionalLight.position.set(0, 300, 500);
    scene.add(directionalLight);

    // スポットライトの加
    const spotLight = new THREE.SpotLight(0xffffff, 1.5, 1000, Math.PI / 4, 0.5, 2);
    spotLight.position.set(100, 300, 100);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // ポイントライトの追
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
    controls.maxAzimuthAngle = Math.PI / 4; // 90
    controls.minAzimuthAngle = -Math.PI / 4; // -90度
    controls.enablePan = true;

    // スマトフンで二点タッチによるパン操作を有効にする
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

