import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;


function createGlass(exclusionZoneRadius = 100) { // デフォルトの除外範囲半径を50に設定
    const glassCount = 1000; // ガラスの数
    const glassMaterials = []; // ガラスのマテリアルを格納する配列

    // ガラスのマテリアルを作成
    for (let i = 0; i < glassCount; i++) {
        const color = new THREE.Color(Math.random(), Math.random(), Math.random()); // ランダムな色
        const emissiveColor = new THREE.Color(Math.random(), Math.random(), Math.random()); // 発光色もランダムに
        const material = new THREE.MeshPhysicalMaterial({
            color: color,
            emissive: emissiveColor,
            emissiveIntensity: 0.5, // 発光の強度
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.8,
            reflectivity: 1.0,
            side: THREE.DoubleSide
        });
        glassMaterials.push(material);
    }

    // ガラスのメッシュを作成し、シーンに追加
    for (let i = 0; i < glassCount; i++) {
        const geometry = new THREE.BufferGeometry();
        const scale = 20 + Math.random() * 180; // サイズを大きくする
        let x, y, z;
        do {
            x = (Math.random() - 0.5) * 400;
            y = (Math.random() - 0.5) * 400;
            z = (Math.random() - 0.5) * 400;
        } while (Math.sqrt(x*x + y*y + z*z) < exclusionZoneRadius); // 中心からの距離が exclusionZoneRadius 未満なら再計算

        const vertices = new Float32Array([
            (Math.random() - 0.5) * scale, (Math.random() - 0.5) * scale, (Math.random() - 0.5) * scale,
            (Math.random() - 0.5) * scale, (Math.random() - 0.5) * scale, (Math.random() - 0.5) * scale,
            (Math.random() - 0.5) * scale, (Math.random() - 0.5) * scale, (Math.random() - 0.5) * scale
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals(); // 法線を計算

        const mesh = new THREE.Mesh(geometry, glassMaterials[i]);
        mesh.position.set(x, y, z);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scene.add(mesh);

        // アニメーションコールバックに動きを追加する関数を定義
        function createAnimationCallback(currentMesh) {
            let velocityX = 0;
            let velocityY = 0;
            let velocityZ = 0;
            const boundary = 200; // メッシュが動ける最大範囲

            return function() {
                currentMesh.rotation.x += 0.005;
                currentMesh.rotation.y += 0.005;

                // 速度を徐々に変化させて滑らかな動きを実現
                velocityX += 0.005 * (Math.random() - 0.5);
                velocityY += 0.005 * (Math.random() - 0.5);
                velocityZ += 0.005 * (Math.random() - 0.5);

                // 新しい位置を計算
                let newX = currentMesh.position.x + velocityX;
                let newY = currentMesh.position.y + velocityY;
                let newZ = currentMesh.position.z + velocityZ;

                // メッシュが設定した境界を超えた場合、位置をリセット
                if (Math.abs(newX) > boundary || Math.abs(newY) > boundary || Math.abs(newZ) > boundary) {
                    newX = (Math.random() - 0.5) * 400;
                    newY = (Math.random() - 0.5) * 400;
                    newZ = (Math.random() - 0.5) * 400;
                    velocityX = 0;
                    velocityY = 0;
                    velocityZ = 0;
                }

                // メッシュの��置を更新
                currentMesh.position.set(newX, newY, newZ);
            };
        };
        // createAnimationCallback を使用してアニメーションコールバックを追加
        addAnimationCallback(createAnimationCallback(mesh));
    }
}

function init() {
    // カメラの作成: 視野角75度、アスペクト比はウィンドウの幅/高さ、視野の範囲0.1から1000
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 5, 10); // カメラの位置を設定
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラの視点を原点に設定

    // レンダラーの作成: アチエイリアスを有効にしてクオリティを上
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // レンダラーのイズをウィンドウに合わせる
    document.body.appendChild(renderer.domElement); // レンダラーをDOMに追加
    
    setupScene(); // シーンの設定 これは、必ず最初に実行しないといけないので、非同期ではダメ
    // 非同期処理を管理る配列: シーンとコントロールの設定を非同期で行う
    let asyncInitTasks = [
        () => new Promise(resolve => {
            setupControls(); // コントロールの設定
            resolve();
        }),
        () => new Promise(resolve => {
            createGlass();
            resolve();
        })
        // 他の非同期処理を追加する場合はここに関数を追加
    ];

    // スタートボタンの設定: クリック時に非同期処理を実行し、アニメションを開始
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none'; // スタートボタンを非表示にする
        document.getElementById('loadingIndicator').style.display = 'block'; // ローディングインジケーターを表示

        // 非同期処理の実行: 全てのタスクが完了したらアニメーションを開始
        Promise.all(asyncInitTasks.map(task => task())).then(() => {
            startAnimation(); // アニメーションの開始
            document.getElementById('loadingIndicator').style.display = 'none'; // ローディングインジケターを非表示にする
        });
    });

    // ウィンドウリサイズイベントの設定: ウィンドウサイズが変更された時にカメラとレンダラーを更新
    window.addEventListener('resize', onWindowResize, false);
}

