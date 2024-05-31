import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';
import { TextureLoader } from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

import { PMREMGenerator } from 'three';
let scene, camera, renderer, controls, stats;

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// OBJLoaderとMTLLoaderのインスタンスを作成
let objLoader = new OBJLoader();
let mtlLoader = new MTLLoader();

// 現在のアニメーションフレームを追跡する変数
let currentFrame = 0;
// アニメーションの再生方向を追跡するフラグ
let reverseAnimation = false;

// アクティブなメッシュを保持する配列
let activeMeshes = [];

// OBJファイルとMTLファイルを非同期に読み込み、アニメーションを設定する関数
async function loadOBJAnimation() {
    const basePath = '01/';
    const objBaseName = 'aa';
    const mtlBaseName = 'aa';
    const totalFrames = 200; // 連番ファイルの総数
    let models = [];
    let materials = [];
    let totalFiles = totalFrames * 2; // OBJファイルとMTLファイルの合計数
    let loadedFiles = 0; // 読み込まれたファイル数

    // 全体の進捗を更新する関数
    function updateOverallProgress() {
        let progress = (loadedFiles / totalFiles) * 100;
        console.log(`Overall Progress: ${progress.toFixed(2)}%`);
        document.getElementById('loadingProgress').innerText = `読み込み進捗: ${progress.toFixed(2)}%`;
    }
    
    // 各フレームのモデルとマテリアルを読み込む
    for (let i = 1; i <= totalFrames; i++) {
        let index = i.toString().padStart(4, '0');
        let objPath = `${basePath}${objBaseName}${index}.obj`;
        let mtlPath = `${basePath}${mtlBaseName}${index}.mtl`;

        try {
            // マテリアルの読み込み
            let mtl = await new Promise((resolve, reject) => {
                mtlLoader.load(mtlPath, resolve, (xhr) => {
                    if (xhr.loaded === xhr.total) {
                        loadedFiles++;
                        updateOverallProgress();
                    }
                }, reject);
            });

            // モデルの読み込み
            let obj = await new Promise((resolve, reject) => {
                objLoader.setMaterials(mtl);
                objLoader.load(objPath, resolve, (xhr) => {
                    if (xhr.loaded === xhr.total) {
                        loadedFiles++;
                        updateOverallProgress();
                    }
                }, reject);
            });

            models.push(obj);
            materials.push(mtl);
        } catch (error) {
            console.error(`Error loading model or material at index ${index}:`, error);
            return;
        }
    }

    // マテリアルのカスタマイズ関数を呼び出す
    customizeAndUpdateMaterials(models, materials);


    // アニメーションコールバックを追加
    // アニメーションの再生開始フレームを設定する変数
    let startFrameAfterFirstCycle = 150;

    // アニメーションコールバックを追加
    addAnimationCallback(() => {
        // シーンからすべてのアクティブなメッシュを削除
        activeMeshes.forEach(mesh => scene.remove(mesh));
        activeMeshes = []; // 配列をクリア

        // 現在のモデルをシーンに追加
        let model = models[currentFrame];
        model.scale.set(80, 25, 80); // スケール調整
        model.position.set(0, -50, 0); // 位置調整
        scene.add(model);
        activeMeshes.push(model); // アクティブなメッシュ配列に追加

        // フレームを更新
        if (!reverseAnimation) {
            if (currentFrame === 0) {
                // 初回の再生が終了した後、次回からはstartFrameAfterFirstCycle番目から開始
                // ただし、モデルの数がstartFrameAfterFirstCycle未満の場合は0から再開
                currentFrame = models.length > startFrameAfterFirstCycle ? startFrameAfterFirstCycle : 0;
            } else {
                currentFrame = (currentFrame + 1) % models.length; // フレームを循環
                if (currentFrame === models.length - 1) {
                    reverseAnimation = true; // 最後のフレームに達したらリバースを開始
                }
            }
        } else {
            currentFrame = (currentFrame - 1 + models.length) % models.length; // フレームを逆循環
            if (currentFrame === 0) {
                reverseAnimation = false; // 最初のフレームに戻ったら通常の再生を再開
            }
        }
    });


    // マテリアルのカスタマイズを行う関数
    async function customizeAndUpdateMaterials(models, materials) {
        // モデルとマテリアルを更新
        models.forEach((model, index) => {
            let waterMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffffff, // 白色で透明感を高める
                metalness: 1.0, // 金属感を少し加える
                roughness: 0.2, // 表面の粗さを低くして光沢を出す
                opacity: 0.6, // 透明度をさらに低く設定
                transparent: true, // 透明度を有効にする
                reflectivity: 0.1, // 高い反射率
                clearcoat: 1.0, // クリアコートを追加
                clearcoatRoughness: 0.05, // クリアコートの粗さ
                side: THREE.DoubleSide, // 両面をレンダリング
                envMap: scene.environment, // 環境マップを設定
                envMapIntensity: 1.5 // 環境マップの強度を調整
            });
    
            // モデルの各メッシュに新しいマテリアルを適用
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = waterMaterial;
                }
            });
    
            // 更新されたマテリアルを配列に保存
            materials[index] = waterMaterial;
        });
    }
        /** 
    async function customizeAndUpdateMaterials(models, materials) {
        // モデルとマテリアルを更新
        models.forEach((model, index) => {
            let existingMaterial = materials[index];
            if (!(existingMaterial instanceof THREE.Material)) {
                existingMaterial = new THREE.MeshPhysicalMaterial();
            }
    
            // 既存のマテリアルのプロパティを保持しつつ、液体金属の特性を反映
            let updatedMaterial = existingMaterial.clone();
            //updatedMaterial.color.setHex(0xAAAAAA); // シルバー色
            updatedMaterial.metalness = 1.0; // 高い金属感
            updatedMaterial.roughness = 0.3; // やや光沢のある表面
            updatedMaterial.envMap = scene.environment; // 環境マップを設定
            updatedMaterial.envMapIntensity = 2.2; // 環境マップの強度を適切に設定
    
            // モデルの各メッシュに更新されたマテリアルを適用
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = updatedMaterial;
                }
            });
    
            // 更新されたマテリアルを配列に保存
            materials[index] = updatedMaterial;
        });
    }*/
}

