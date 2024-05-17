import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;






let grass;


function linearCongruentialGenerator(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296; // 2^32
    let last = seed;
    return function() {
        last = (a * last + c) % m;
        return last / m;
    };
}


function addGrassAnimation() {
    const PLANE_SIZE = 100;
    const BLADE_COUNT = 30000; // 草の密度を増やす
    const BLADE_HEIGHT = 2; // 草の基本の高さ
    const BLADE_HEIGHT_VARIATION = 5.0; // 高さのバリエーションを増やす
    const BLADE_WIDTH = 0.8; // 草の幅を設定
    const random = linearCongruentialGenerator(123456789);

    const positions = [];
    const colors = [];
    const indices = [];
    let index = 0;

    for (let i = 0; i < BLADE_COUNT; i++) {
        const x = random() * PLANE_SIZE - PLANE_SIZE / 2;
        const y = random() * PLANE_SIZE - PLANE_SIZE / 2;
        const height = BLADE_HEIGHT + random() * BLADE_HEIGHT_VARIATION; // 高さをランダムに設定
        const sway = random() * 0.1;
        const swayPhase = random() * Math.PI * 2;

        // ベジェ曲線の制御点を調整
        // 草の底部の座標を広げる
        const baseX1 = x - BLADE_WIDTH / 2;
        const baseX2 = x + BLADE_WIDTH / 2;
        const baseY = 0;
        const baseZ = y;
        const midX = x + sway * 5 * Math.sin(swayPhase); // 中間点のX座標を調整
        const midY = height * 0.3; // 中間点のY座標をさらに下げる
        const midZ = y + sway * 5 * Math.cos(swayPhase); // 中間点のZ座標を調整
        const tipX = x;
        const tipY = height; // 先端のY座標を最も高く設定
        const tipZ = y;

        // 三角形の頂点を追加（底部が広がるように2つの底部点を使用）
        positions.push(baseX1, baseY, baseZ, midX, midY, midZ, tipX, tipY, tipZ);
        positions.push(baseX2, baseY, baseZ, midX, midY, midZ, tipX, tipY, tipZ);

        colors.push(0, 0.5 + random() * 0.5, 0, 0, 0.5 + random() * 0.5, 0, 0, 0.5 + random() * 0.5, 0);
        colors.push(0, 0.5 + random() * 0.5, 0, 0, 0.5 + random() * 0.5, 0, 0, 0.5 + random() * 0.5, 0);

        indices.push(index, index + 1, index + 2);
        indices.push(index + 3, index + 4, index + 5);
        index += 6;
    }

    const grassGeometry = new THREE.BufferGeometry();
    grassGeometry.setIndex(indices);
    grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    grassGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const grassMaterial = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide
    });

    grass = new THREE.Mesh(grassGeometry, grassMaterial);
    
    scene.add(grass);


    function animateGrass() {
        const time = performance.now() / 1000;
    
        const positions = grass.geometry.attributes.position.array;
        const swayAmplitude = 0.5;
    
        for (let i = 0; i < positions.length; i += 9) {
            const initialX = positions[i];
            const initialZ = positions[i + 2];
    
            const swayX = swayAmplitude * (Math.sin(time + initialX) + Math.sin(2 * time + initialX / 2) / 2);
            const swayZ = swayAmplitude * (Math.cos(time + initialZ) + Math.cos(2 * time + initialZ / 2) / 2);
    
            positions[i + 3] = initialX + swayX;
            positions[i + 5] = initialZ + swayZ;
            positions[i + 6] = initialX + swayX;
            positions[i + 8] = initialZ + swayZ;
        }
    
        grass.geometry.attributes.position.needsUpdate = true;
    }

    addAnimationCallback(animateGrass);

}