function startAnimation() {
    // グリッドヘルパーを作成、シーンに追加します。これにより、座標軸が見やすくなります。
    const gridHelper = new THREE.GridHelper(100, 100); // 100x100のグリッド
    scene.add(gridHelper);

    // XYZ軸を示す矢印ヘパーを成し、シーン追加します。これにより、方向が分かやすくなります。
    const axesHelper = new THREE.AxesHelper(10); // 各軸の長さは10
    scene.add(axesHelper);

    // Statsオブジェクトを作成し、パフォーマンスの統計情報を面に表示します
    stats = new Stats();
    stats.domElement.style.position = 'absolute'; // スタイルを絶対位置指定に設定
    stats.domElement.style.top = '0px'; // 上端からの位置
    stats.domElement.style.right = '0px'; // 右からの位置
    stats.domElement.style.left = 'auto'; // 左端の位置指定を自動に設定
    document.body.appendChild(stats.dom); // DOMに統計情報を追加

    //カメラ位置を調整するGUIコントローラ
    const gui = new GUI();
    gui.domElement.style.position = 'absolute'; // 絶対位置指定
    gui.domElement.style.right = '0px'; // 右端からの位置
    gui.domElement.style.top = '10px'; // 上から15pxの位置に設定

    const camFolder = gui.addFolder('Camera Position');
    camFolder.add(camera.position, 'x', -100, 100).step(0.1).name('X Position');
    camFolder.add(camera.position, 'y', -100, 100).step(0.1).name('Y Position');
    camFolder.add(camera.position, 'z', -100, 100).step(0.1).name('Z Position');
    camFolder.open(); // GUIを開いた状態で表示

    animate(); // アニーションループを開始します。これにより、シーンが動的更新さ続けます。
}

function setupScene() {
    // シーン設定用の定数
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背景色を白に設定
        fogColor: 0x000000,         // 霧の色を黒に設定
        fogNear: 1,                 // 霧の開始距離
        fogFar: 1000,                // 霧の終了距離
        ambientLightColor: 0xFFFFFF // 環境光の色を白に設定
    };

    // シーンの初期化
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor); // 背景色の設定
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar); // 霧の設定

    // 環境光の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor, 0.8); // 環境光を追加し、光の強度を0.5に設定
    scene.add(ambientLight);

    // 平行光源の追加と設定
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 白色の平行光源を追加し、光の強度を0.8に設定
    directionalLight.position.set(0, 300, 500); // 光源の位置を設定
    directionalLight.castShadow = true; // 影の生成を有効にする
    scene.add(directionalLight);

    // スポットライトの追加
    const spotLight = new THREE.SpotLight(0xffffff, 0.7, 1000, Math.PI / 4, 0.5, 2); // 白色のスポットライトを追加し、光の強度を0.7に設定
    spotLight.position.set(100, 300, 100); // スットライトの位置を設定
    spotLight.castShadow = true; // 影の生成を有効にする
    scene.add(spotLight);

    // ポイントライトの追加
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 500); // 白色のポイントライトを追加し、光の強度を0.5に設定
    pointLight.position.set(-100, 200, -100); // ポイントライトの位置を設定
    scene.add(pointLight);

    // シャドウマップの設定
    renderer.shadowMap.enabled = true; // シャドウマップを有効にする
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // シャドウマップのタイプをPCFソフトシャドウマップに設定
    directionalLight.shadow.mapSize.width = 2048; // 平行光源のシャドウマップの幅を2048に定
    directionalLight.shadow.mapSize.height = 2048; // 平行光源のシャドウマップの高さを2048に設定
    spotLight.shadow.mapSize.width = 2048; // スポットライトのシャドウマップの幅を2048に設定
    spotLight.shadow.mapSize.height = 2048; // スポトライトのシャドウマップの高さを2048に設定
}

function setupControls() {
    // OrbitControlsのインスンスを作成し、カメラとレンダラーのDOM要素を関連付けます。
    controls = new OrbitControls(camera, renderer.domElement);

    // コントロールのダンピング（慣性）を有効にします。
    controls.enableDamping = true;
    controls.dampingFactor = 0.05; // ダンピングの強度を設定します。

    // スクリーン空間でのパン操作を有効にします。
    controls.screenSpacePanning = true;

    // ポーラ角（上下の回転制限）を設定します。
    controls.maxPolarAngle = Math.PI; // 大180度
    controls.minPolarAngle = 0; // 最小0度

    // アジマス角（左右の回転制限）を設定します。
    controls.maxAzimuthAngle = Math.PI; // 最大180度
    controls.minAzimuthAngle = -Math.PI; // 最小-180度

    // パン操作を有効にします。
    controls.enablePan = true;

    // スマートフォンの二���タッチによるパン操作を有効にします。
    controls.enableTouchPan = true;

    // デバイスがモバイルかどうかでパン速度とタッチ時のダンピングを調整します。
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3; // モバイルデバイスのパン速度
        controls.touchDampingFactor = 0.2; // バイルデバイスのッチダンピング
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
function addAnimationCallback(callback) {
    animationCallbacks.push(callback);
}

// アニメーションを管理する関数
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // カメラコントロールを更新

    // 登録されたすべてのアニメーションコールバックを実行
    animationCallbacks.forEach(callback => {
        callback(); // 各コールバック関数実行
    });

    renderer.render(scene, camera); // シーンとカメラを使ってレンリング
    stats.update(); // パフォーマンス統計を更新
}

// 使い方:
// アニメーションループに新し動作を追加したい場合は、addAnimationCallbackを使用してください。
// 例: addAnimationCallback(() => { console.log("アニメーションレーム!"); });

init();

// 使用例: 中心からの除外範囲を100に設定してガラスを生成
createGlass(100);

