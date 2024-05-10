import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;
let liquidSpheres = []; // すべての水滴を格納する配列
let liquidSphere;

function init() {

     // カメラの作成
     camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
     camera.position.set(0, 50, 60);
     camera.lookAt(0, 50, 0);
    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        // シーンの設定を行う関数を呼び出す
        setupScene();
        // 液体球の生成
        liquidSphere = createLiquidSphere(0x000000, 10, new THREE.Vector3(0, 5, 30), camera, '20190203-20190203-DSC03583.jpg');
        loadImagesAndCreateSpheres().then(() => {
            setupControls();
            startAnimation();
        }).catch(error => {
            console.error('Error during image loading:', error);
        });
    });
  



    window.addEventListener('resize', onWindowResize, false);

}

function startAnimation() {


    // グリッドの平面の作成
    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

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

 

    createCenteredImage('20190203-20190203-DSC03583.jpg');

    animate(); // アニメーションループを開始する
}

function createCenteredImage(imagePath) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, function(texture) {
        const geometry = new THREE.PlaneGeometry(40, 70); // 画像のアスペクト比に応じて調整
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const imageMesh = new THREE.Mesh(geometry, material);
        imageMesh.position.set(0, 0, 0); // シーの中央に配置
        scene.add(imageMesh);
    });
}


function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背景色
        fogColor: 0xaaccff,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 500,               // 霧の終了距離
        ambientLightColor: 0xFFFFFF // 環境光の色
    };

    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);
    //scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);

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

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        controls.panSpeed = 0.3;
        controls.touchDampingFactor = 0.2;
    } else {
        controls.panSpeed = 0.5;
        controls.touchDampingFactor = 0.1;
    }

    // ドラッグコントロールの追加
    const dragControls0 = new DragControls([liquidSphere], camera, renderer.domElement); // こ変更
    dragControls0.addEventListener('dragstart', function (event) {
        controls.enabled = false; // ドラッグ中はOrbitControls無効化
    });
    dragControls0.addEventListener('dragend', function (event) {
        controls.enabled = true; // ドラッグ終了後はOrbitControlsを再度有効化
    });

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createLiquidSphere(color, size, position, camera, texturePath) {
    const geometry = new THREE.SphereGeometry(size, 16, 16); // 分割数を減らして処理を軽くする
    const texture = new THREE.TextureLoader().load(texturePath); // テクスチャのロードを関数の外で行い、再利用可能にする
    const material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float time;
            uniform float amplitude;

            float rand(float n) {
                return fract(sin(n) * 43758.5453123);
            }

            float noise(vec3 point) {
                vec3 i = floor(point);
                vec3 f = fract(point);
                f = f * f * (3.0 - 2.0 * f);
                float n = dot(i, vec3(1.0, 57.0, 113.0));
                float a = mix(rand(n), rand(n + 1.0), f.x);
                float b = mix(rand(n + 57.0), rand(n + 58.0), f.x);
                float c = mix(a, b, f.y);
                float d = mix(rand(n + 113.0), rand(n + 114.0), f.x);
                float e = mix(rand(n + 170.0), rand(n + 171.0), f.x);
                float f1 = mix(d, e, f.y);
                return mix(c, f1, f.z);
            }

            void main() {
                vUv = uv;
                vec3 pos = position;
                float offset = noise(position * 0.5 + time * 0.5) * amplitude;
                pos += normal * offset;
                vNormal = normalize(normalMatrix * normal);
                vPosition = pos;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 baseColor;
            uniform vec3 viewPosition;
            uniform float time;
            uniform sampler2D envMap;

            void main() {
                vec3 viewDirection = normalize(viewPosition - vPosition);
                float fresnelEffect = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 3.0) * 0.75;
                vec3 refraction = refract(viewDirection, vNormal, 1.5);
                vec3 envColor = texture2D(envMap, vUv + refraction.xy * 0.2).rgb;
                float intensity = max(dot(vNormal, normalize(vec3(0.5, 1.0, 0.75))), 0.0);
                float specular = pow(intensity, 20.0) * 2.5;
                float alpha = 0.3 + 0.7 * (1.0 - intensity);
                vec3 color = mix(baseColor, envColor, specular + fresnelEffect);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        uniforms: {
            time: { value: 0.0 },
            amplitude: { value: 10.0 },
            baseColor: { value: new THREE.Color(color) },
            viewPosition: { value: camera.position },
            envMap: { value: texture }
        },
        transparent: true
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position.x, position.y, position.z);
    scene.add(sphere);

    const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
    );

    liquidSpheres.push({ mesh: sphere, velocity: velocity, initialPosition: position.clone() });

    return sphere;
}

function animate() {
    requestAnimationFrame(animate);

    liquidSpheres.forEach(sphereData => {
        const { mesh, velocity, initialPosition } = sphereData;
        if (mesh && velocity) {
            // 水滴の位置を直接更新
            mesh.position.add(velocity);

            // 移動範囲を制限
            ['x', 'y', 'z'].forEach(axis => {
                if (Math.abs(mesh.position[axis] - initialPosition[axis]) > 50) {
                    velocity[axis] = -velocity[axis];
                }
            });

            // シェーダーの時間ユニフォームを更新
            mesh.material.uniforms.time.value += 0.1;
        }
    });

    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

function loadImagesAndCreateSpheres() {
    const imageFolder = 'pic/';
    const imageFolder_low = 'pic_low/';
    const imageFiles = ['20200112-_MG_0269.jpg', '20200121-_MG_0360.jpg', '20200121-_MG_0398.jpg', '20200220-_MG_0511.jpg'
                        ,'20200227-_MG_0808-2.jpg', '20200227-_MG_0877.jpg', '20200228-_MG_0939-2.jpg', '20200229-_MG_1123.jpg',
                        '20200309-_MG_1414-3.jpg', '20200330-_MG_2001.jpg', '20200419-_MG_6608.jpg', '20200422-_MG_6692.jpg', '20200511-_MG_6824.jpg'];

    const promises = imageFiles.map(file => {
        const imagePath = imageFolder + file;
        const imagePath_low = imageFolder_low + file;
        return new Promise((resolve, reject) => {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(imagePath, texture => {
                const aspectRatio = texture.image.width / texture.image.height;
                const geometry = new THREE.PlaneGeometry(50 * aspectRatio, 50);
                const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
                const imageMesh = new THREE.Mesh(geometry, material);
                const randomPosition = new THREE.Vector3(
                    Math.random() * 500 -150 , // X座標
                    Math.random() * 500 -50,       // Y座標
                    Math.random() * 500 -150  // Z座標
                );
                imageMesh.position.set(randomPosition.x, randomPosition.y, randomPosition.z);
                scene.add(imageMesh);

                // 5つの液体球を生成
                for (let i = 0; i <3; i++) {
                    const randomColor = Math.random() * 0xffffff;
                    const randomSize = Math.random() * 15 + 5; // 5から25の範囲でサイズをランダムに設定
                    createLiquidSphere(randomColor, randomSize, randomPosition.clone(), camera, imagePath_low);
                }

                resolve();
            }, undefined, () => reject(new Error('Failed to load image: ' + imagePath)));
        });
    });

    return Promise.all(promises);
}

init();


