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

function applyCaustics(object) {
    // 環境光の強度を取得
    const ambientLight = scene.getObjectByName('AmbientLight');
    if (!ambientLight) {
        console.error('AmbientLightがシーンに存在しません。');
        return;
    }
    // 環境光の強度を取得
    const ambientIntensity = scene.getObjectByName('AmbientLight').intensity;


    // コースティックス効果を計算するシェーダー
    const causticsShader = {
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform float time;
            uniform float ambientIntensity;
            uniform vec3 baseColor;
            uniform sampler2D textureMap;
            uniform bool hasTexture;
    
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
    
            float largeScaleNoise(vec2 st) {
                float scale = 0.01;
                return noise(st * scale);
            }
    
            void main() {
                vec3 color = hasTexture ? texture2D(textureMap, vUv).rgb : baseColor;
    
                float waveSpeed = 0.05;
                float waveHeight = 0.2;
                float frequency = 1.0;
    
                vec2 wavePos = vUv * frequency + vec2(time * waveSpeed);
                float wavePattern = sin(wavePos.x) * cos(wavePos.y);
                float caustics = abs(wavePattern * largeScaleNoise(vUv + wavePos));
    
                caustics = smoothstep(0.3, 0.8, caustics) * ambientIntensity;
    
                float alpha = 1.0 - smoothstep(0.1, 0.5, caustics); // アルファ値の遷移をソフトにする
    
                vec3 finalColor = color * vec3(0.65, 0.77, 1.0) * caustics;
    
                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        uniforms: {
            time: { value: 0.0 },
            ambientIntensity: { value: 1.0 },
            baseColor: { value: new THREE.Color(object.material.color.getHex()) },
            textureMap: { type: 't', value: null },
            hasTexture: { value: false }
        }
    };
    // マテリアルの作成
    const material = new THREE.ShaderMaterial({
        vertexShader: causticsShader.vertexShader,
        fragmentShader: causticsShader.fragmentShader,
        uniforms: causticsShader.uniforms,
        transparent: true // 透明度を有効にする
    });

    // オブジェクトのマテリアルを更新
    object.material = material;

    // アニメーションコールバックを追加
    addAnimationCallback(() => {
        material.uniforms.time.value += 0.05;
    });
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
        () => new Promise(resolve => {
            // 使用例
            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(10, 10, 32, 32), // 平面のジオメトリを作成
                new THREE.MeshBasicMaterial({ color: 0x0000ff }) // 基本的な白色マテリアル
            );
            plane.rotation.x = -Math.PI / 2; // 平面を水平に配置
            scene.add(plane); // シーンに平面を追加
            applyCaustics(plane); // コースティックスを適用
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
        backgroundColor: 0xffffff   ,  // 背景色を白に設定
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
    ambientLight.name = 'AmbientLight'; // 名前を設定
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