function init() {
    // カメラの作成: 視野角75度、アスペクト比はウィンドウの幅/高さ、視野の範囲は0.1から1000
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 5, 10); // カメラの位置を設定
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラの視点を原点に設定

    // レンダラーの作成: アンチエイリアスを有効にしてクオリティを向上
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // レンダラーのサイズをウィンドウに合わせる
    renderer.shadowMap.enabled = true; // シャドウマップを有効にする
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // シャドウのタイプを設定
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // トーンマッピングを設定
    renderer.toneMappingExposure = 1.0; // 露出を設定
    
    document.body.appendChild(renderer.domElement); // レンダラーをDOMに追加


    setupScene(); // シーンの設定
    setupEnvironmentMap('rosendal_park_sunset_puresky_4k.exr');   // 初期の環境マップを設定
    // 非同期処理を管理する配列: シーンとコントロールの設定を非同期で行う
    let asyncInitTasks = [
        () => new Promise(resolve => {
            setupControls(); // コントロールの設定
            resolve();
        }),
        () => new Promise(resolve => {

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

function setupEnvironmentMap(imagePath) {
    const extension = imagePath.split('.').pop().toLowerCase();

    const onLoad = function (texture) {
        const pmremGenerator = new PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        pmremGenerator.dispose();

        scene.environment = envMap; // 環境マップとして設定
        scene.background = envMap; // 背景としても設定
    };

    const onError = function (error) {
        console.error('環境マップの読み込みに失敗しました:', error);
    };

    if (extension === 'hdr') {
        const rgbeLoader = new RGBELoader();
        rgbeLoader.load(imagePath, onLoad, undefined, onError);
    } else if (extension === 'exr') {
        const exrLoader = new EXRLoader();
        exrLoader.load(imagePath, onLoad, undefined, onError);
    } else {
        const textureLoader = new TextureLoader();
        textureLoader.load(imagePath, onLoad, undefined, onError);
    }
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

    // シーンの初期化　環境マップを設定しているので、背景色は設定しない。
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor); // 背景色の設定
    //scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar); // 霧の設定

    // 環境光の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor, 0.5); // 環境光を追加し、光の強度を0.5に設定
    scene.add(ambientLight);

    // 平行光源の追加と設定
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 白色の平行光源を追加し、光の強度を0.8に設定
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true; // 影の生成を有効にする
    scene.add(directionalLight);

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
    controls.maxDistance = 800;  // この値を適切な最大ズームアウト距離に設定


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

