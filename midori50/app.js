import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;



function loadCloudMaterials() {
    const vertexShader = `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        varying vec2 vUv;

        void main(void) {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;
    const fragmentShader = `
        precision highp float;
        uniform sampler2D uTexture1;
        uniform sampler2D uTexture2;
        uniform float time;
        uniform float brightness;
        varying vec2 vUv;
        
        vec4 getCloudTexture(vec2 coordinates) {
            float aspectRatio = 1.6;
            coordinates.x *= aspectRatio;
            float angle = time * 0.001;
            float radius = 0.5;
            vec2 offset = vec2(cos(angle), sin(angle)) * radius;
            vec2 shiftedCoords1 = mod(coordinates + offset, 1.0);
            vec2 shiftedCoords2 = mod(coordinates - offset, 1.0);
            vec4 texture1 = texture2D(uTexture1, shiftedCoords1);
            vec4 texture2 = texture2D(uTexture2, shiftedCoords2);
            float blendFactor = 0.5 + 0.5 * sin(time * 0.005); // ブレンド係数を時間に応じて変化させる
            return mix(texture1, texture2, blendFactor);
        }
        
        void main(void) {
            vec2 uv = vUv;
            uv.x = mod(uv.x * 1.0, 1.0); // Prevent wrapping artifacts
            uv.y = mod(uv.y * 1.0, 1.0); // Prevent wrapping artifacts
            vec4 cloudTexture = getCloudTexture(uv);
            float alpha = smoothstep(0.2, 0.7, cloudTexture.r);
            float edgeFade = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
            alpha *= smoothstep(0.1, 0.2, edgeFade);
            float distanceFromCenter = length(uv - vec2(0.2, 0.2));
            float edgeRadius = 0.01;
            float edgeAlpha = smoothstep(edgeRadius, edgeRadius + 0.05, distanceFromCenter);
            alpha *= edgeAlpha;
            alpha *= cloudTexture.a;
            float border = 0.05;
            float edgeSmooth = smoothstep(0.0, border, edgeFade);
            alpha *= edgeSmooth;
            gl_FragColor = vec4(vec3(0.95, 0.95, 0.95) * cloudTexture.rgb * brightness, alpha);
        }
    `;
    const uniforms = {
        time: { type: 'f', value: 0.0 },
        brightness: { type: 'f', value: 1 },
        uTexture1: { type: 't', value: new THREE.TextureLoader().load('1.jpg') },
        uTexture2: { type: 't', value: new THREE.TextureLoader().load('12.jpg') }
    };

    uniforms.uTexture1.value.wrapS = uniforms.uTexture1.value.wrapT = THREE.RepeatWrapping;
    uniforms.uTexture2.value.wrapS = uniforms.uTexture2.value.wrapT = THREE.RepeatWrapping;
    uniforms.uTexture1.value.minFilter = THREE.NearestFilter;
    uniforms.uTexture2.value.minFilter = THREE.NearestFilter;
    const geometry = new THREE.SphereGeometry(800, 32, 32);
  
    const material = new THREE.RawShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        side: THREE.DoubleSide,
        transparent: true
    });

    const cloudSphere = new THREE.Mesh(geometry, material);
    cloudSphere.position.set(0, 0, 0);
    // 球体を90度左回転
    //cloudSphere.rotation.y = Math.PI ; // 90度回転
    //cloudSphere.rotation.z = Math.PI ; // 90度回転
    cloudSphere.rotation.x = Math.PI * 2; // 90度回転
    scene.add(cloudSphere);

    let direction = 1;
    addAnimationCallback(() => {
        if (uniforms.time.value >= 500) {
            direction = -1;
        } else if (uniforms.time.value <= -3) {
            direction = 1;
        }
        uniforms.time.value += 0.2 * direction;
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
        // ローディングインジケータ��を表示
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


     // 雲のシェーダーとテクスチャをロード
     loadCloudMaterials();
    animate(); // アニメーションループを開始する
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背景色
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
    controls.maxAzimuthAngle = Math.PI / 4; // 90度
    controls.minAzimuthAngle = -Math.PI / 4; // -90度
    controls.enablePan = true;

    // スマトフンでの二点タッチによるパン操作を有効にする
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


