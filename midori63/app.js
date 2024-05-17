import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;

function setupComplexWireframes() {
    const geometries = [
        new THREE.BoxGeometry(6, 6, 6), // サイズを 3 から 6 に変更
        new THREE.SphereGeometry(4, 32, 32), // 半径を 2 から 4 に変更
        new THREE.ConeGeometry(4, 12, 32), // 半径と高さをそれぞれ 2 から 4、6 から 12 に変更
        new THREE.TorusGeometry(4, 1, 16, 100), // 半径を 2 から 4 に、チューブの半径を 0.5 から 1 に変更
        new THREE.TorusKnotGeometry(4, 1, 100, 16), // 同上
        new THREE.DodecahedronGeometry(4, 0), // 半径を 2 から 4 に変更
        new THREE.IcosahedronGeometry(4, 0), // 同上
        new THREE.OctahedronGeometry(4, 0), // 同上
        new THREE.TetrahedronGeometry(4, 0), // 同上
        new THREE.CylinderGeometry(4, 4, 10, 32) // 上面と下面の半径を 2 から 4 に、高さを 5 から 10 に変更
    ];

    for (let i = 0; i < 50; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() * 0xffffff,
            wireframe: true
        });
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        scene.add(mesh);
    }
}


import { Sky } from 'three/addons/objects/Sky.js';

function setupSkyAndGUI() {
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    const sunSphere = new THREE.Mesh(
        new THREE.SphereGeometry(200, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    scene.add(sunSphere);

    const sunParams = {
        distance: 400000,
        inclination: 0.49,
        azimuth: 0.205,
        brightness: 0.5,
        skyBrightness: 1.0,
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8
    };

    function updateSunPosition() {
        const theta = Math.PI * (sunParams.inclination - 0.5);
        const phi = 2 * Math.PI * (sunParams.azimuth - 0.5);
        sunSphere.position.x = sunParams.distance * Math.cos(phi);
        sunSphere.position.y = sunParams.distance * Math.sin(phi) * Math.sin(theta);
        sunSphere.position.z = sunParams.distance * Math.sin(phi) * Math.cos(theta);
    
        sunSphere.material.color.setScalar(sunParams.brightness);
        sky.material.uniforms.sunPosition.value.copy(sunSphere.position);
    
        sky.material.uniforms.turbidity.value = sunParams.turbidity;
        sky.material.uniforms.rayleigh.value = sunParams.rayleigh;
        sky.material.uniforms.mieCoefficient.value = sunParams.mieCoefficient;
        sky.material.uniforms.mieDirectionalG.value = sunParams.mieDirectionalG;
    }

    const gui = new GUI();
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.right = '0px';
    gui.domElement.style.top = '120px';

    // GUIの表示非表示を切り替える関数
    function toggleGUIVisibility(visible) {
        gui.domElement.style.display = visible ? 'block' : 'none';
    }

    const presets = {
        'Default': {
            inclination: 0.49,
            azimuth: 0.205,
            brightness: 0.5,
            skyBrightness: 1.0,
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8
        },
        'Morning': {
            inclination: 0.1,
            azimuth: 0.2,
            brightness: 0.6,
            skyBrightness: 0.5,
            turbidity: 8,
            rayleigh: 0.1,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7
        },
        'Evening': {
            inclination: 0.0,
            azimuth: 0.5,
            brightness: 0.1,
            skyBrightness: 0.2,
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8
        }
    };
    // 初期プリセットを設定
    Object.assign(sunParams, presets['Morning']);
    updateSunPosition();

    const presetFolder = gui.addFolder('Time of Day and Season Presets');
    Object.keys(presets).forEach(key => {
        presetFolder.add({ setPreset: () => {
            Object.assign(sunParams, presets[key]);
            updateSunPosition();
        } }, 'setPreset').name(key);
    });

    presetFolder.open();

    // GUIの初期表示を非表示に設定
    toggleGUIVisibility(false);
}


function init() {
    // カメラの作成: 視野角75度、アスペクト比はウィンドウの幅/高さ、視野の範囲は0.1から1000
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 5, 10); // カメラの位置を設定
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラの視点を原点に設定

    // レンダラーの作成: アンチエイリアスを有効にしてクオリティを向上
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // レンダラーのサイズをウィンドウに合わせる
    document.body.appendChild(renderer.domElement); // レンダラーをDOMに追加


    setupScene(); // シーンの設定
    // 非同期処理を管理する配列: シーンとコントロールの設定を非同期で行う
    let asyncInitTasks = [
        () => new Promise(resolve => {
            setupControls(); // コントロールの設定
            resolve();
        }),
        () => new Promise(resolve => {
            setupSkyAndGUI(); // コントロールの設定
            resolve();
        }),
        () => new Promise(resolve => {
            setupComplexWireframes(); // 複雑なワイヤーフレームの設定
            resolve();
        })

        // 他の非同期処理を追加する場合はここに関数を追加
    ];

    // スタートボタンの設定: クリック時に非同期処理を実行し、アニメーションを開始
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none'; // スタートボタンを非表示にする
        document.getElementById('loadingIndicator').style.display = 'block'; // ローディングインジケーターを表示

        // 非同期処理の実行: 全てのタスクが完了したらアニメーションを開始
        Promise.all(asyncInitTasks.map(task => task())).then(() => {
            startAnimation(); // アニメーションの開始
            document.getElementById('loadingIndicator').style.display = 'none'; // ローディングインジケーターを非表示にする
        });
    });

    // ウィンドウリサイズイベントの設定: ウィンドウサイズが変更された時にカメラとレンダラーを更新
    window.addEventListener('resize', onWindowResize, false);
}

