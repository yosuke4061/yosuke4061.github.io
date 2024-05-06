import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
    // シーンの設定を行う関数を呼び出す
    setupScene();  

    // グリッドの平面の作成
    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    // XYZ軸の矢印の作成
    const axesHelper = new THREE.AxesHelper(10);  // サイズを大きく設定
    scene.add(axesHelper);


    // コントロールの設定
    setupControls();

    // Statsの設定
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';  // 左側の位置指定を解除    
    document.body.appendChild(stats.dom);

    // ウィンドウリサイズのハンドリング
    window.addEventListener('resize', onWindowResize, false);

    //createComplexWaterDrop();
    createRealisticWaterDrop2();

}


function createRealisticWaterDrop() {
    // 水滴の形状を作成
    const dropGeometry = new THREE.SphereGeometry(1, 32, 32);
    // 水滴の下部を細くするために頂点データを変更
    const vertices = dropGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        // Y軸方向のスケールを調整
        vertices[i + 1] *= 1.5 - Math.abs(vertices[i] * 0.5) - Math.abs(vertices[i + 2] * 0.5);
    }
    dropGeometry.computeVertexNormals(); // 法線を再計算

    const waterMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { type: 'f', value: 0.0 },
            camPos: { type: 'v3', value: camera.position },
            refractionRatio: { type: 'f', value: 0.98 },
            waterColor: { type: 'c', value: new THREE.Color(0x3FA9F5) },
            lightColor: { type: 'c', value: new THREE.Color(0xffffff) },
            ambientLightIntensity: { type: 'f', value: 0.3 },
            depthColor: { type: 'c', value: new THREE.Color(0x000088) }
        },
        vertexShader: `
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normal;
                vPosition = position;
                vec3 pos = position;
                float offset = sin(time + length(pos) * 2.0) * 0.2;
                pos += normal * offset;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 waterColor;
            uniform vec3 lightColor;
            uniform vec3 camPos;
            uniform float refractionRatio;
            uniform float ambientLightIntensity;
            uniform vec3 depthColor;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vec3 viewDirection = normalize(camPos - vPosition);
                float fresnelEffect = dot(viewDirection, vNormal);
                fresnelEffect = 1.0 - fresnelEffect;
                fresnelEffect = pow(fresnelEffect, 3.0) * 0.5;

                vec3 refractedColor = refract(normalize(vPosition - camPos), vNormal, refractionRatio);
                vec3 color = mix(vec3(waterColor), vec3(lightColor) + refractedColor, fresnelEffect);
                vec3 ambientLight = ambientLightIntensity * vec3(1.0, 1.0, 1.0);
                color += ambientLight;

                float depth = smoothstep(0.0, 10.0, length(vPosition));
                color = mix(color, depthColor, depth);

                gl_FragColor = vec4(color, 0.8);
            }
        `,
        transparent: true
    });

    const waterDrop = new THREE.Mesh(dropGeometry, waterMaterial);
    scene.add(waterDrop);

    function animateWaterDrop() {
        waterMaterial.uniforms.time.value += 0.05;
        waterMaterial.uniforms.camPos.value = camera.position;
        requestAnimationFrame(animateWaterDrop);
        renderer.render(scene, camera);
    }

    animateWaterDrop();
}



