import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { TextureLoader, PlaneGeometry, MeshBasicMaterial, Mesh } from 'three';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;
let currentMesh;
let pieces = []; // 分割されたメッシュを格納する配列
let effectMesh; // エフェクト適用用のメッシュ

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
        loadAndDisplayImage();

        // アニメーションの開始を少し遅らせる
        setTimeout(() => {
            startAnimation();
            loadingIndicator.style.display = 'none';
        }, 2000);
    });

    window.addEventListener('resize', onWindowResize, false);

    document.getElementById('simpleWaveButton').addEventListener('click', function() {
        applyEffectWithNewMesh('simple');
    });
    document.getElementById('complexWaveButton').addEventListener('click', function() {
        applyEffectWithNewMesh('complex');
    });
    document.getElementById('diagonalWaveButton').addEventListener('click', function() {
        applyEffectWithNewMesh('diagonal');
    });

    document.getElementById('verticalSplitButton').addEventListener('click', function() {
        applyEffectWithNewMesh('vertical', 5);
    });

    document.getElementById('horizontalSplitButton').addEventListener('click', function() {
        applyEffectWithNewMesh('horizontal', 5);
    });

    document.getElementById('gridSplitButton').addEventListener('click', function() {
        applyEffectWithNewMesh('grid', 32); // 3x3 grid
    });
}

function loadAndDisplayImage() {
    const loader = new THREE.TextureLoader();
    loader.load('20220916-_MG_0102.jpg', function(texture) {
        if (!(texture instanceof THREE.Texture)) {
            console.error('Failed to load texture as THREE.Texture');
            return;
        }

        const aspectRatio = texture.image.width / texture.image.height;
        const planeGeometry = new PlaneGeometry(20 * aspectRatio, 20, 100, 100); // 波打ち効果用に分割数を追加
        const planeMaterial = new MeshBasicMaterial({ map: texture });
        currentMesh = new Mesh(planeGeometry, planeMaterial);
   
        scene.add(currentMesh);
        camera.lookAt(currentMesh.position); // カメラの向きを画像に
    }, undefined, function(error) {
        console.error('An error happened during loading texture:', error);
    });
}

function applyWaveEffect(mesh, pattern) {
    const wavePatterns = {
        simple: (x, y, t) => Math.sin(x / 2 + t) * 0.5,
        complex: (x, y, t) => Math.sin(x * 2 + t) * Math.cos(y * 2 + t) * 0.5,
        diagonal: (x, y, t) => Math.sin((x + y) * 2 + t) * 0.5
    };

    if (!wavePatterns[pattern]) {
        console.error(`Wave pattern '${pattern}' is not defined.`);
        return; // 未定義のパターンが指定された場合は処理を中断
    }

    function updateWave(t) {
        const positions = mesh.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            positions[i + 2] = wavePatterns[pattern](x, y, t); // Z position
        }
        mesh.geometry.attributes.position.needsUpdate = true;
    }

    function animateWave() {
        requestAnimationFrame(animateWave);
        const t = Date.now() * 0.001;
        updateWave(t);
        renderer.render(scene, camera);
    }

    animateWave();
}

function applyEffectWithNewMesh(effectType, divisions) {
    if (effectMesh) {
        scene.remove(effectMesh);
    }
    effectMesh = currentMesh.clone();

    // 分割パーンの場合
    if (effectType === 'vertical' || effectType === 'horizontal' || effectType === 'grid') {
        splitAndDisplayImage(effectMesh, divisions, effectType);
    }
    // 波形エフェクトのパターンの場合
    else if (effectType === 'simple' || effectType === 'complex' || effectType === 'diagonal') {
        applyWaveEffect(effectMesh, effectType);
    }
    else {
        console.error(`Effect type '${effectType}' is not defined.`);
    }
}

