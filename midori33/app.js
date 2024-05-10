import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;
let liquidSphere;

function init() {

     // カメラの作成
     camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
     camera.position.set(0, 50, 60);
     camera.lookAt(0, 0, 0);
    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
            // シーンの設定を行う関数を呼び出す
            setupScene(); 
            // コントロールの設定
            setupControls();
            //setTimeout(startAnimation, 3000);
            startAnimation();
    });
  


    // ウィンドウリサ��ハンドリ
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

 

    liquidSphere = createLiquidSphere(0xFF0000, 10, new THREE.Vector3(0, 5, 10), camera);


    animate(); // アニメーションループを開始する
}




function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色
        fogColor: 0xaaccff,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 500,               // 霧の終了距離
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

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3;
        controls.touchDampingFactor = 0.2;
    } else {
        controls.panSpeed = 0.5;
        controls.touchDampingFactor = 0.1;
    }

    // ドラッグコントロールの追加
    const dragControls = new DragControls([...scene.children], camera, renderer.domElement);
    dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false; // ドラッグ中はOrbitControlsを無効化
    });
    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true; // ドラッグ終了後はOrbitControlsを再度有効化
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createLiquidSphere(color, size, position, camera) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float time;
            uniform float amplitude;

            float rand(float n) {
                return fract(sin(n) * 43758.5453123);
            }

            float noise(vec3 point) {
                vec3 i = floor(point);
                vec3 f = fract(point);
                f = f * f * (3.0 - 2.0 * f);
                float n = dot(i, vec3(1.0, 57.0, 113.0));
                float a = mix(rand(n), rand(n + 1.0), f.x);
                float b = mix(rand(n + 57.0), rand(n + 58.0), f.x);
                float c = mix(a, b, f.y);
                float d = mix(rand(n + 113.0), rand(n + 114.0), f.x);
                float e = mix(rand(n + 170.0), rand(n + 171.0), f.x);
                float f1 = mix(d, e, f.y);
                return mix(c, f1, f.z);
            }

            void main() {
                vUv = uv;
                vec3 pos = position;
                float offset = noise(position * 0.5 + time * 0.5) * amplitude;
                pos += normal * offset;
                vNormal = normalize(normalMatrix * normal);
                vPosition = pos;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 baseColor;
            uniform vec3 viewPosition; // 名前を変更
            uniform float time;

            void main() {
                vec3 viewDirection = normalize(viewPosition - vPosition);
                float fresnelEffect = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 3.0) * 0.5;
                vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.75));
                float intensity = max(dot(vNormal, lightDirection), 0.0);
                float specular = pow(intensity, 20.0) * 2.0;
                float alpha = 0.3 + 0.7 * (1.0 - intensity);
                vec3 color = mix(baseColor, vec3(1.0, 1.0, 1.0), intensity); // baseColor を使用
                gl_FragColor = vec4(color * (1.0 + specular) + vec3(fresnelEffect), alpha);
            }
        `,
        uniforms: {
            time: { value: 0.0 },
            amplitude: { value: 5.0 }, // 振幅の初期値
            baseColor: { value: new THREE.Color(color) },
            viewPosition: { value: camera.position }
        },
        transparent: true
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position.x, position.y, position.z);
    scene.add(sphere);

    return sphere;
}

function animate() {
    requestAnimationFrame(animate);

    liquidSphere.material.uniforms.time.value += 0.05;

    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

init();

