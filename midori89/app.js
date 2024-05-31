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
//水の影の設定考慮。光の影響をマテリアルに設定
async function loadOBJAnimation() {
    const basePath = '03/';
    const objBaseName = 'aa';
    const mtlBaseName = 'aa';
    const totalFrames = 2000;
    let models = [];
    let materials = [];
    let loadedFiles = 0;
    let initialFrames = 10;
    let totalFiles = totalFrames * 2;
    let retryAttempts = {};

    // 全体の進捗を更新する関数
    function updateOverallProgress() {
        let progress = (loadedFiles / totalFiles) * 100;
        console.log(`Overall Progress: ${progress.toFixed(2)}%`);
        document.getElementById('loadingProgress').innerText = `読み込み進捗: ${progress.toFixed(2)}%`;
    }

    // 特定のフレームのOBJとMTLファイルを読み込む関数
    async function loadFrame(index) {
        let objUrl = `${basePath}${objBaseName}${index.toString().padStart(4, '0')}.obj`;
        let mtlUrl = `${basePath}${mtlBaseName}${index.toString().padStart(4, '0')}.mtl`;
        try {
            let mtl = await mtlLoader.loadAsync(mtlUrl);
            objLoader.setMaterials(mtl);
            let obj = await objLoader.loadAsync(objUrl);
            obj.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true; // 影を投影するように設定
                    child.receiveShadow = true; // 影を受け取るように設定
                }
            });
            models.push(obj);
            materials.push(mtl);
            loadedFiles += 2;
            updateOverallProgress();
            customizeAndUpdateMaterials(obj, "Liquid_Domain_Material", {
                color: 0xaaaaaa,
                metalness: 0.1
                // 他のプロパティは既存のマテリアルから引き継がれます
            });
        } catch (error) {
            console.error(`Error loading model or material at index: ${index}`, error);
            if (!retryAttempts[index]) retryAttempts[index] = 0;
            if (retryAttempts[index] < 3) {
                retryAttempts[index]++;
                console.log(`Retrying to load frame ${index} (Attempt ${retryAttempts[index]})`);
                await loadFrame(index);
            }
        }
    }

    // 初期フレームを読み込む関数
    async function loadInitialFrames() {
        for (let i = 1; i <= initialFrames; i++) {
            await loadFrame(i);
        }
    }

    // 残りのフレームを読み込む関数
    async function continueLoadingRest() {
        for (let i = initialFrames + 1; i <= totalFrames; i++) {
            await loadFrame(i);
        }
    }

    // マテリアルをカスタマイズして更新する関数
    // 特定のマテリアル名に基づいてカスタマイズを行い、materialPropertiesが指定されていない場合は既存のプロパティを使用する
