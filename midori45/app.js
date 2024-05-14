import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

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
    createMultipleGears();
    //createShaderGear();
    animate(); // アニメーションループを開始する
}

function createMultipleGears() {
    const gearsData = [
        { radius: 2, teethCount: 20, position: { x: 0, y: 0, z: 0 }, rotationSpeed: 0.01, toothType: 'type1' },
        { radius: 1.5, teethCount: 15, position: { x: 5, y: 0, z: 0 }, rotationSpeed: 0.02, toothType: 'type2' },
        { radius: 3, teethCount: 30, position: { x: -5, y: 0, z: 0 }, rotationSpeed: 0.005, toothType: 'type3' }
    ];

    gearsData.forEach(gearData => {
        const gear = createGear(gearData.radius, gearData.teethCount, gearData.rotationSpeed, gearData.toothType);
        gear.position.set(gearData.position.x, gearData.position.y, gearData.position.z);
        scene.add(gear);
    });

    function createGear(radius, teethCount, rotationSpeed, toothType) {
        const toothProfileShape = new THREE.Shape();

        // 歯の形状をタイプに応じて定義し、大きさを調整
        switch (toothType) {
            case 'type1':
                toothProfileShape.moveTo(0, 0);
                toothProfileShape.lineTo(0.2, 0);  // 横幅を増加
                toothProfileShape.lineTo(0.2, 0.2);  // 高さを増加
                toothProfileShape.lineTo(0.1, 0.3);  // 頂点を上に移動
                toothProfileShape.lineTo(0, 0.2);
                break;
            case 'type2':
                toothProfileShape.moveTo(0, 0);
                toothProfileShape.lineTo(0.2, 0);
                toothProfileShape.lineTo(0.2, 0.4);  // 高さを増加
                toothProfileShape.lineTo(0, 0.4);
                break;
            case 'type3':
                toothProfileShape.moveTo(0, 0);
                toothProfileShape.lineTo(0.3, 0);  // 横幅を増加
                toothProfileShape.lineTo(0.3, 0.2);
                toothProfileShape.lineTo(0.15, 0.4);  // 頂点を上に移動
                toothProfileShape.lineTo(0, 0.2);
                break;
        }

        const extrudeSettings = {
            steps: 2,
            depth: 0.2,  // 厚みを増加
            bevelEnabled: false
        };

        const toothGeometry = new THREE.ExtrudeGeometry(toothProfileShape, extrudeSettings);
        const shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                time: { value: 0.0 }
            }
        });

        const gearGroup = new THREE.Group();

        for (let i = 0; i < teethCount; i++) {
            const tooth = new THREE.Mesh(toothGeometry, shaderMaterial);
            const angle = (i / teethCount) * Math.PI * 2;
            tooth.position.x = Math.cos(angle) * radius;
            tooth.position.y = Math.sin(angle) * radius;
            tooth.rotation.z = angle - Math.PI / 2;
            gearGroup.add(tooth);
        }

        function animateGear() {
            requestAnimationFrame(animateGear);
            gearGroup.rotation.z += rotationSpeed;
            shaderMaterial.uniforms.time.value += 0.05;
            renderer.render(scene, camera);
        }

        animateGear();
        return gearGroup;
    }
}




const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float time;
varying vec2 vUv;

void main() {
    vec3 color = vec3(0.5 + 0.5 * sin(time + vUv.x * 2.0), 0.5 + 0.5 * cos(time + vUv.y * 2.0), sin(time));
    gl_FragColor = vec4(color, 1.0);
}
`;
function createShaderGear() {
    const teethCount = 20; // 歯の数
    const toothProfileShape = new THREE.Shape();
    const gearRadius = 2;
    const toothHeight = 0.2;
    const toothDepth = 0.1;

    // 歯のプロファイルを定義
    toothProfileShape.moveTo(0, 0);
    toothProfileShape.lineTo(0.1, 0);
    toothProfileShape.lineTo(0.1, 0.1);
    toothProfileShape.lineTo(0.05, 0.15);
    toothProfileShape.lineTo(0, 0.1);
    toothProfileShape.lineTo(0, 0);

    const extrudeSettings = {
        steps: 2,
        depth: toothDepth,
        bevelEnabled: false
    };

    const toothGeometry = new THREE.ExtrudeGeometry(toothProfileShape, extrudeSettings);
    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            time: { value: 0.0 }
        }
    });

    const gearGroup = new THREE.Group();

    for (let i = 0; i < teethCount; i++) {
        const tooth = new THREE.Mesh(toothGeometry, shaderMaterial);
        const angle = (i / teethCount) * Math.PI * 2;
        tooth.position.x = Math.cos(angle) * gearRadius;
        tooth.position.y = Math.sin(angle) * gearRadius;
        tooth.rotation.z = angle - Math.PI / 2;
        gearGroup.add(tooth);
    }

    scene.add(gearGroup);

    function animateGear() {
        requestAnimationFrame(animateGear);
        gearGroup.rotation.z += 0.01;
        shaderMaterial.uniforms.time.value += 0.05;
        renderer.render(scene, camera);
    }

    animateGear();
}




function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背景色
        fogColor: 0x000000,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,               // 霧の終了距離
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

init();

