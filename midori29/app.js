import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { FluidSimulation } from './FluidSimulation.js';
let scene, camera, renderer, controls, stats;
let fluidSimulation;

function init() {

    // カメラの作成
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 100, 100);
    camera.lookAt(0, 0, 0);

    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    //let startButton = document.getElementById('startButton');
    //startButton.addEventListener('click', () => {
    //    startButton.style.display = 'none';
    //    setTimeout(startAnimation, 3000);
    //});
    // シーンの設定を行う関数を呼び出す
    setupScene();  

    // グリッドの平面の作成
    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

    // XYZ軸の矢印の作成
    const axesHelper = new THREE.AxesHelper(10);  // サイズを大きく設定
    scene.add(axesHelper);


    // コントロールの設定
    setupControls();

    // Statsの設定
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';  // 左側の位置指定を解除    
    document.body.appendChild(stats.dom);

    // ウィンドウリサイズのハンドリング
    window.addEventListener('resize', onWindowResize, false);
    const fluidOptions = {
        particleCount: 1000,
        particleSize: 2,
        particleColor: 0x00ff00,

    };

    fluidSimulation = new FluidSimulation(scene, fluidOptions);

    animate();
}

function startAnimation() {
    // アニメーションに関連する初期設定や開始処理をここに記述

    
    animate(); // アニメーションループを開始する
}

function setupScene() {
    // シーンの作成に関連する設定
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色
        fogColor: 0xaaccff,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 1000,               // 霧の終了距離
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
    // FluidSimulation の更新
    fluidSimulation.update();

    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

init();
animate();