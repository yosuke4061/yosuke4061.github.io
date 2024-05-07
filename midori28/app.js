import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

// シーン、カメラ、レンダラー、コントロール、統計情報の変数を定義
let scene, camera, renderer, controls, stats;
let mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster();
let cube;
let particleSystem = new THREE.Group(); // 粒子システムをグループとして定義
let lastParticleTime = Date.now();
const particleReleaseInterval = 100; // 粒子を生成する間隔（ミリ秒）
const gravity = new THREE.Vector3(0, -0.02, 0); // 重力ベクトル
let startTime;

function init() {
    // カメラの設定
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(50, -50, 150);
    camera.lookAt(0, 0, 0);

    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    // シーンの設定
    setupScene();

    // コントロールの設定
    setupControls();

    // 統計情報の設定
    setupStats();
    // 立方体の追加
    const cubeGeometry = new THREE.BoxGeometry(20, 20, 20);
    const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, -50, 0);
    scene.add(cube);
    // 流体シミュレーションの初期化
    initFluidSimulation();

    window.addEventListener('click', onMouseClick, false);
    window.addEventListener('mousemove', onMouseMove, false);
    // ウィンドウリサイズイベントの設定
    window.addEventListener('resize', onWindowResize, false);
    // アニメーション開始時刻の設定
    startTime = Date.now(); // ここで startTime を定義

}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0xaaccff, 1, 1000);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
}

function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = 0;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI / 2;
}

function setupStats() {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';
    document.body.appendChild(stats.dom);
}


function createParticle() {
    const sphereGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x5555ff });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.x = cube.position.x; // 立方体のX座標
    sphere.position.y = cube.position.y + 50; // 立方体の上50ユニット
    sphere.position.z = cube.position.z; // 立方体のZ座標
    sphere.userData.velocity = new THREE.Vector3(0, -0.2, 0); // 下向きの初速
    particleSystem.add(sphere);
}



function applyMouseForce() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(particleSystem.children);

    if (intersects.length > 0) {
        const forceMagnitude = 0.5;
        const force = new THREE.Vector3(0, 0, forceMagnitude); // Z方向に力を加える例
        intersects[0].object.userData.velocity.add(force);
    }
}
function applyTurbulence() {
    const turbulenceIntensity = 0.05; // 乱流の強度
    particleSystem.children.forEach(particle => {
        const turbulenceForce = new THREE.Vector3(
            (Math.random() * 2 - 1) * turbulenceIntensity,
            (Math.random() * 2 - 1) * turbulenceIntensity,
            (Math.random() * 2 - 1) * turbulenceIntensity
        );
        particle.userData.velocity.add(turbulenceForce);
    });
}
function updateSurfaceTension() {
    const surfaceTensionCoefficient = 0.02;
    const surfaceDistanceThreshold = 2.5;

    for (let i = 0; i < particleSystem.children.length; i++) {
        const particleA = particleSystem.children[i];

        for (let j = 0; j < particleSystem.children.length; j++) {
            if (i !== j) {
                const particleB = particleSystem.children[j];
                const distance = particleA.position.distanceTo(particleB.position);
                if (distance < surfaceDistanceThreshold) {
                    const forceDirection = new THREE.Vector3().subVectors(particleB.position, particleA.position).normalize();
                    const forceMagnitude = surfaceTensionCoefficient * (surfaceDistanceThreshold - distance) / surfaceDistanceThreshold;
                    const surfaceTensionForce = forceDirection.multiplyScalar(forceMagnitude);

                    particleA.userData.velocity.add(surfaceTensionForce);
                }
            }
        }
    }
}


function updateViscosity() {
    const viscosityCoefficient = 0.1;
    const maxDistance = 3.0;

    for (let i = 0; i < particleSystem.children.length; i++) {
        const particleA = particleSystem.children[i];

        for (let j = 0; j < particleSystem.children.length; j++) {
            if (i !== j) {
                const particleB = particleSystem.children[j];
                const distance = particleA.position.distanceTo(particleB.position);
                if (distance < maxDistance) {
                    const velocityDifference = new THREE.Vector3().subVectors(particleB.userData.velocity, particleA.userData.velocity);
                    const forceMagnitude = viscosityCoefficient * (maxDistance - distance) / maxDistance;
                    const viscosityForce = velocityDifference.multiplyScalar(forceMagnitude);

                    particleA.userData.velocity.add(viscosityForce);
                }
            }
        }
    }
}