function startAnimation() {
    // グリッドヘルパーを作成し、シーンに追加ます。こにより、座標軸が見やすくなります。
    const gridHelper = new THREE.GridHelper(100, 100); // 100x100のグリッド
    //scene.add(gridHelper);

    // XYZ軸を示矢印ヘルパー作成し、シーンに追加します。これにより、方向が分かりやすくなります。
    const axesHelper = new THREE.AxesHelper(10); // 各軸の長さは10
    ////scene.add(axesHelper);

    // Statsオブジェクトを作成し、パフォーマンスの統計情報を画面に表示しす。
    stats = new Stats();
    stats.domElement.style.position = 'absolute'; // スタイルを絶対位置指定に設定
    stats.domElement.style.top = '0px'; // 上端からの位置
    stats.domElement.style.right = '0px'; // 右端からの位置
    stats.domElement.style.left = 'auto'; // 左端の位置指定を自動に設定
    document.body.appendChild(stats.dom); // DOMに統計情報を追加

    //メラ位置を調整するGUIコントローラー
    const gui = new GUI();
    gui.domElement.style.position = 'absolute'; // 絶対位置指定
    gui.domElement.style.right = '0px'; // 右端からの位置
    gui.domElement.style.top = '10px'; // 上から15pxの位置に設定

    const camFolder = gui.addFolder('Camera Position');
    camFolder.add(camera.position, 'x', -100, 100).step(0.1).name('X Position');
    camFolder.add(camera.position, 'y', -100, 100).step(0.1).name('Y Position');
    camFolder.add(camera.position, 'z', -100, 100).step(0.1).name('Z Position');
    camFolder.open(); // GUIを開いた状態で表示

    animate(); // アニメーションループを開始します。これにより、シーンが動的に更新され続けます。
}

