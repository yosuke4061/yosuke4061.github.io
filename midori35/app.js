import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

import Stats from 'three/addons/libs/stats.module.js';
let scene, camera, renderer, controls, stats;
let liquidSpheres = []; // すべての水滴を格納する配列


function init() {

     // カメラの作成
     camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.2, 800);
     camera.position.set(100, -20, 150);
     camera.lookAt(0, 100, -50);
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

        loadImagesAndCreateSpheres().then(() => {
            setupControls();
            // アニメーションの開始を少し遅らせる
            setTimeout(() => {
                startAnimation();
                loadingIndicator.style.display = 'none';
            }, 2000);
        }).catch(error => {
            console.error('画像のロード中にエラーが発生しました:', error);
            // エラーが発生した場合もインジケーターを非表示にする
            loadingIndicator.style.display = 'none';
        });
    });
  



    window.addEventListener('resize', onWindowResize, false);

}

function startAnimation() {


    // グリッドの平面の作成
    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);

    // XYZ軸の矢印の作成
    //const axesHelper = new THREE.AxesHelper(10);  // サイズを大きく設定
    //scene.add(axesHelper);

    // Statsの設定
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';  // 左側の位置指定を解除    
    document.body.appendChild(stats.dom);

    addTexturedWavyGround();
    addSkyAndGround();
    animate(); // アニメーションループを開始する
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0xffffff,  // 背景色
        fogColor: 0xf18686,         // 霧の色
        fogNear: 50,                 // 霧の開始距離
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

function createLiquidSphere(color, size, position, camera, texturePath) {
    const geometry = new THREE.SphereGeometry(size, 32, 32); // 分割数を減らして処理を軽くする
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
                if (Math.abs(mesh.position[axis] - initialPosition[axis]) > 150 ){
                    velocity[axis] = -velocity[axis];
                }
            });

            // シェーダーの時間ユニフォームを更新
            mesh.material.uniforms.time.value += 0.05;
        }
    });

    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

function loadImagesAndCreateSpheres() {
    const imageFiles = ['20200220-_MG_0511.jpg','20200227-_MG_0877.jpg','_MG_1754.jpg'];

    const promises = imageFiles.map(file => {
        const imagePath = file;
        
        return new Promise((resolve, reject) => {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(imagePath, texture => {
                const aspectRatio = texture.image.width / texture.image.height;
                const geometry = new THREE.PlaneGeometry(50 * aspectRatio, 50);
                const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
                const imageMesh = new THREE.Mesh(geometry, material);
                const randomPosition = new THREE.Vector3(
                    Math.random() * 150 -150 , // X座標
                    Math.random() * 150 +50,       // Y座標
                    Math.random() * 150 -150  // Z座標
                );
                imageMesh.position.set(randomPosition.x, randomPosition.y, randomPosition.z);
                scene.add(imageMesh);

                // 5つの液体球を生成
                for (let i = 0; i < 6; i++) {
                    const randomColor = Math.random() * 0xffffff;
                    const randomSize = Math.random() * 15 + 3; // 5から25の範囲でサイズをランダムに設定
                    createLiquidSphere(randomColor, randomSize, randomPosition.clone(), camera, imagePath);
                }

                resolve();
            }, undefined, () => reject(new Error('Failed to load image: ' + imagePath)));
        });
    });

    return Promise.all(promises);
}

function addSkyAndGround() {
    // 空の色
    const skyColor = new THREE.Color(0xf3d2d2); // 明るい青
    // 地面の色
    const groundColor = new THREE.Color(0x000000); // 明るい黄色

    // シーンの背景を空の色に設定
    scene.background = skyColor;

    // 地面を作成
    const groundMaterial = new THREE.MeshLambertMaterial({ color: groundColor });
    const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -100; // 地面の位置を下げる
    ground.rotation.x = -Math.PI / 2; // 地面を水平にする
    ground.position.z = -150;
    scene.add(ground);

    // フォグを追加して、遠くの景色が徐々に消えるようにする
    scene.fog = new THREE.Fog(skyColor, 1, 1000);
}

function addTexturedWavyGround() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('water_3.jpg', function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // テクスチャの繰り返し設定

        const groundGeometry = new THREE.PlaneGeometry(2500, 2500, 256, 256);
        const groundMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterTexture: { value: texture }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float height = sin(pos.x * 0.025 + time) * cos(pos.y * 0.025 + time) * 10.0; // 波の高さと頻度を調整
                    pos.z += height;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D waterTexture;
                varying vec2 vUv;
                void main() {
                    vec4 textureColor = texture2D(waterTexture, vUv);
                    gl_FragColor = textureColor;
                }
            `,
            transparent: true,
            opacity: 0.8,
            wireframe: false
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = 0;
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        function animateGround() {
            requestAnimationFrame(animateGround);
            groundMaterial.uniforms.time.value += 0.01; // アニメーションの速度を調整
            renderer.render(scene, camera);
        }

        animateGround();
    }, undefined, function(error) {
        console.error('テクスチャの読み込みに失敗しました:', error);
    });
}

init();


