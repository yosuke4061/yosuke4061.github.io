import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;


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
        // アニメーションのを少し遅らせる
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
    displayImageWithToneCurve().then((material) => {
        const toneCurveParams = setupToneCurveControl(material);
        animate(); // アニメーションループを開始する
    });
    setupSceneWithToneCurveObjects();
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背景色
        fogColor: 0x000000,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,               // 霧の終了距離
        ambientLightColor: 0xFFFFFF // 環光の色
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
    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

const ToneCurveShader = {
    uniforms: {
        map: { type: 't', value: null },
        curveIntensity: { type: 'f', value: 1.0 },
        minBrightness: { type: 'f', value: 0.0 },
        maxBrightness: { type: 'f', value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D map;
        uniform float curveIntensity;
        uniform float minBrightness;
        uniform float maxBrightness;
        varying vec2 vUv;
        void main() {
            vec4 texColor = texture2D(map, vUv);
            float brightness = (texColor.r + texColor.g + texColor.b) / 3.0;
            brightness = clamp(brightness, minBrightness, maxBrightness);
            float curve = pow(brightness, curveIntensity);
            gl_FragColor = vec4(curve, curve, curve, 1.0) * texColor;
        }
    `
};

function displayImageWithToneCurve() {
    const textureLoader = new THREE.TextureLoader();
    return new Promise((resolve) => {
        textureLoader.load('20240406-_DSC2187.jpg', (texture) => {
            const aspectRatio = texture.image.width / texture.image.height;
            const geometry = new THREE.PlaneGeometry(aspectRatio, 1);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: texture },
                    curveIntensity: { value: 1.0 },
                    minBrightness: { value: 0.0 },
                    maxBrightness: { value: 1.0 }
                },
                vertexShader: ToneCurveShader.vertexShader,
                fragmentShader: ToneCurveShader.fragmentShader
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 0, 0);
            scene.add(mesh);
            resolve(material);
        });
    });
}

function setupToneCurveControl(material) {
    const gui = new GUI();
    const params = {
        curveIntensity: 1.0,
        minBrightness: 0.0,
        maxBrightness: 1.0
    };
    gui.add(params, 'curveIntensity', 0, 2, 0.01).onChange(value => {
        material.uniforms.curveIntensity.value = value;
    });
    gui.add(params, 'minBrightness', 0, 1, 0.01).onChange(value => {
        material.uniforms.minBrightness.value = value;
    });
    gui.add(params, 'maxBrightness', 0, 1, 0.01).onChange(value => {
        material.uniforms.maxBrightness.value = value;
    });
    return params;
}
function createToneCurveObject(geometry, imagePath) {
    const textureLoader = new THREE.TextureLoader();
    return new Promise((resolve) => {
        textureLoader.load(imagePath, (texture) => {
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: texture },
                    curveIntensity: { value: 1.0 },
                    minBrightness: { value: 0.0 },
                    maxBrightness: { value: 1.0 }
                },
                vertexShader: ToneCurveShader.vertexShader,
                fragmentShader: ToneCurveShader.fragmentShader
            });
            const object = new THREE.Mesh(geometry, material);
            object.position.set(0, 0, 0);
            scene.add(object);
            resolve(material);
        });
    });
}

function setupSceneWithToneCurveObjects() {
    const boxGeometry = new THREE.BoxGeometry(15, 15, 15); // 立方体
    const sphereGeometry = new THREE.SphereGeometry(5, 32, 32); // 球体

    createToneCurveObject(boxGeometry, '20240406-_DSC2187.jpg').then(material => {
        setupToneCurveControl(material); // GUIを設定
    });

    createToneCurveObject(sphereGeometry, '20240406-_DSC2187.jpg');
}
init();