//草が大爆発している感じ。ちょっと良いので残す。
function addGrassAnimation2() {
    const PLANE_SIZE = 10;
    const BLADE_COUNT = 2000; // 草の密度を増やす
    const BLADE_HEIGHT = 1.5; // 草の基本の高さ
    const BLADE_HEIGHT_VARIATION = 1.0; // 高さのバリエーションを増やす
    const random = linearCongruentialGenerator(123456789);

    const positions = [];
    const colors = [];
    const indices = [];
    let index = 0;

    for (let i = 0; i < BLADE_COUNT; i++) {
        const x = random() * PLANE_SIZE - PLANE_SIZE / 2;
        const y = random() * PLANE_SIZE - PLANE_SIZE / 2;
        const height = BLADE_HEIGHT + random() * BLADE_HEIGHT_VARIATION; // 高さをランダムに設定
        const sway = random() * 0.1;
        const swayPhase = random() * Math.PI * 2;

        // ベジェ曲線の制御点を調整
        const baseX = x;
        const baseY = 0;
        const baseZ = y;
        const midX = x + sway * 5 * Math.sin(swayPhase); // 中間点のX座標を調整
        const midY = height * 0.3; // 中間点のY座標をさらに下げる
        const midZ = y + sway * 5 * Math.cos(swayPhase); // 中間点のZ座標を調整
        const tipX = x;
        const tipY = height; // 先端のY座標を最も高く設定
        const tipZ = y;

        positions.push(baseX, baseY, baseZ, midX, midY, midZ, tipX, tipY, tipZ);
        colors.push(0, 0.5 + random() * 0.5, 0, 0, 0.5 + random() * 0.5, 0, 0, 0.5 + random() * 0.5, 0);
        indices.push(index, index + 1, index + 2);
        index += 3;
    }

    const grassGeometry = new THREE.BufferGeometry();
    grassGeometry.setIndex(indices);
    grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    grassGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const grassMaterial = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide
    });

    grass = new THREE.Mesh(grassGeometry, grassMaterial);
    scene.add(grass);

    // animateGrassをここで定義し、アニメーションコールバックに追加
    function animateGrass() {
        const time = performance.now() / 1000; // 現在の時間を秒単位で取得

        const positions = grass.geometry.attributes.position.array;
        const swayAmplitude = 5; // 揺れの振幅を5に設定（以前の10から減少）

        for (let i = 0; i < positions.length; i += 9) {
            const initialX = positions[i + 6]; // 先端の初期X座標
            const initialZ = positions[i + 8]; // 先端の初期Z座標
            const initialY = positions[i + 7]; // 先端の初期Y座標

            // サイン波を使用して、先端が自然に前後に揺れるように設定
            const swayX = swayAmplitude * Math.sin(time * 0.5 + positions[i]);
            const swayZ = swayAmplitude * Math.cos(time * 0.5 + positions[i + 2]);
            const swayY = swayAmplitude * Math.sin(time * 0.5 + positions[i]);

            // 初期位置からのオフセットを計算し、5以内に制限
            positions[i + 6] = initialX + Math.max(-5, Math.min(swayX, 5));
            positions[i + 8] = initialZ + Math.max(-5, Math.min(swayZ, 5));
            positions[i + 7] = initialY + Math.max(-5, Math.min(swayY, 5));
        }

        grass.geometry.attributes.position.needsUpdate = true; // 位置情報の更新をThree.jsに通知
    }

    addAnimationCallback(animateGrass);

}


function init() {
    // カメラの作成: 視野角75度、アスペクト比はウィンドウの幅/高さ、視野の範囲は0.1から1000
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10); // カメラの位を設
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラの視点を原点に設定

    // レンダラーの成: アンチエイリアスを有にしてクオリティを向上
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // レンラーのサイズをウィドウに合わせる
    renderer.shadowMap.enabled = true; // シャドウマップを有効にする
    document.body.appendChild(renderer.domElement); // レンダラーをDOMに追加


    setupScene(); // シーンの設定
    // 非同期処理を管理する配列: シーとコントローの設定を非同期で行う
    let asyncInitTasks = [
        () => new Promise(resolve => {
            setupControls(); // コントロールの設定
            resolve();
        }),
        () => new Promise(resolve => {
            addGrassAnimation(); // コントロールの設定
            resolve();
        })

        // 他の非同期処を追加する場合はここに関数を追加
    ];

    // スタートボンの設: クリク時に非同期処理を実行し、アニメーションを開始
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none'; // スタートボタンを非表示にする
        document.getElementById('loadingIndicator').style.display = 'block'; // ローディングインジケーターを表示

        // 非同期処理の実行: 全てのタスクが完了たらアメーションを開始
        Promise.all(asyncInitTasks.map(task => task())).then(() => {
            startAnimation(); // アニメーションの始
            document.getElementById('loadingIndicator').style.display = 'none'; // ローディングインジケーターを非表示にする
        });
    });

    // ウィンドウリサイズイベントの設定: ウィンドウサイズが変更された時にカメラとレンダラーを更新
    window.addEventListener('resize', onWindowResize, false);
}

function startAnimation() {
    // グリッドヘルパーを作成し、シーンに追加します。これにより、座標軸が見やすくなります。
    const gridHelper = new THREE.GridHelper(100, 100); // 100x100のリッド
    scene.add(gridHelper);

    // XYZ軸を示す矢印ヘルパーを作成、シー追加します。これ���より、方向が分かりやすくなります。
    const axesHelper = new THREE.AxesHelper(10); // 各軸の長さは10
    scene.add(axesHelper);

    // Statsオジェクトを作成し、パフォーマンスの統計情報を画面に表示します。
    stats = new Stats();
    stats.domElement.style.position = 'absolute'; // スタルを絶対位置指定に設定
    stats.domElement.style.top = '0px'; // 上端からの位置
    stats.domElement.style.right = '0px'; // 右端らの位置
    stats.domElement.style.left = 'auto'; // 左端の位置指定を自動に設定
    document.body.appendChild(stats.dom); // DOMに統計情報を追加

    //カメラ位置を調整するGUIコントローラー
    const gui = new GUI();
    gui.domElement.style.position = 'absolute'; // 絶位置指定
    gui.domElement.style.right = '0px'; // 右端からの位置
    gui.domElement.style.top = '10px'; // 上か15pxの位置に設定

    const camFolder = gui.addFolder('Camera Position');
    camFolder.add(camera.position, 'x', -100, 100).step(0.1).name('X Position');
    camFolder.add(camera.position, 'y', -100, 100).step(0.1).name('Y Position');
    camFolder.add(camera.position, 'z', -100, 100).step(0.1).name('Z Position');
    camFolder.open(); // GUIを開いた状で示

    animate(); // アニメーションループを開始します。これにより、シーンが動的に更新され続けます。
}

