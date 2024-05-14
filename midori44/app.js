import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;


function init() {

     // カメラの作成
     camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
     camera.position.set(0, 5, 10);
     camera.lookAt(0, 0, 0);
    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    document.body.appendChild(renderer.domElement);
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        // ローディングインジケーターを表示
        let loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';

        setupScene();
        setupControls();
        // アニメーションの開始を少し遅らせる
        setTimeout(() => {
            startAnimation();
            loadingIndicator.style.display = 'none';
        }, 2000);
    });

    window.addEventListener('resize', onWindowResize, false);

}

function startAnimation() {


    // グリッドの平面の作成
    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    // XYZ軸の矢印の作成
    const axesHelper = new THREE.AxesHelper(10);  // サイズを大きく設定
    scene.add(axesHelper);

    // Statsの設定
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';  // 左側の位置指定を解除    
    document.body.appendChild(stats.dom);
    createRefinedLightningEffect();
    animate(); // アニメーションループを開始する
}

function createRefinedLightningEffect() {
    function generateRefinedLightning(startX, startY, startZ, endX, endY, endZ, depth) {
        if (depth > 2) return; // 分岐の深さを制限

        const points = [];
        const segments = Math.floor(Math.random() * 20 + 10); // 10から30のセグメント
        let x = endX, y = endY, z = endZ; // 終点から始める

        points.push(new THREE.Vector3(x, y, z)); // 終点を最初に追加
        const dx = (startX - endX) / segments;
        const dy = (startY - endY) / segments;
        const dz = (startZ - endZ) / segments;

        for (let i = 0; i < segments; i++) {
            x += dx + Math.random() * 20 - 10; // 前回のxから-10から10の範囲で変化
            y += dy + Math.random() * 20 - 10; // 前回のyから-10から10の範囲で変化
            z += dz + Math.random() * 20 - 10; // 前回のzから-10から10の範囲で変化
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, segments, 0.2, 20, false);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffff00, // 黄色に設定
            emissive: 0x222222, // 発光色を控えめに
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // ライトの追加
        const light = new THREE.PointLight(0xffffff, 0.5, 100); // ライトの強度を下げる
        light.position.set(x, y, z);
        scene.add(light);

        // 稲妻のフェードアウトと削除
        let count = 0;
        function fadeOut() {
            if (count > 100) {
                scene.remove(mesh);
                scene.remove(light);
                return;
            }
            mesh.material.opacity = Math.max(0, 0.9 - (count / 100) * 0.9);
            light.intensity = Math.max(0, 0.5 - (count / 100) * 0.5); // ライトの強度を徐々に下げる
            mesh.material.needsUpdate = true;
            requestAnimationFrame(fadeOut);
            count++;
        }

        fadeOut();

        // 稲妻の始点でエフェクトを生成
        createImpactEffect(startX, startY, startZ);
    }

    // 稲妻を繰り返し生成
    function repeatRefinedLightning() {
        generateRefinedLightning(0, 0, 0, 0, 0, 0, 0); // 初期位置、終了位置、分岐の深さ
        setTimeout(repeatRefinedLightning, Math.random() * 3000 + 1000); // 1秒から4秒の間隔で繰り返し
    }

    repeatRefinedLightning();
}

function createImpactEffect(x, y, z) {
    const geometry = new THREE.CircleGeometry(0.5, 32); // 半径0.5、32の分割数で円形のジオメトリを作成
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00, // 色は黄色
        side: THREE.DoubleSide, // 両面が見えるように
        transparent: true, // 透明度を有効に
        opacity: 0.8 // 初期の透明度は0.8
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(x, y, z);
    circle.rotation.x = -Math.PI / 2; // X軸に対して90度回転させて地面に平行にする

    scene.add(circle); // シーンに円を追加

    let scale = 1; // 初期スケールは1
    function expand() {
        if (scale > 5) { // スケールが5を超えたら
            scene.remove(circle); // シーンから円を削除
            return;
        }
        circle.scale.set(scale, scale, scale); // スケールを設定
        circle.material.opacity = Math.max(0, 0.8 - (scale / 5) * 0.8); // 透明度を徐々に下げる
        scale += 0.1; // スケールを徐々に大きくする
        requestAnimationFrame(expand); // 次のフレームでexpandを呼び出す
    }

    expand(); // アニメーションを開始
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色
        fogColor: 0x000000,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,               // 霧の終了距離
        ambientLightColor: 0xFFFFFF // 環境光の色
    };

    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);

    // の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor);
    scene.add(ambientLight);

    // 平行光源の追加と設定の強化
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 光の度くす
    directionalLight.position.set(0, 300, 500);
    scene.add(directionalLight);

    // スポットライトの追加
    const spotLight = new THREE.SpotLight(0xffffff, 1.5, 1000, Math.PI / 4, 0.5, 2);
    spotLight.position.set(100, 300, 100);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // ポイントライトの追加
    const pointLight = new THREE.PointLight(0xffffff, 1, 500);
    pointLight.position.set(-100, 200, -100);
    scene.add(pointLight);

    renderer.shadowMap.enabled = true;
    directionalLight.castShadow = true;
    spotLight.castShadow = true;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
}

function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI; // 180度
    controls.minPolarAngle = 0; // 0度
    controls.maxAzimuthAngle = Math.PI / 2; // 90度
    controls.minAzimuthAngle = -Math.PI / 2; // -90度
    controls.enablePan = true;

    // スマートフォンでの二点タチにるパン操作を有効にする
    controls.enableTouchPan = true;

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3;
        controls.touchDampingFactor = 0.2;
    } else {
        controls.panSpeed = 0.5;
        controls.touchDampingFactor = 0.1;
    }


}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

init();

