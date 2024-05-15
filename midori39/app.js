import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;
let globalPlaneMesh; // グローバルにメッシュを保持


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
        // アニメーシ���始を少し遅らせる
        setTimeout(() => {

            const imagePath = '20220922-_MG_0729.jpg';
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(imagePath, (texture) => {
                const aspectRatio = texture.image.width / texture.image.height;
                const planeGeometry = new THREE.PlaneGeometry(50 * aspectRatio, 50);
                const planeMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true
                });
                const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
                planeMesh.position.set(0, 50, 0); // 中央、Y軸方向に50上に配置
                scene.add(planeMesh);
            });

            startAnimation();
            setupDividedMeshes(); // メッシュの初期設定を追加
            loadingIndicator.style.display = 'none';
        }, 2000);
    });

    window.addEventListener('resize', onWindowResize, false);
    // 画像をシーンに追加

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

    // ボタンを追加
    const divideSquaresButton = document.getElementById('divideSquares');
    const divideTrianglesButton = document.getElementById('divideTriangles');
    const dividePentagonsButton = document.getElementById('dividePentagons');
    const divideHexagonsButton = document.getElementById('divideHexagons');

    divideHexagonsButton.addEventListener('click', () => {
        clearDividedMeshes();
        placeImageInSceneWithAspectRatio('20220922-_MG_0729.jpg', scene, 50, (planeMesh) => {
            divideImageIntoHexagons(planeMesh, 10, 100);
        });
    });
    divideSquaresButton.addEventListener('click', () => {
        clearDividedMeshes();
        placeImageInSceneWithAspectRatio('20220922-_MG_0729.jpg', scene, 50, (planeMesh) => {
            divideImageIntoSquares(planeMesh, 10, 100);
        });
    });

    divideTrianglesButton.addEventListener('click', () => {
        clearDividedMeshes();
        placeImageInSceneWithAspectRatio('20220922-_MG_0729.jpg', scene, 50, (planeMesh) => {
            divideImageIntoTriangles(planeMesh, 10, 100);
        });
    });

    dividePentagonsButton.addEventListener('click', () => {
        clearDividedMeshes();
        placeImageInSceneWithAspectRatio('20220922-_MG_0729.jpg', scene, 50, (planeMesh) => {
            divideImageIntoPentagons(planeMesh, 10, 100);
        });
    });

    animate(); // アニメーションループを開始する
}

function clearDividedMeshes() {
    // 分割されたメッシュが特定の名前やプロパティを持っていると仮定してフィルタリング
    const removableObjects = scene.children.filter(obj => obj.name === 'dividedMesh');
    removableObjects.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose(); // ジメトリのメモリ解
        if (obj.material) obj.material.dispose(); // マテリアルのメモリ解放
    });
}

