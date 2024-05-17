import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import {
    GodRaysGenerateShader,
    GodRaysCombineShader,
    GodRaysFakeSunShader
} from 'three/addons/shaders/GodRaysShader.js';

function setupGodRaysEffect() {
    // 太陽の位置を画面の中心に近づける
    const sunPosition = new THREE.Vector3(0, 0, -10);
    const screenSpacePosition = sunPosition.clone().project(camera);

    // レンダリングターゲットの作成
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    const sceneRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    const godRaysRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

    // ゴッドレイ生成シェーダーの設定
    const godRaysGeneratePass = new ShaderPass(GodRaysGenerateShader);
    godRaysGeneratePass.uniforms['tInput'].value = renderTarget.texture;
    godRaysGeneratePass.uniforms['vSunPositionScreenSpace'].value = screenSpacePosition;
    godRaysGeneratePass.uniforms['fStepSize'].value = 0.5; // ステップサイズを調整

    // ゴッドレイ合成シェーダーの設定
    const godRaysCombinePass = new ShaderPass(GodRaysCombineShader);
    godRaysCombinePass.uniforms['tColors'].value = sceneRenderTarget.texture;
    godRaysCombinePass.uniforms['tGodRays'].value = godRaysRenderTarget.texture;
    godRaysCombinePass.uniforms['fGodRayIntensity'].value = 1.5; // ゴッドレイの強度をさらに調整

    // ポストプロセッシングの設定
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(godRaysGeneratePass);
    composer.addPass(godRaysCombinePass);

    // アニメーションコールバックにポストプロセッシングのレンダリングを追加
    addAnimationCallback(() => {
        composer.render();
    });
}
function addTiledCubes(speedFactor = 0.01, distanceFactor = 500) {
    const cubeSize = 15; // 立方体のサイズ
    const wallSize = 300; // 壁のサイズ
    const tileColorArray = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]; // タイルの色の配列

    // 立方体のマテリアルを金属質感に設定
    const material = new THREE.MeshStandardMaterial({
        roughness: 0.1, // 表面の粗さ
        metalness: 0.8, // 金属質感の強さ
        depthTest: false, // depthTestを無効に設定
        envMap: scene.environment, // 環境マッピングを追加
        envMapIntensity: 1.0 // 環境マッピングの強度
    });

    // 壁を作成する関数
    const createWall = (x, y, z, rotationY) => {
        const wall = new THREE.Object3D(); // 壁用のオブジェクトコンテナ

        for (let i = -wallSize / 2; i < wallSize / 2; i += cubeSize) {
            for (let j = -wallSize / 2; j < wallSize / 2; j += cubeSize) {
                const cube = new THREE.Mesh(
                    new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
                    material.clone()
                );
                // 行ごとに色を変える
                cube.material.color.set(tileColorArray[Math.floor(Math.abs(j) / cubeSize % tileColorArray.length)]);
                // レンガのように配置するために、奇数行は立方体を半分ずらす
                const offset = (Math.floor(Math.abs(i) / cubeSize) % 2) * cubeSize / 2;
                cube.position.set(i + cubeSize / 2 + offset, j + cubeSize / 2, 0);
                cube.initialPosition = cube.position.clone(); // 初期位置を保存
                cube.targetPosition = new THREE.Vector3(
                    cube.initialPosition.x + (Math.random() - 0.5) * distanceFactor, // 目的地をランダムに設定
                    cube.initialPosition.y + (Math.random() - 0.5) * distanceFactor,
                    0
                );
                cube.movingToTarget = true; // 目的地に向かっているかどうかのフラグ
                wall.add(cube);
            }
        }

        wall.position.set(x, y, z);
        wall.rotation.y = rotationY;
        scene.add(wall);
        return wall;
    };

    const walls = [
        createWall(0, 0, -wallSize / 2, 0),
        createWall(0, 0, wallSize / 2, Math.PI),
        createWall(-wallSize / 2, 0, 0, Math.PI / 2),
        createWall(wallSize / 2, 0, 0, -Math.PI / 2)
    ];

    addAnimationCallback(() => {
        walls.forEach(wall => {
            wall.children.forEach(cube => {
                if (cube.movingToTarget) {
                    cube.position.lerp(cube.targetPosition, speedFactor); // 目的地に向かって移動
                    if (cube.position.distanceTo(cube.targetPosition) < 0.1) {
                        cube.movingToTarget = false; // 目的地に到達
                    }
                } else {
                    cube.position.lerp(cube.initialPosition, speedFactor); // 初期位置に戻る
                    if (cube.position.distanceTo(cube.initialPosition) < 0.1) {
                        cube.movingToTarget = true; // 初期位置に戻ったので、新しい目的地を設定
                        cube.targetPosition.set(
                            cube.initialPosition.x + (Math.random() - 0.5) * distanceFactor,
                            cube.initialPosition.y + (Math.random() - 0.5) * distanceFactor,
                            0
                        );
                    }
                }
            });
        });
    });
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
            addTiledCubes(); // タイル立方体追加
            resolve();
        }),
        () => new Promise(resolve => {
            setupGodRaysEffect(); // タイル立方体追加
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
    scene.add(gridHelper);

    // XYZ軸を示矢印ヘルパー作成し、シーンに追加します。これにより、方向が分かりやすくなります。
    const axesHelper = new THREE.AxesHelper(10); // 各軸の長さは10
    scene.add(axesHelper);

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