function setupScene() {
    // シーン設定用の定数
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背色を白に設定
        fogColor: 0x000000,         // 霧の色を黒に設定
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,                // 霧の終了距離
        ambientLightColor: 0xFFFFFF // 環境光の色を白に設定
    };

    // シーンの初期化
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor); // 背景色設定
    //scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar); // 霧の設定

    // 環境光の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor, 3.0); // 環境光を追加し、光の強度を0.5に設定
    scene.add(ambientLight);

    // 平行光源の追加と設定
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 白色の平行光源を追加、光の強度を0.8に定
    directionalLight.position.set(0, 300, 500); // 光源の位置を設定
    directionalLight.castShadow = true; // 影の生成を有効にする
    scene.add(directionalLight);

    // スポットライトの追加
    const spotLight = new THREE.SpotLight(0xffffff, 0.7, 1000, Math.PI / 4, 0.5, 2); // 白色のスポットライトを追加し、光の強度を0.7に設
    spotLight.position.set(100, 300, 100); // スポットライトの位置を定
    spotLight.castShadow = true; // 影の生成を有効にする
    scene.add(spotLight);

    // ポイントライトの追加
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 500); // 白色のポイントライトを追加し、光の強度を0.5に設定
    pointLight.position.set(-100, 200, -100); // ポイントライトの位置を設定
    scene.add(pointLight);

    // シャドウマップの設定
    renderer.shadowMap.enabled = true; // シャドウマップを有効にする
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // シャドウマップのタイプをPCFソフトシャドウマップに設定
    directionalLight.shadow.mapSize.width = 2048; // 平行光源のシャドウマップの幅を2048に設定
    directionalLight.shadow.mapSize.height = 2048; // 平行光源のシャドウマップの高さを2048に設定
    spotLight.shadow.mapSize.width = 2048; // スポットライトのシャドウマップの幅2048に設定
    spotLight.shadow.mapSize.height = 2048; // スポットライトのシャドウマップの高さを2048に設定
}

function setupControls() {
    // OrbitControlsのインスタンスを作成し、カメラとレンダラーのDOM要素を関連付けます。
    controls = new OrbitControls(camera, renderer.domElement);

    // コントローのダンピング（慣性）を有効にします。
    controls.enableDamping = true;
    controls.dampingFactor = 0.05; // ダンピングの強度を設定します。

    // スクリーン空間でのパン操作を有効にします。
    controls.screenSpacePanning = true;

    // ポーラ角（上下の回転制限）を設定します。
    controls.maxPolarAngle = Math.PI; // 最大180度
    controls.minPolarAngle = 0; // 最小0度

    // アジマス角（左右の回転制限）を設定します。
    controls.maxAzimuthAngle = Math.PI; // 最大180度
    controls.minAzimuthAngle = -Math.PI; // 最小-180度

    // パン操作を有効にします。
    controls.enablePan = true;

    // スマートフォンでの二点タッチによるン操作を有効にします。
    controls.enableTouchPan = true;

    // デバイスがバルかどうかでパ速タッチ時のダンピングを調整します。
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3; // モバイルデバイスのパン速度
        controls.touchDampingFactor = 0.2; // モバイルデバイスのタッチダンピング
    } else {
        controls.panSpeed = 0.5; // 非モバイルデバイスのパン度
        controls.touchDampingFactor = 0.1; // 非モバイルデバスのタッチダンピング
    }
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// アニメーションコールバックを管理する配列
let animationCallbacks = [];

// アニメーションコールバックを追加する関数
// @param {Function} callback - アニメーション中に実行されるコールバック関数
function addAnimationCallback(callback) {
    animationCallbacks.push(callback); // 配列にコールバックを追加
}

// アニメーションを管理する関数
function animate() {
    requestAnimationFrame(animate); // 次の描画タイミングでanimate関数を再度呼出す
    controls.update(); // カメラコントロールを更新

    // ���録さたすてのアニメションコールバク実行
    animationCallbacks.forEach(callback => {
        callback(); // 各コルバック関数を実行
    });

    renderer.render(scene, camera); // シーンとカメラを使ってレンダリング
    stats.update(); // パフォーマンス統計を更新
}

// 使い方:
// アニメーションループに新しい動作を追加したい場合は、addAnimationCallbackを使用しください。
// 例: addAnimationCallback(() => { console.log("アニメーションフレーム!"); });



init();