function placeImageInSceneWithAspectRatio(imagePath, scene, yPosition, callback) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const aspectRatio = texture.image.width / texture.image.height;
        const planeGeometry = new THREE.PlaneGeometry(100 * aspectRatio, 100);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true
        });
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(planeMesh);

        // コールバックを使用して、メッシュが準備できたら次の処理を実行
        if (callback) {
            callback(planeMesh);
        }
    });
}
function divideImageIntoTriangles(planeMesh, divisions, maxDistance) {
    const texture = planeMesh.material.map;
    const width = planeMesh.geometry.parameters.width;
    const height = planeMesh.geometry.parameters.height;
    const pieceWidth = width / divisions;
    const pieceHeight = height / divisions;

    scene.remove(planeMesh); // 元のメッシュをシーンから削除

    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            const clonedTexture = texture.clone();
            clonedTexture.offset.x = i / divisions;
            clonedTexture.repeat.x = 1 / divisions;
            clonedTexture.offset.y = 1 - (j + 1) / divisions;
            clonedTexture.repeat.y = 1 / divisions;

            // 三角形のジオメリを作成
            const triangleGeometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                0, 0, 0,  // 頂点1
                pieceWidth, 0, 0,  // 頂点2
                pieceWidth, pieceHeight, 0  // 頂点3
            ]);
            triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            const uv = new Float32Array([
                0, 0,
                1, 0,
                1, 1
            ]);
            triangleGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
            triangleGeometry.computeVertexNormals();

            const triangleMaterial = new THREE.MeshBasicMaterial({
                map: clonedTexture,
                side: THREE.DoubleSide,
                transparent: true
            });
            const triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);
            triangleMesh.name = 'dividedMesh'; // この行を追加

            // ランダムな位置に配置
            triangleMesh.position.x = (Math.random() - 0.5) * maxDistance;
            triangleMesh.position.y = (Math.random() - 0.5) * maxDistance;
            triangleMesh.position.z = (Math.random() - 0.5) * maxDistance;
            triangleMesh.userData.rotationSpeed = { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02, z: (Math.random() - 0.5) * 0.02 };
            triangleMesh.userData.movementSpeed = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.2 };
            scene.add(triangleMesh);
        }
    }
}
function divideImageIntoSquares(planeMesh, divisions, maxDistance) {
    const texture = planeMesh.material.map;
    const width = planeMesh.geometry.parameters.width;
    const height = planeMesh.geometry.parameters.height;
    const pieceWidth = width / divisions;
    const pieceHeight = height / divisions;

    scene.remove(planeMesh); // 元のメッシュをシーンから削除

    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            const clonedTexture = texture.clone();
            clonedTexture.offset.x = i / divisions;
            clonedTexture.repeat.x = 1 / divisions;
            clonedTexture.offset.y = 1 - (j + 1) / divisions;
            clonedTexture.repeat.y = 1 / divisions;

            const planeGeometry = new THREE.PlaneGeometry(pieceWidth, pieceHeight);
            const planeMaterial = new THREE.MeshBasicMaterial({
                map: clonedTexture,
                side: THREE.DoubleSide,
                transparent: true
            });
            const pieceMesh = new THREE.Mesh(planeGeometry, planeMaterial);
            pieceMesh.name = 'dividedMesh'; // この行を追加

            // ランダムな位置に配置
            pieceMesh.position.x = (Math.random() - 0.5) * maxDistance;
            pieceMesh.position.y = (Math.random() - 0.5) * maxDistance;
            pieceMesh.position.z = (Math.random() - 0.5) * maxDistance;
            pieceMesh.userData.rotationSpeed = { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02, z: (Math.random() - 0.5) * 0.02 };
            pieceMesh.userData.movementSpeed = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.2 };

            scene.add(pieceMesh);
        }
    }
}
function divideImageIntoPentagons(planeMesh, divisions, maxDistance) {
    const texture = planeMesh.material.map;
    const width = planeMesh.geometry.parameters.width;
    const height = planeMesh.geometry.parameters.height;
    const pieceWidth = width / divisions;
    const pieceHeight = height / divisions;

    scene.remove(planeMesh); // 元のメッシュをシーンから削除

    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            const clonedTexture = texture.clone();
            clonedTexture.offset.x = i / divisions;
            clonedTexture.repeat.x = 1 / divisions;
            clonedTexture.offset.y = 1 - (j + 1) / divisions;
            clonedTexture.repeat.y = 1 / divisions;

            // 五角形のジオメトリを作成
            const pentagonGeometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                0, 0, 0,  // 中心点
                pieceWidth / 2, 0, 0,  // 下部中央
                pieceWidth, pieceHeight * 0.4, 0,  // 右下
                pieceWidth * 0.5, pieceHeight, 0,  // 上部
                0, pieceHeight * 0.4, 0  // 左下
            ]);
            pentagonGeometry.setIndex([
                0, 1, 2,
                0, 2, 3,
                0, 3, 4,
                0, 4, 1  // 五角形を四つの三角形に分割
            ]);
            pentagonGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            const uv = new Float32Array([
                0.5, 0.5,  // 中心点
                1, 0.5,    // 下部中央
                1, 1,      // 右下
                0.5, 1,    // 上部
                0, 1       // 左下
            ]);
            pentagonGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
            pentagonGeometry.computeVertexNormals();

            const pentagonMaterial = new THREE.MeshBasicMaterial({
                map: clonedTexture,
                side: THREE.DoubleSide,
                transparent: true
            });
            const pentagonMesh = new THREE.Mesh(pentagonGeometry, pentagonMaterial);
            pentagonMesh.name = 'dividedMesh'; // この行追加

            // ���ンダムな位置に配置
            pentagonMesh.position.x = (Math.random() - 0.5) * maxDistance;
            pentagonMesh.position.y = (Math.random() - 0.5) * maxDistance;
            pentagonMesh.position.z = (Math.random() - 0.5) * maxDistance;
            pentagonMesh.userData.rotationSpeed = { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02, z: (Math.random() - 0.5) * 0.02 };
            pentagonMesh.userData.movementSpeed = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.2 };

            scene.add(pentagonMesh);
        }
    }
}