//フレネル効果
function createRealisticWaterDrop2() {
    const dropGeometry = new THREE.TorusKnotGeometry(3, 1.2, 200, 32);
    const waterMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { type: 'f', value: 0.0 },
            camPos: { type: 'v3', value: camera.position },
            refractionRatio: { type: 'f', value: 0.98 },
            waterColor: { type: 'c', value: new THREE.Color(0x3FA9F5) },
            lightColor: { type: 'c', value: new THREE.Color(0xffffff) },
            ambientLightIntensity: { type: 'f', value: 0.3 },
            depthColor: { type: 'c', value: new THREE.Color(0x000088) }
        },
        vertexShader: `
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normal;
                vPosition = position;
                vec3 pos = position;
                float offset = sin(time + length(pos) * 2.0) * 0.2;
                pos += normal * offset;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 waterColor;
            uniform vec3 lightColor;
            uniform vec3 camPos;
            uniform float refractionRatio;
            uniform float ambientLightIntensity;
            uniform vec3 depthColor;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vec3 viewDirection = normalize(camPos - vPosition);
                float fresnelEffect = dot(viewDirection, vNormal);
                fresnelEffect = 1.0 - fresnelEffect;
                fresnelEffect = pow(fresnelEffect, 3.0) * 0.5;

                vec3 refractedColor = refract(normalize(vPosition - camPos), vNormal, refractionRatio);
                vec3 color = mix(vec3(waterColor), vec3(lightColor) + refractedColor, fresnelEffect);
                vec3 ambientLight = ambientLightIntensity * vec3(1.0, 1.0, 1.0);
                color += ambientLight;

                float depth = smoothstep(0.0, 10.0, length(vPosition));
                color = mix(color, depthColor, depth);

                gl_FragColor = vec4(color, 0.8);
            }
        `,
        transparent: true
    });

    const waterDrop = new THREE.Mesh(dropGeometry, waterMaterial);
    scene.add(waterDrop);

    function animateWaterDrop() {
        waterMaterial.uniforms.time.value += 0.05;
        waterMaterial.uniforms.camPos.value = camera.position;
        requestAnimationFrame(animateWaterDrop);
        renderer.render(scene, camera);
    }

    animateWaterDrop();
}



//TorusKnotGeometry
function createComplexWaterDrop() {
    const dropGeometry = new THREE.TorusKnotGeometry(3, 1.2, 100, 16); // 複雑な水滴形状
    const waterMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { type: 'f', value: 0.0 },
            waterColor: { type: 'c', value: new THREE.Color(0x3FA9F5) },
            lightColor: { type: 'c', value: new THREE.Color(0xffffff) }
        },
        vertexShader: `
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normal;
                vPosition = position;
                vec3 pos = position;
                float offset = sin(time + length(pos) * 2.0) * 0.2;
                pos += normal * offset;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 waterColor;
            uniform vec3 lightColor;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                float intensity = dot(normalize(vNormal), normalize(vec3(0, 1, 1)));
                vec3 color = mix(vec3(waterColor), vec3(lightColor), intensity);
                gl_FragColor = vec4(color, 0.8);
            }
        `,
        transparent: true
    });

    const waterDrop = new THREE.Mesh(dropGeometry, waterMaterial);
    scene.add(waterDrop);

    function animateWaterDrop() {
        waterMaterial.uniforms.time.value += 0.05;
        requestAnimationFrame(animateWaterDrop);
        renderer.render(scene, camera);
    }

    animateWaterDrop();
}




function setupScene() {
    // シーンの作成に関連する設定
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色
        fogColor: 0xaaccff,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 1000,               // 霧の終了距離
        ambientLightColor: 0x404040 // 環境光の色
    };

    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);  // 背景色の設定
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);  // 霧の設定

    // 環境光の追加
    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor);
    scene.add(ambientLight);

    // 平行光源の追加
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // シャドウの有効化
    renderer.shadowMap.enabled = true;
    directionalLight.castShadow = true;

    // シャドウの設定
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ソフトシャドウ
    directionalLight.shadow.mapSize.width = 1024; // シャドウマップの幅
    directionalLight.shadow.mapSize.height = 1024; // シャドウマップの高さ
    directionalLight.shadow.camera.near = 0.5; // シャドウカメラのニアクリップ
    directionalLight.shadow.camera.far = 500; // シャドウカメラのファークリップ
}
function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;

    // 上下の回転制限を180度に設定
    controls.maxPolarAngle = Math.PI; // 180度
    controls.minPolarAngle = 0; // 0度 (下向きの回転を防ぐため)

    // 左右の回転制限を90度に設定
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
animate();