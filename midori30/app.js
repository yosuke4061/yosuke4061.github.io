import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
import { FluidSimulation } from './FluidSimulation.js';
let scene, camera, renderer, controls, stats;
let fluidSimulation;
let sphere; // 球体のグローバル参照
let group;

function init() {

    // カメラの作成
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        //setTimeout(startAnimation, 3000);
        startAnimation();
    });
  


    // ウィンドウリサイズのハンドリング
    window.addEventListener('resize', onWindowResize, false);

}

function startAnimation() {
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

    const fluidOptions = {
        particleCount: 1000,
        particleSize: 2,
        particleColor: 0x00ff00,

    };
    const cubes = addMovingCubes();
    fluidSimulation = new FluidSimulation(scene, fluidOptions,cubes);
    setupSceneObjects();
    animate(); // アニメーションループを開始する
}
function setupSceneObjects() {
    group = new THREE.Group(); // グループを作成

    // 球体の作成
    const sphereGeometry = new THREE.SphereGeometry(30, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true
    });
    sphere = new THREE.Mesh(sphereGeometry, wireframeMaterial); // グローバル変数に格納
    group.add(sphere); // グループに球体を追加

    // 画像の追加
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('_MG_6837.jpg', function(imageTexture) {
        const imageSize = 20;
        const aspectRatio = imageTexture.image.width / imageTexture.image.height;
        const geometry = new THREE.PlaneGeometry(imageSize * aspectRatio, imageSize);
        const material = new THREE.MeshBasicMaterial({
            map: imageTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.999
        });
        const imageMesh = new THREE.Mesh(geometry, material);
        group.add(imageMesh); // グループに画像を追加

    });
    // グループの位置を下げる
    group.position.y += 180; // 現在の位置から100単位下げる
    camera.position.set(200, 300, 0);
    camera.lookAt(0,180,0);
    
    scene.add(group); // シーンにグループを追加

}


function addMovingCubes() {
    const textureLoader = new THREE.TextureLoader();
    const cubeTexture = textureLoader.load('tower.png');
    const cubes = [];

    for (let i = 0; i < 50; i++) {
        const size = Math.random() * 5 + 1; // 1から6のランダムなサイズ
        const geometry = new THREE.BoxGeometry(size*5, size*5, size*5);
        const material = new THREE.MeshBasicMaterial({ map: cubeTexture });
        const cube = new THREE.Mesh(geometry, material);

        // ランダムな位置に配置
        cube.position.x = Math.random() * 150- 50; // -50から50の範囲でランダム
        cube.position.y = Math.random() * 150; // 0から50の範囲でランダム
        cube.position.z = Math.random() * 150 - 50; // -50から50の範囲でランダム


        cubes.push(cube);
        scene.add(cube);
    }
    return cubes;

}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色
        fogColor: 0xaaccff,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 500,               // 霧の終了距離
        ambientLightColor: 0x404040 // 環境光の色
    };

    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);
    //scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);

    // 環境光の追加
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

    // 球体の回転を更新
    if (group) {
        group.rotation.y += 0.01;
        group.rotation.x += 0.01;
    }
    // FluidSimulation の更新
    fluidSimulation.update();

    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

init();