function divideImageIntoHexagons(planeMesh, divisions, maxDistance) {
    const texture = planeMesh.material.map;
    const width = planeMesh.geometry.parameters.width;
    const height = planeMesh.geometry.parameters.height;
    const pieceWidth = width / divisions;
    const pieceHeight = height / divisions;

    scene.remove(planeMesh); // 元のメッシュをシーンから削除

    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            const clonedTexture = texture.clone();
            clonedTexture.offset.x = i / divisions;
            clonedTexture.repeat.x = 1 / divisions;
            clonedTexture.offset.y = 1 - (j + 1) / divisions;
            clonedTexture.repeat.y = 1 / divisions;

            // 六角形のジオメトリを作成
            const hexagonGeometry = new THREE.BufferGeometry();
            const vertices = [];
            const indices = [];
            const uvs = [];
            const angleStep = Math.PI / 3;
            const radius = Math.min(pieceWidth, pieceHeight) / 2;

            // 頂点とUVを計算
            vertices.push(0, 0, 0); // 中心点
            uvs.push(0.5, 0.5); // 中心点のUV
            for (let k = 0; k < 6; k++) {
                vertices.push(
                    radius * Math.cos(angleStep * k), // x
                    radius * Math.sin(angleStep * k), // y
                    0 // z
                );
                uvs.push(
                    0.5 + 0.5 * Math.cos(angleStep * k), // UV x
                    0.5 + 0.5 * Math.sin(angleStep * k)  // UV y
                );
            }

            // インデックスを設定
            for (let k = 1; k <= 6; k++) {
                indices.push(0, k, k % 6 + 1);
            }

            hexagonGeometry.setIndex(indices);
            hexagonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            hexagonGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            hexagonGeometry.computeVertexNormals();

            const hexagonMaterial = new THREE.MeshBasicMaterial({
                map: clonedTexture,
                side: THREE.DoubleSide,
                transparent: true
            });
            const hexagonMesh = new THREE.Mesh(hexagonGeometry, hexagonMaterial);
            hexagonMesh.name = 'dividedMesh'; // この行を追加

            hexagonMesh.position.x = (Math.random() - 0.5) * maxDistance + i * pieceWidth - width / 2;
            hexagonMesh.position.y = (Math.random() - 0.5) * maxDistance + j * pieceHeight - height / 2;
            hexagonMesh.position.z = (Math.random() - 0.5) * maxDistance;
            hexagonMesh.userData.rotationSpeed = { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02, z: (Math.random() - 0.5) * 0.02 };
            hexagonMesh.userData.movementSpeed = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.2 };

            scene.add(hexagonMesh);
        }
    }
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背景色
        fogColor: 0x000000,         // 霧の色
        fogNear: 1,                 // 霧の開距離
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
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 光の強度を強くする
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

    // スマートフォンでの二点タッチによるパン操作を有効にする
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


function setupDividedMeshes() {
    scene.children.forEach(obj => {
        if (obj.name === 'dividedMesh') {
            // 各メッシュにランダムな速度を設定
            obj.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            };
            obj.userData.movementSpeed = {
                x: (Math.random() - 0.5) * 0.2,
                y: (Math.random() - 0.5) * 0.2,
                z: (Math.random() - 0.5) * 0.2
            };
        }
    });
}

function animateDividedMeshes() {
    scene.children.forEach(obj => {
        if (obj.name === 'dividedMesh' && obj.userData && obj.userData.rotationSpeed && obj.userData.movementSpeed) {
            // メッシュ固有の速度で回転
            obj.rotation.x += obj.userData.rotationSpeed.x;
            obj.rotation.y += obj.userData.rotationSpeed.y;
            obj.rotation.z += obj.userData.rotationSpeed.z;

            // メッシュ固有の速度で位置変動
            obj.position.x += obj.userData.movementSpeed.x;
            obj.position.y += obj.userData.movementSpeed.y;
            obj.position.z += obj.userData.movementSpeed.z;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    stats.update();
    animateDividedMeshes(); // 分割されたメッシュのアニメーションを追加
}

init();





