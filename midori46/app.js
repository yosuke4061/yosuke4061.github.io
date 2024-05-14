import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';

let scene, camera, renderer, controls, stats;



function setupGUI(gltf) {
    const gui = new GUI();
    const material = gltf.scene.children[0].material; // 最初の子のマテリアルを取得

    // GUIの位置を画面の下部に設定
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '50px'; // 下から10pxの位置
    gui.domElement.style.right = '10px'; // 右から10pxの位置

    // 発光色の設定
    const emissiveData = {
        emissiveColor: material.emissive.getHex() // 初期発光色
    };

    // 発光色の変更
    gui.addColor(emissiveData, 'emissiveColor').onChange(function (value) {
        material.emissive.setHex(value);
    });

    // 発光強度の調整（レベル補正として使用）
    gui.add(material, 'emissiveIntensity', 0, 2).name('明るさ').onChange(function (value) {
        material.emissiveIntensity = value;
    });
}


function loadGLBModel() {
    const loader = new GLTFLoader();
    const modelPath = 'bb010ac29b9e_a5bf5d984aec_big_gear_min.glb';

    loader.load(modelPath, function (gltf) {
        scene.add(gltf.scene);
        console.log('GLBモデルが読み込まれ、シーンに追加されました。');

        setupGUI(gltf); // GUIのセットアップ

        // ドラッグコントロールの設定
        const objects = [gltf.scene]; // ドラッグ可能なオブジェクトの配列
        const dragControls = new DragControls(objects, camera, renderer.domElement);

        // ドラッグイベントのリスナー
        dragControls.addEventListener('dragstart', function (event) {
            controls.enabled = false; // OrbitControlsを無効にする
        });
        dragControls.addEventListener('dragend', function (event) {
            controls.enabled = true; // OrbitControlsを再度有効にする
        });

        // オブジェクトの発光を強化
        gltf.scene.children[0].material.emissive = new THREE.Color(0xffffff); // 白色の光
        gltf.scene.children[0].material.emissiveIntensity = 0; // 強度を最大に

    }, undefined, function (error) {
        console.error('GLBモデルの読み込み中にエラーが発生しました:', error);
    });
}



function init() {

     // カメラの作成
     camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
     camera.position.set(0, 5, 0);
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


    loadGLBModel();

    animate(); // アニメーションループを開始する
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

    // ポイントラ��トの追加
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

