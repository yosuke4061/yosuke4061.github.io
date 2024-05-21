import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'dat.gui';
import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;


import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'; // Bloom効果でGodraysを近似



let composer;

function initPostProcessing() {
    // レンダーパスの設定
    const renderPass = new RenderPass(scene, camera);

    // ブルームエフェクトの設定
    // UnrealBloomPassを使用して、シーンにブルーム（光の輝き）エフェクトを追加します。
    // 引数は次の通りです:
    // 1. 解像度 - ブルームエフェクトの解像度を指定します。
    // 2. 強度 - ブルームの強さを指定します。
    // 3. 半径 - ブルームがどれだけ広がるかを指定します。
    // 4. 閾値 - ブルームを適用する明るさの閾値を指定します。
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.21; // ブルームが適用される明るさの閾値
    bloomPass.strength = 1.2; // ブルームの強度
    bloomPass.radius = 0.8; // ブルームの広がりの半径

    // エフェクトコンポーザーの作成
    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    
    // オブジェクトの回転アニメーションを追加
    addAnimationCallback(() => {
    // レンダラーではなく、エフェクトコンポーザーを通してシーンをレンダリング
        composer.render();

    });
}
function setupConcertLightEffect() {
    //setupMovablePanel();
    initPostProcessing();
    //setupParticles();
    //createSun();
    //createHollowSun();
    createAngelRing();
    //createLightThroughClouds();
    //createLaserBeam();
    createDynamicLaserBeams();
    addImageToScene();


}
function addImageToScene() {
    const loader = new THREE.TextureLoader();
    const images = [];
    const originalPositions = [];
    const originalScales = [];
    const numImages = 8;
    const radius = 20; // 画像を配置する円の半径

    for (let i = 1; i <= numImages; i++) {
        loader.load(`pic/${i}.jpg`, function(texture) {
            const image = texture.image;
            const width = image.width;
            const height = image.height;
            const aspectRatio = width / height;

            const planeGeometry = new THREE.PlaneGeometry(aspectRatio * 5, 5);
            const planeMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                color: 0x777777,
                side: THREE.DoubleSide,
                fog: false
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);

            // 画像を円形に配置
            const angle = (i / numImages) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            plane.position.set(x, y, -20);
            plane.lookAt(camera.position);

            scene.add(plane);
            images.push(plane);
            originalPositions.push(plane.position.clone()); // 初期位置を保存
            originalScales.push(plane.scale.clone()); // 初期スケールを保存

            // クリックイベントの追加
            plane.userData = { moving: false, targetPosition: null, originalPosition: plane.position.clone(), originalScale: plane.scale.clone() };
            plane.callback = function() {
                this.userData.moving = true;
                if (this.position.distanceTo(new THREE.Vector3(0, 0, 10)) < 0.1) {
                    // 元の位置とスケールに戻る
                    this.userData.targetPosition = this.userData.originalPosition;
                    this.userData.targetScale = this.userData.originalScale;
                } else {
                    // 中央に移動し、拡大する
                    this.userData.targetPosition = new THREE.Vector3(0, 0, 10);
                    const targetScale = new THREE.Vector3(2, 2, 2); // 拡大スケールを調整
                    this.userData.targetScale = targetScale;
                }
            };
        });
    }

    // マウスイベントの設定
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseClick(event) {
        event.preventDefault();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(images);

        if (intersects.length > 0) {
            intersects[0].object.callback();
        }
    }

    window.addEventListener('click', onMouseClick, false);

    addAnimationCallback(() => {
        images.forEach(plane => {
            if (plane.userData.moving) {
                plane.position.lerp(plane.userData.targetPosition, 0.05);
                plane.scale.lerp(plane.userData.targetScale, 0.05);
                if (plane.position.distanceTo(plane.userData.targetPosition) < 0.1) {
                    plane.position.copy(plane.userData.targetPosition);
                    plane.scale.copy(plane.userData.targetScale);
                    plane.userData.moving = false;
                }
            }
            plane.lookAt(camera.position); // 常にカメラの方向を向く
        });
    });
}
function createDynamicLaserBeams() {
    const laserGroup = new THREE.Group(); // レーザーをグループ化
    const laserCount = 300; // レーザーの数を増やす
    // シーンの霧を設定（原点付近が濃く、離れるほど薄くなる）
    scene.fog = new THREE.FogExp2(0x000000, 0.1); // 色と密度を設定

    // レーザーのマテリアルとジオメトリを作成
    for (let i = 0; i < laserCount; i++) {
        const color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 50%)`); // 色をHSLでランダムに設定
        const material = new THREE.LineBasicMaterial({ color: color });
        const geometry = new THREE.BufferGeometry();
        // レーザーの長さをランダムに設定（最小100、最大300の範囲）
        const length = Math.random() * 200 + 100;
        const angle = Math.random() * Math.PI * 2; // 全方位にランダム
        const x = Math.cos(angle) * length;
        const y = Math.sin(angle) * length;
        const vertices = new Float32Array([
            0, 0, 0, // 始点は常に原点
            x, y, Math.random() * 100 - 50 // 終点はランダムな方向と高さ
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const laser = new THREE.Line(geometry, material);
        laser.material.linewidth = Math.random() * 2 + 1; // ラインの太さをランダムに設定
        laserGroup.add(laser);
    }
    scene.add(laserGroup);

    // レーザーのアニメーションを追加
    let lastTime = Date.now();
    addAnimationCallback(() => {
        const currentTime = Date.now();
        if (currentTime - lastTime > 100) { // 100ミリ秒ごとに更新
            laserGroup.children.forEach(laser => {
                // レーザーの位置をランダムに変更
                const length = Math.random() * 200 + 100;
                const angle = Math.random() * Math.PI * 2;
                const x = Math.cos(angle) * length;
                const y = Math.sin(angle) * length;
                laser.geometry.attributes.position.array = new Float32Array([
                    0, 0, 0,
                    x, y, Math.random() * 100 - 50
                ]);
                laser.geometry.attributes.position.needsUpdate = true; // 座標の更新を有効化
                // レーザーの色を更新
                laser.material.color.setHSL(Math.random(), 1, 0.5);
                // レーザーの太さを更新
                laser.material.linewidth = Math.random() * 2 + 1;
            });
            lastTime = currentTime;
        }
    });
}



function createLaserBeam() {
    // レーザーの始点と終点を設定
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(0, 10, -50);

    // レーザーのジオメトリを作成
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        start.x, start.y, start.z,
        end.x, end.y, end.z
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // レーザーのマテリアルを作成
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

    // レーザーラインを作成
    const laser = new THREE.Line(geometry, material);
    scene.add(laser);

    // レーザーのアニメーションを追加
    addAnimationCallback(() => {
        laser.rotation.z += 0.01; // レーザーを回転させる
    });
}


function createLightThroughClouds() {
    // 立方体のジオメトリとマテリアルを作成
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });

    // 立方体を複数配置
    for (let i = 0; i < 10; i++) {
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        const x = Math.random() * 20 - 10;
        const y = Math.random() * 20 - 10;
        const z = Math.random() * 20 - 10;
        cube.position.set(x, y, z);
        scene.add(cube);
    }

    // ポイントライト（光源）を追加
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 50);
    pointLight.position.set(0, 50, 0);
    scene.add(pointLight);

    // ライトヘルパーを追加（光源の位置を視覚化）
    const lightHelper = new THREE.PointLightHelper(pointLight);
    scene.add(lightHelper);

    // ボリュームライト効果を追加（光の筋を作成）
    const volLight = new THREE.SpotLight(0xffffff, 1.5, 1000, Math.PI / 10, 0.5, 0.5);
    volLight.position.set(0, 100, 100);
    volLight.target.position.set(0, 0, 0);
    scene.add(volLight);
    scene.add(volLight.target);

    // ライトヘルパーを追加（スポットライトの方向を視覚化）
    const spotLightHelper = new THREE.SpotLightHelper(volLight);
    scene.add(spotLightHelper);

    // ライトの更新をアニメーションループに追加
    addAnimationCallback(() => {
        volLight.position.x = Math.sin(Date.now() * 0.001) * 100;
        spotLightHelper.update();
    });
}

function createAngelRing() {
    const rings = [];
    const ringCount = 20; // リングの数
    const movementPatterns = []; // 各リングの動きのパターンを保持する配列

    // リングを作成し、シーンに追加
    for (let i = 0; i < ringCount; i++) {
        const radius = Math.random() * 1.5 + 0.5; // 半径は0.5から2.0のランダム
        const tube = Math.random() * 0.2 + 0.05; // チューブの太さは0.05から0.25のランダム
        const geometry = new THREE.TorusGeometry(radius, tube, 16, 100);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
            fog: false // このマテリアルのオブジェクトは霧の影響を受けない
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.position.set(
            (Math.random() - 0.5) * 30, // X軸: -15から15の範囲
            (Math.random() - 0.5) * 30, // Y軸: -15から15の範囲
            (Math.random() - 0.5) * 30  // Z軸: -15から15の範囲
        );
        scene.add(ring);
        rings.push(ring);

        // 各リングの動きのパターンをランダムに生成
        movementPatterns.push({
            x: Math.random() * 0.2 - 0.1,
            y: Math.random() * 0.2 - 0.1,
            z: Math.random() * 0.2 - 0.1,
            changeInterval: Math.random() * 3000 + 2000, // 2秒から5秒の間でランダム
            hue: Math.random() // 色相の初期値
        });
    }

    // アニメーションコールバックにリングの動きを追加
    addAnimationCallback(() => {
        const time = Date.now() * 0.0001; // 色の変化速度を調整
        rings.forEach((ring, index) => {
            const pattern = movementPatterns[index];
            ring.position.x += pattern.x;
            ring.position.y += pattern.y;
            ring.position.z += pattern.z;

            // 一定間隔で動きの方向を反転させる
            if (Date.now() % pattern.changeInterval < 50) {
                pattern.x = -pattern.x;
                pattern.y = -pattern.y;
                pattern.z = -pattern.z;
            }

            // 色を時間とともに変化させる
            ring.material.color.setHSL((pattern.hue + time) % 1, 1, 0.5);

            ring.rotation.x += 0.005; // X軸回りにゆっくり回転
            ring.rotation.y += 0.005; // Y軸回りにゆっくり回転
        });
    });
}


function createHollowSun() {
    // 外側の球体
    const outerGeometry = new THREE.SphereGeometry(5, 32, 32);
    const outerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.5
    });
    const outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
    outerSphere.position.set(0, 0, 0);
    scene.add(outerSphere);

    // 内側の球体（少し小さい）
    const innerGeometry = new THREE.SphereGeometry(4.8, 32, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000, // 内側は黒またはシーンの背景色に合わせる
        side: THREE.FrontSide
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    innerSphere.position.set(0, 0, 0);
    scene.add(innerSphere);

    // 点光源を内側の球体の中心に配置
    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 光が漏れるエフェクトを強調するために、光源の強度や色、距離を調整する
    pointLight.intensity = 2; // 光の強度を強くする
    pointLight.distance = 15; // 光が届く距離を設定
    pointLight.color.setHex(0xffee88); // 光の色を暖かみのある色に設定
}

function createSun() {
    // 太陽として機能する点光源を作成します。
    // 引数は次の通りです:
    // 1. 色 - 光の色を16進数で指定します（ここでは白色）。
    // 2. 強度 - 光の強さを指定します。
    // 3. 距離 - 光が届く最大距離を指定します。この距離を超えると光は減衰します。

    const sunLight = new THREE.PointLight(0xffffff, 10, 2000);
    sunLight.position.set(0, 0, 0); // 太陽の位置を設定
    scene.add(sunLight);

    // 太陽として機能する球体を作成
    const sphereGeometry = new THREE.SphereGeometry(5, 32, 32); 
    const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side:THREE.BackSide
    });
    const sunSphere = new THREE.Mesh(sphereGeometry, material);
    sunSphere.position.set(sunLight.position.x, sunLight.position.y, sunLight.position.z);
    scene.add(sunSphere);

    // シーンに太陽を追加
    scene.add(sunLight);
}


function setupParticles() {
    // パーティクルのジオメトリを作成
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000; // パーティクルの数
    const posArray = new Float32Array(particlesCount * 3); // 位置情報(x, y, z)

    // パーティクルの位置をランダムに設定
    for (let i = 0; i < particlesCount * 3; i++) {
        // -50 から 50 の範囲でランダムに配置
        posArray[i] = (Math.random() - 0.5) * 100;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // パーティクルのマテリアルを作成
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.5,
        transparent: true,
        opacity: 0.1, // 透明度を設定
        color: 0xffffff
    });

    // パーティクルシステムを作成
    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);

    // シーンにパーティクルシステムを追加
    scene.add(particleSystem);
}

function setupMovablePanel() {
    // 平面のジオメトリを作成
    const planeGeometry = new THREE.PlaneGeometry(30, 30);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(0, 0, -5); // 初期位置を設定
    scene.add(plane);

    // ドラッグコントロールを設定
    const dragControls = new DragControls([plane], camera, renderer.domElement);
    dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false; // ドラッグ中はオービットコントロールを無効にする
    });
    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true; // ドラッグ終了後はオービットコントロールを有効にする
    });
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
            setupConcertLightEffect();
            resolve();
        }),
        () => new Promise(resolve => {

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

function setupScene() {
    // シーン設定用の定数
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色を白に設定
        fogColor: 0xffffff,         // 霧の色を黒に設定
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
    //scene.add(directionalLight);

    // スポットライトの追加
    const spotLight = new THREE.SpotLight(0xffffff, 0.7, 1000, Math.PI / 4, 0.5, 2); // 白色のスポットライトを追加し、光の強度を0.7に設定
    spotLight.position.set(100, 300, 100); // スポットライトの位置を設定
    spotLight.castShadow = true; // 影の生成を有効にする
    //scene.add(spotLight);

    // ポイントライトの追加
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 500); // 白色のポイントライトを追加し、光の強度を0.5に設定
    pointLight.position.set(-100, 200, -100); // ポイントライトの位置を設定
    //scene.add(pointLight);

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

    //renderer.render(scene, camera); // シーンとカメラを使ってレンダリング
    stats.update(); // パフォーマンス統計を更新
}

// 使い方:
// アニメーションループに新しい動作を追加したい場合は、addAnimationCallbackを使用してください。
// 例: addAnimationCallback(() => { console.log("アニメーションフレーム!"); });

init();

