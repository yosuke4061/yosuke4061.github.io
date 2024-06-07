import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

let objLoader = new OBJLoader();
let mtlLoader = new MTLLoader();
let currentModelIndex = 0;
let models = [];
let frameCount = 100; // 250フレームのアニメーションがあるとします
let startTime = Date.now(); // ロード開始時間


function updateProgress(loaded, total) {
    let progress = (loaded / total) * 100;
    let currentTime = Date.now();
    let elapsedTime = (currentTime - startTime) / 1000; // 秒単位で経過時間を計算
    console.log(`Progress: ${progress}%`);
    document.getElementById('loadingProgress').innerText = `読み込み進捗: ${progress.toFixed(2)}%`;
    document.getElementById('loadingIndicator').innerText = `ローディング中... (${elapsedTime.toFixed(2)}秒経過)`;
}

function loadOBJAnimation() {
    document.getElementById('loadingIndicator').style.display = 'block'; // ローディングインジケーターを表示
    let loadedModels = 0;
    let loadAttempts = {};
    let playbackSpeed = 5; // 再生速度（ミリ秒単位）
    let forward = true; // 再生方向を制御するフラグ

    function loadModel(index) {
        if (loadAttempts[index] === undefined) {
            loadAttempts[index] = 1;
        } else {
            loadAttempts[index]++;
        }

        let mtlFileName = `06/bb${String(index).padStart(4, '0')}.mtl`;
        let objFileName = `06/bb${String(index).padStart(4, '0')}.obj`;

        mtlLoader.load(mtlFileName, function (materials) {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.load(objFileName, function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        const material = new THREE.MeshPhongMaterial({
                            color: child.material.color,
                            specular: 0x111111,
                            shininess: 100,
                            transparent: true,
                            opacity: 0.6,
                            depthWrite: false,
                            side:THREE.BackSide
                        });
                        child.material = material;
                    }
                });
                models[index - 1] = object; // Store model at correct index
                loadedModels++;
                updateProgress(loadedModels, frameCount);
                if (loadedModels === frameCount) {
                    finalizeLoading();
                }
            }, function (xhr) {
                console.log(`Loading model ${index}: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
            }, function (error) {
                console.error(`Error loading model ${index}: `, error);
                if (loadAttempts[index] < 3) { // Retry up to 3 times
                    console.log(`Retrying model ${index} (Attempt ${loadAttempts[index]})`);
                    loadModel(index);
                } else {
                    alert(`Failed to load model ${index} after several attempts.`);
                }
            });
        }, function (error) {
            console.error('An error happened during loading the MTL file: ', error);
        });
    }

    for (let i = 1; i <= frameCount; i++) {
        loadModel(i);
    }

    function finalizeLoading() {
        models.forEach((model, index) => {
            model.visible = (index === 0);
            scene.add(model);
        });
        let lastUpdateTime = Date.now();
        addAnimationCallback(() => {
            let now = Date.now();
            if (now - lastUpdateTime > playbackSpeed) {
                models[currentModelIndex].visible = false;
                if (forward) {
                    currentModelIndex++;
                    if (currentModelIndex >= frameCount) {
                        currentModelIndex = frameCount - 1;
                        forward = false; // 逆再生を開始
                    }
                } else {
                    currentModelIndex--;
                    if (currentModelIndex < 0) {
                        currentModelIndex = 0;
                        forward = true; // 正再生を再開
                    }
                }
                models[currentModelIndex].visible = true;
                lastUpdateTime = now;
            }
        });
        document.getElementById('loadingIndicator').style.display = 'none'; // ローディング完了
    }
}
function init() {
    // カメラの作成: 視野角75度、アスペクト比はウィンドウの幅/高さ、視野の範囲は0.1から1000
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
            loadOBJAnimation(); 
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
    // グリッドヘルパーを作成し、シーンに追加します。これにより、座標軸が見やすくなります。
    const gridHelper = new THREE.GridHelper(100, 100); // 100x100のグリッド
    scene.add(gridHelper);

    // XYZ軸を示す矢印ヘルパーを作成し、シーンに追加します。これにより、方向が分かりやすくなります。
    const axesHelper = new THREE.AxesHelper(10); // 各軸の長さは10
    scene.add(axesHelper);

    // Statsオブジェクトを作成し、パフォーマンスの統計情報を画面に表示します。
    stats = new Stats();
    stats.domElement.style.position = 'absolute'; // スタイルを絶対位置指定に設定
    stats.domElement.style.top = '0px'; // 上端からの位置
    stats.domElement.style.right = '0px'; // 右端からの位置
    stats.domElement.style.left = 'auto'; // 左端の位置指定を自動に設定
    document.body.appendChild(stats.dom); // DOMに統計情報を追加

    //カメラ位置を調整するGUIコントローラー
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
        backgroundColor: 0x000000,  // 背景色を白に設定
        fogColor: 0x000000,         // 霧の色を黒に設定
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,                // 霧の終了距離
        ambientLightColor: 0xFFFFFF // 環境光の色を白に設定
    };

    // シーンの初期化
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor); // 背景色の設定
    //scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar); // 霧の設定

    // 環境光の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor, 0.5); // 環境光を追加し、光の強度を0.5に設定
    scene.add(ambientLight);

    // 平行光源の追加と設定
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 白色の平行光源を追加し、光の強度を0.8に設定
    directionalLight.position.set(0, 300, 500); // 光源の位置を設定
    directionalLight.castShadow = true; // 影の生成を有効にする
    scene.add(directionalLight);

    // スポットライトの追加
    const spotLight = new THREE.SpotLight(0xffffff, 0.7, 1000, Math.PI / 4, 0.5, 2); // 白色のスポットライトを追加し、光の強度を0.7に設定
    spotLight.position.set(100, 300, 100); // スポットライトの位置を設定
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
    spotLight.shadow.mapSize.width = 2048; // スポットライトのシャドウマップの幅を2048に設定
    spotLight.shadow.mapSize.height = 2048; // スポットライトのシャドウマップの高さを2048に設定
}

function setupControls() {
    // OrbitControlsのインスタンスを作成し、カメラとレンダラーのDOM要素を関連付けます。
    controls = new OrbitControls(camera, renderer.domElement);

    // コントロールのダンピング（慣性）を有効にします。
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

    // ズームアウトの最大値を設定
    controls.maxDistance = 500;  // この値を適切な最大ズームアウト距離に設定


    // パン操作を有効にします。
    controls.enablePan = true;

    // スマートフォンでの二点タッチによるパン操作を有効にします。
    controls.enableTouchPan = true;

    // デバイスがモバイルかどうかでパン速度とタッチ時のダンピングを調整します。
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3; // モバイルデバイスのパン速度
        controls.touchDampingFactor = 0.2; // モバイルデバイスのタッチダンピング
    } else {
        controls.panSpeed = 0.5; // 非モバイルデバイスのパン速度
        controls.touchDampingFactor = 0.1; // 非モバイルデバイスのタッチダンピング
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
    requestAnimationFrame(animate); // 次の描画タイミングでanimate関数を再度呼び出す
    controls.update(); // カメラコントロールを更新

    // 登録されたすべてのアニメーションコールバックを実行
    animationCallbacks.forEach(callback => {
        callback(); // 各コールバック関数を実行
    });

    renderer.render(scene, camera); // シーンとカメラを使ってレンダリング
    stats.update(); // パフォーマンス統計を更新
}

// 使い方:
// アニメーションループに新しい動作を追加したい場合は、addAnimationCallbackを使用してください。
// 例: addAnimationCallback(() => { console.log("アニメーションフレーム!"); });

init();

