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

function drawFilledHexagonalRiverLines(hexagonRadius = 100, numLines = 30) {
    const lines = [];

    // 正六角形の頂点を計算
    const hexagonPoints = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = Math.cos(angle) * hexagonRadius;
        const y = Math.sin(angle) * hexagonRadius;
        hexagonPoints.push(new THREE.Vector3(x, y, 0));
    }
    hexagonPoints.push(hexagonPoints[0]); // 最初の点を末尾に追加して閉じる

    // 正六角形の各辺に沿って線を描画
    for (let i = 0; i < 6; i++) {
        const start = hexagonPoints[i];
        const end = hexagonPoints[i + 1];
        const edgeVector = new THREE.Vector3().subVectors(end, start);

        for (let j = 0; j < numLines; j++) {
            const fraction = j / (numLines - 1);
            const offset = (hexagonRadius * fraction) * Math.sqrt(3) / 2; // 正六角形の高さに基づくオフセット

            const basePoints = [];
            for (let k = 0; k <= 100; k++) {
                const lerpFactor = k / 100;
                const point = new THREE.Vector3().addVectors(
                    start.clone().add(edgeVector.clone().multiplyScalar(lerpFactor)),
                    new THREE.Vector3().set(-edgeVector.y, edgeVector.x, 0).normalize().multiplyScalar(offset)
                );
                basePoints.push(point);
            }

            const baseCurve = new THREE.CatmullRomCurve3(basePoints);
            const baseGeometry = new THREE.BufferGeometry().setFromPoints(baseCurve.getPoints(500));

            const color = new THREE.Color(`hsl(${360 * j / numLines}, 100%, 50%)`);
            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1.0,
            });

            const line = new THREE.Line(baseGeometry, material);
            line.layers.enable(1);
            scene.add(line);
            
            lines.push(line);
        }
    }
    // アニメーションの追加
    addAnimationCallback(() => {
        const time = Date.now() * 0.0001;
        lines.forEach((line, index) => {
            const hue = 360 * index / numLines + Math.sin(time + index * 0.2) * 30;
            line.material.color.setHSL(hue / 360, 1, 0.5);
            line.position.y = Math.sin(time + index * 0.1) * 5; // Y座標の動きを加える
        });
    });
}





import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'; // Bloom効果でGodraysを近似
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
let bloomComposer, finalComposer;
// setupBloomEffect関数:
// この関数は、シーンにブルームエフェクトを適用するための設定を行います。
// ブルームエフェクトは、光のハイライト部分を強調して、よりリアルな光の演出を可能にします。
// 使用方法:
// ブルームエフェクトを初期化し適用します。
const { applyBloomEffect } = setupBloomEffect();

function setupBloomEffect() {
    const bloomLayer = new THREE.Layers();
    bloomLayer.set(1); // ブルーム用のレイヤーを1に設定

    const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" }); // ブルームエフェクト未適用オブジェクト用の暗いマテリアル
    const materials = {}; // オリジナルのマテリアルを保存するためのオブジェクト

    // ブルームエフェクトを適用するための関数
    function applyBloomEffect() {
        // シーン内の全オブジェクトをトラバースし、ブルームレイヤーが設定されていないオブジェクトのマテリアルを変更
        scene.traverse((obj) => {
            if (!bloomLayer.test(obj.layers) && obj.material) {
                materials[obj.uuid] = obj.material; // オリジナルのマテリアルを保存
                obj.material = darkMaterial; // マテリアルを暗いマテリアルに変更
            }
        });

        const originalBackground = scene.background; // 元の背景を保存
        renderer.setClearColor(0x000000, 0); // ブルームエフェクトのレンダリングのために背景を透明に設定
        scene.background = null; // ブルームエフェクトのレンダリングのために背景を非表示に設定

        bloomComposer.render(); // ブルームエフェクトを適用したレンダリングを実行

        // シーン内の全オブジェクトを再度トラバースし、マテリアルを元に戻す
        scene.traverse((obj) => {
            if (materials[obj.uuid] && obj.material) {
                obj.material = materials[obj.uuid]; // マテリアルを元に戻す
                delete materials[obj.uuid]; // 使用済みのマテリアル情報を削除
            }
        });

        renderer.setClearColor(0x000000, 1); // 最終的なレンダリングのために背景色を元に戻す
        scene.background = originalBackground; // 最終的なレンダリングのために背景を元に戻す
        finalComposer.render(); // 最終的な画像をレンダリング
    }

    return { applyBloomEffect }; // applyBloomEffect関数を返す
}
// setupAndApplyBloomEffect関数:
// この関数は、シーンにブルームエフェクトを適用するための設定を行います。
// ブルームエフェクトは、光のハイライト部分を強調して、よりリアルな光の演出を可能にします。
// 使用方法:
// init関数内でこの関数を呼び出して、ブルームエフェクトを初期化し適用します。
function setupAndApplyBloomEffect() {
    // レンダーシーンの設定
    const renderScene = new RenderPass(scene, camera);

    // ブルームエフェクトのパラメータ設定
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.05; // ブルームが適用されるしきい値
    bloomPass.strength = 0.7; // ブルームの強度
    bloomPass.radius = 0.55; // ブルームの半径

    // ブルームエフェクトのコンポーザー設定
    bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false; // 最終出力ではないため、スクリーンへのレンダリングは行わない
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    // 最終的な画像を合成するコンポーザー
    finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);

    // 最終的な画像を合成するシェーダーパス
    const finalPass = new ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = (texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv));
                }
            `
        }), "baseTexture"
    );
    finalPass.needsSwap = true; // テクスチャをスワップする必要がある
    finalComposer.addPass(finalPass);
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
    renderer.toneMappingExposure = 0.5; // 露出を設定
    document.body.appendChild(renderer.domElement); // レンダラーをDOMに追加


    setupScene(); // シーンの設定

    // 非同期処理を管理する配列: シーンとコントロールの設定を非同期で行う
    let asyncInitTasks = [
        () => new Promise(resolve => {
            setupControls(); // コントロールの設定
            resolve();
        }),
        () => new Promise(resolve => {
            setupEnvironmentMap('red_back.jpg');   // 初期の環境マップを設定
            resolve();
        }),
        () => new Promise(resolve => {
            setupAndApplyBloomEffect();
            resolve();
        }),
        () => new Promise(resolve => {
            drawFilledHexagonalRiverLines();
            
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
    //scene.add(axesHelper);

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


    applyBloomEffect();

    controls.update(); // カメラコントロールを更新

    // 登録されたすべてのアニメーションコールバックを実行
    animationCallbacks.forEach(callback => {
        callback(); // 各コールバック関数を実行
    });


    stats.update(); // パフォーマンス統計を更新
}

// 使い方:
// アニメーションループに新しい動作を追加したい場合は、addAnimationCallbackを使用してください。
// 例: addAnimationCallback(() => { console.log("アニメーションフレーム!"); });

init();