function splitAndDisplayImage(mesh, divisions, pattern) {
    const texture = mesh.material.map;
    const originalGeometry = mesh.geometry;
    const width = originalGeometry.parameters.width;
    const height = originalGeometry.parameters.height;
    const maxDistance = 50; // 最大の離れる距離

    pieces.forEach(piece => scene.remove(piece));
    pieces = [];

    let pieceWidth, pieceHeight, offsetX, offsetY;

    switch (pattern) {
        case 'vertical':
            pieceWidth = width / divisions;
            pieceHeight = height;
            for (let i = 0; i < divisions; i++) {
                offsetX = (i / divisions) * width;
                createPiece(pieceWidth, pieceHeight, i, 0, divisions, texture, maxDistance, true);
            }
            break;
        case 'horizontal':
            pieceWidth = width;
            pieceHeight = height / divisions;
            for (let i = 0; i < divisions; i++) {
                offsetY = (i / divisions) * height;
                createPiece(pieceWidth, pieceHeight, 0, i, divisions, texture, maxDistance, false);
            }
            break;
        case 'grid':
            const gridDivisions = Math.sqrt(divisions);
            pieceWidth = width / gridDivisions;
            pieceHeight = height / gridDivisions;
            for (let i = 0; i < gridDivisions; i++) {
                for (let j = 0; j < gridDivisions; j++) {
                    offsetX = (j / gridDivisions) * width;
                    offsetY = (i / gridDivisions) * height;
                    createGridPiece(pieceWidth, pieceHeight, j, i, gridDivisions, texture, maxDistance);
                }
            }
            break;
    }
}

function createPiece(width, height, colIndex, rowIndex, divisions, texture, maxDistance, isVertical) {
    if (!(texture instanceof THREE.Texture)) {
        console.error('Provided texture is not a valid THREE.Texture object.');
        return;
    }

    const planeGeometry = new THREE.PlaneGeometry(width, height, 1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture.clone(),
        side: THREE.DoubleSide,
        transparent: true
    });

    // テクスチャのオフセットとリピートを調整
    if (isVertical) {
        planeMaterial.map.offset.x = colIndex / divisions;
        planeMaterial.map.repeat.x = 1 / divisions;
        planeMaterial.map.offset.y = 0;
        planeMaterial.map.repeat.y = 1;
    } else {
        planeMaterial.map.offset.x = 0;
        planeMaterial.map.repeat.x = 1;
        planeMaterial.map.offset.y = rowIndex / divisions;
        planeMaterial.map.repeat.y = 1 / divisions;
    }

    const pieceMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    pieceMesh.position.x = (Math.random() - 0.5) * maxDistance;
    pieceMesh.position.y = (Math.random() - 0.5) * maxDistance;
    pieceMesh.position.z = (Math.random() - 0.5) * maxDistance;

    scene.add(pieceMesh);
    pieces.push(pieceMesh);
}

function createGridPiece(width, height, colIndex, rowIndex, divisions, texture, maxDistance) {
    const planeGeometry = new THREE.PlaneGeometry(width, height, 1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture.clone(),
        side: THREE.DoubleSide,
        transparent: true
    });

    planeMaterial.map.offset.x = colIndex / divisions;
    planeMaterial.map.repeat.x = 1 / divisions;
    planeMaterial.map.offset.y = rowIndex / divisions;
    planeMaterial.map.repeat.y = 1 / divisions;

    const pieceMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    pieceMesh.position.x = (Math.random() - 0.5) * maxDistance;
    pieceMesh.position.y = (Math.random() - 0.5) * maxDistance;
    pieceMesh.position.z = (Math.random() - 0.5) * maxDistance;

    scene.add(pieceMesh);
    pieces.push(pieceMesh);
}



function startAnimation() {
    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';
    document.body.appendChild(stats.dom);

    animate();
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,
        fogColor: 0x000000,
        fogNear: 1,
        fogFar: 300,
        ambientLightColor: 0xFFFFFF
    };

    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);

    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 300, 500);
    scene.add(directionalLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1.5, 1000, Math.PI / 4, 0.5, 2);
    spotLight.position.set(100, 300, 100);
    spotLight.castShadow = true;
    scene.add(spotLight);

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
    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = 0;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.enablePan = true;

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