function customizeAndUpdateMaterials(model, materialName, materialProperties = {}) {
    model.traverse((child) => {
        if (child.isMesh && child.material.name === materialName) {
            const existingMaterial = child.material;
            const customMaterial = new THREE.MeshPhysicalMaterial({
                color: materialProperties.color || existingMaterial.color,
                metalness: materialProperties.metalness || existingMaterial.metalness,
                roughness: materialProperties.roughness !== undefined ? materialProperties.roughness : existingMaterial.roughness || 0.5,
                opacity: materialProperties.opacity || existingMaterial.opacity,
                transparent: materialProperties.transparent !== undefined ? materialProperties.transparent : existingMaterial.transparent,
                reflectivity: materialProperties.reflectivity || existingMaterial.reflectivity,
                clearcoat: materialProperties.clearcoat !== undefined ? materialProperties.clearcoat : existingMaterial.clearcoat || 0,
                clearcoatRoughness: materialProperties.clearcoatRoughness !== undefined ? materialProperties.clearcoatRoughness : existingMaterial.clearcoatRoughness || 0,
                side: materialProperties.side || existingMaterial.side,
                envMap: existingMaterial.envMap,
                envMapIntensity: materialProperties.envMapIntensity !== undefined ? materialProperties.envMapIntensity : existingMaterial.envMapIntensity || 1,
                map: existingMaterial.map, // 既存のテクスチャマップを保持
                alphaTest: materialProperties.alphaTest || existingMaterial.alphaTest
            });
            child.material = customMaterial;
        }
    });
}

    await loadInitialFrames(); // 初期フレームの読み込みを待つ

    let startFrameAfterFirstCycle = 150;
    let enableReversePlayback = false; // 逆再生を許可するかどうかのフラグ

    // アニメーションコールバックを追加
    addAnimationCallback(() => {
        // シーンからすべてのアクティブなメッシュを削除
        activeMeshes.forEach(mesh => {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose(); // ジオメトリのメモリ解放
            if (mesh.material) mesh.material.dispose(); // マテリアルのメモリ解放
        });
        activeMeshes = []; // 配列をクリア

        // 現在のモデルをシーンに追加
        if (models[currentFrame]) {
            let model = models[currentFrame];
            model.scale.set(5, 5, 5); // スケール調整
            model.position.set(0, 150, 0); // 位置調整
            scene.add(model);
            activeMeshes.push(model); // アクティブなメッシュ配列に追加
        }

        // フレームを更新
        if (!reverseAnimation) {
            if (currentFrame === 0) {
                // 初回の再生が終了した後、次回からはstartFrameAfterFirstCycle番目から開始
                // ただし、モデルの数がstartFrameAfterFirstCycle未満の場合は0から再開
                currentFrame = models.length > startFrameAfterFirstCycle ? startFrameAfterFirstCycle : 0;
            } else {
                currentFrame = (currentFrame + 1) % models.length; // フレームを循環
                if (currentFrame === models.length - 1 && enableReversePlayback) {
                    reverseAnimation = true; // 最後のフレームに達したらリバースを開始
                }
            }
        } else {
            if (enableReversePlayback) {
                currentFrame = (currentFrame - 1 + models.length) % models.length; // フレームを逆循環
                if (currentFrame === 0) {
                    reverseAnimation = false; // 最初のフレームに戻ったら通常の再生を再開
                }
            } else {
                // 逆再生が無効の場合は、常に順再生を続ける
                currentFrame = (currentFrame + 1) % models.length;
            }
        }
    });

    continueLoadingRest(); // 残りのフレームをバックグラウンドで読み込む
}

function addGround() {
    // 地面のジオメトリとマテリアルを作成
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.8,
        metalness: 0.2
    });

    // 地面のメッシュを作成し、シーンに追加
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // X軸を中心に90度回転して地面を水平に
    ground.position.y = -5;          // 地面の位置を少し下げる
    ground.receiveShadow = true;     // 地面が影を受け取るように設定
    scene.add(ground);

    // 影が映る球体を追加
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 0, 0); // 球体の位置を設定
    sphere.castShadow = true;     // 球体が影を投影するように設定
    sphere.receiveShadow = true;  // 球体が影を受け取るように設定
    scene.add(sphere);
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

    // 非同期処理を管理する配列: シーンとコントロールの設定を非同期で行う
    let asyncInitTasks = [
        () => new Promise(resolve => {
            setupControls(); // コントロールの設定
            resolve();
        }),
        () => new Promise(resolve => {
            setupEnvironmentMap('back_water_color.jpg');   // 初期の環境マップを設定
            resolve();
        }),
        () => new Promise((resolve, reject) => {
            loadOBJAnimation().then(resolve).catch(reject);
        }),
        () => new Promise((resolve, reject) => {
            addGround();
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
    //scene.add(gridHelper);

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
    //scene.add(directionalLight);
    
    // スポットライトの追加 影の演出
    const spotLight = new THREE.SpotLight(0xffffff, 0.8);
    spotLight.position.set(0, 300, 0); // 光源の位置
    spotLight.angle = Math.PI / 6; // 照射角
    spotLight.target.position.set(0, 0, 0); // ターゲットの位置を原点に設定
    spotLight.penumbra = 0.1; // ペナンブラ（光のぼかし度）
    spotLight.decay = 2; // 光の減衰率
    spotLight.castShadow = true; // 影を投影する設定
    scene.add(spotLight);
    // 影の設定
    spotLight.shadow.mapSize.width = 1024; // 影の解像度
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.focus = 1; // フォーカスの設定、1に近いほど鋭い影
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