function applyForces() {
    particleSystem.children.forEach(particle => {
        particle.userData.velocity.add(gravity);
    });
}

function checkBounds(particle) {
    const bounds = 50; // 境界の大きさ

    ['x', 'y', 'z'].forEach(axis => {
        if (particle.position[axis] > bounds) {
            particle.position[axis] = bounds;
            particle.userData.velocity[axis] *= -0.5; // 境界での反射と速度減衰
        } else if (particle.position[axis] < -bounds) {
            particle.position[axis] = -bounds;
            particle.userData.velocity[axis] *= -0.5;
        }
    });
}


function updateParticleInteractions() {
    const repulsionForce = 0.05;
    const distanceThreshold = 5.0;

    for (let i = 0; i < particleSystem.children.length; i++) {
        const particleA = particleSystem.children[i];

        for (let j = i + 1; j < particleSystem.children.length; j++) {
            const particleB = particleSystem.children[j];
            const distance = particleA.position.distanceTo(particleB.position);

            if (distance < distanceThreshold) {
                const forceDirection = new THREE.Vector3().subVectors(particleA.position, particleB.position).normalize();
                const forceMagnitude = repulsionForce * (distanceThreshold - distance) / distanceThreshold;
                const force = forceDirection.multiplyScalar(forceMagnitude);

                particleA.userData.velocity.add(force);
                particleB.userData.velocity.sub(force);
            }
        }
    }
    // 立方体との相互作用を追加
    const cubeBounds = new THREE.Box3().setFromObject(cube);
    const repulsionStrength = 0.2; // 反発力の強さ
    particleSystem.children.forEach(particle => {
        if (cubeBounds.containsPoint(particle.position)) {
            // 立方体内に入った粒子に対する処理
            const escapeDirection = new THREE.Vector3().subVectors(particle.position, cube.position).normalize();
            particle.userData.velocity.add(escapeDirection.multiplyScalar(0.1));
        } else {
            // 立方体の近くで粒子に反発力を加える
            const closestPoint = new THREE.Vector3().copy(particle.position).clamp(cubeBounds.min, cubeBounds.max);
            const distance = particle.position.distanceTo(closestPoint);
            if (distance < 3) { // 反発を開始する距離
                const repulsionDirection = new THREE.Vector3().subVectors(particle.position, closestPoint).normalize();
                const repulsionForce = repulsionDirection.multiplyScalar(repulsionStrength * (5 - distance));
                particle.userData.velocity.add(repulsionForce);
            }
        }
    });
}

function initFluidSimulation() {
    const particleCount = 800;
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x5555ff });

    for (let i = 0; i < particleCount; i++) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.x = Math.random() * 100 - 50;
        sphere.position.y = Math.random() * 100 - 50;
        sphere.position.z = Math.random() * 100 - 50;
        // 速度ベクトルのスケールを増やす
        sphere.userData.velocity = new THREE.Vector3((Math.random() * 2 - 1) * 2, (Math.random() * 2 - 1) * 2, (Math.random() * 2 - 1) * 2);
        particleSystem.add(sphere);
    }

    scene.add(particleSystem);
}
function onMouseClick(event) {
    // マウス位置を正規化
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // レイキャスターを使用してクリックされた位置の粒子を検出
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(particleSystem.children);

    if (intersects.length > 0) {
        const forceMagnitude = 5; // クリックによる力の大きさ
        const force = new THREE.Vector3(0, 0, forceMagnitude); // Z方向に大きな力を加える
        intersects[0].object.userData.velocity.add(force);
    }
}
function onMouseMove(event) {
    // マウス位置を正規化
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const now = Date.now();
    const timeSinceStart = now - startTime; // 開始からの経過時間を計算

    if (timeSinceStart > 10000 && timeSinceStart < 30000) { // 10秒後から30秒後までの間
        if (now - lastParticleTime > particleReleaseInterval) {
            createParticle();
            lastParticleTime = now;
        }
    }

    applyMouseForce(); // マウスによる力を適用
    updateParticleInteractions(); // 相互作用を更新
    updateViscosity(); // 粘性力を更新
    updateSurfaceTension(); // 表面張力を更新
    applyTurbulence(); // 乱流を適用
    applyForces(); // 重力などの外力を適用

    // 粒子の位置を更新
    particleSystem.children.forEach(particle => {
        particle.position.add(particle.userData.velocity.multiplyScalar(1));
        checkBounds(particle); // 境界条件のチェック
    });

    controls.update();
    renderer.render(scene, camera);
    stats.update();
}



init();
animate();