function setupScene() {
    // シーン設用の定
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背景色を白に設定
        fogColor: 0x000000,         // のを黒に設
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,                // 霧の終了距離
        ambientLightColor: 0xFFFFFF // 境光の色を白設定
    };

    // シーンの初期化
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor); // 背景色の設定
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar); // 霧の設定

    // 境光の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor, 0.5); // 環境光を追加し、光の強度を0.5に設定
    scene.add(ambientLight);

    // 平行光源の追加と設定
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 白色の平行光源を追加し、光の強を0.8に設定
    directionalLight.position.set(0, 300, 500); // 光源の位置を設定
    directionalLight.castShadow = true; // 影の生成を有にす
    scene.add(directionalLight);

    // スポットラ��トの追加
    const spotLight = new THREE.SpotLight(0xffffff, 0.7, 1000, Math.PI / 4, 0.5, 2); // 白色のスポッライトを追加し、光の強を0.7に設定
    spotLight.position.set(100, 300, 100); // スポットライトの位置を設定
    spotLight.castShadow = true; // 影の生成を効にする
    scene.add(spotLight);

    // ポイントライトの追加
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 500); // 白色のポイントライトを追加、光の強度を0.5に設定
    pointLight.position.set(-100, 200, -100); // ポイントライト位置を設定
    scene.add(pointLight);

    // シャドウマップの設定
    renderer.shadowMap.enabled = true; // シャドウマップを有効にする
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // シャドウマップのタイプをPCFソフトシャドウマップに設定
    directionalLight.shadow.mapSize.width = 2048; // 平行光源のシャドウマップの幅を2048に設定
    directionalLight.shadow.mapSize.height = 2048; // 平行光源のシャドウマップ高さを2048に設定
    spotLight.shadow.mapSize.width = 2048; // スポットライトシャドウマップの幅を2048に設定
    spotLight.shadow.mapSize.height = 2048; // ポットライトのシャドウマップのさを2048に設定
}

function setupControls() {
    // OrbitControlsのインスタンスを作成し、カメラとレダラーのDOM要素を関連付けます。
    controls = new OrbitControls(camera, renderer.domElement);

    // コントロールのダンピング（慣性）を有効します。
    controls.enableDamping = true;
    controls.dampingFactor = 0.05; // ダンピングの強度を設定します。

    // スリーン空間のパン操を有効にします。
    controls.screenSpacePanning = true;

    // ポーラ角（上下の回転制限）を設定します。
    controls.maxPolarAngle = Math.PI; // 最大180度
    controls.minPolarAngle = 0; // 最小0度

    // アジマス角（左右の回転制限）を設定しす。
    controls.maxAzimuthAngle = Math.PI; // 最180度
    controls.minAzimuthAngle = -Math.PI; // 最小-180度

    // パン操作を有効にします。
    controls.enablePan = true;

    // スマートフォンでの二点タッチによるパン操作を有効にします。
    controls.enableTouchPan = true;

    // デバイスがモバイルかどうかでパン速度とタッチ時のダンピングを調整します。
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3; // モバイルデバイスのパン速度
        controls.touchDampingFactor = 0.2; // ��バイルデバイスのタッチダンピング
    } else {
        controls.panSpeed = 0.5; // モバイルデバイスのパン速度
        controls.touchDampingFactor = 0.1; // 非モバイルデバイスのタッチダンピング
    }
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ニメーションコールバックを管理する配列
let animationCallbacks = [];

// アニメーモンコールバックを追加する関数
// @param {Function} callback - アニメーション中に実行さるコールバック関数
function addAnimationCallback(callback) {
    animationCallbacks.push(callback); // 配列にコールバックを追加
}

// アニメーショを管理する関数
function animate() {
    requestAnimationFrame(animate); // 次の描画タイミングでanimate関数を再度呼び出す
    controls.update(); // カメラコントロールを更新

    // 登録されたすべてのアニメーションコールバックを実行
    animationCallbacks.forEach(callback => {
        callback(); // 各コルバック関数を実行
    });

    renderer.render(scene, camera); // シーンとカラを使ってレンダリング
    stats.update(); // パフォーマンス統計を更新
}

// 使い方:
// アニメーションループに新しい動作を追加したい場は、addAnimationCallbackを使用してください。
// 例: addAnimationCallback(() => { console.log("アニメーョンフレーム!"); });

init();


