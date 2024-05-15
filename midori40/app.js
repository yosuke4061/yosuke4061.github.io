import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'dat.gui';

let scene, camera, renderer, controls;
let spotLight, gui, ambientLight, directionalLight;
let spotLightHelper, directionalLightHelper; // ヘルパーをグローバル変数として定義

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startButton').style.display = 'none';
    let loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';

    init();
    // アニメーションの開始を少し遅らせる
    setTimeout(() => {
        animate();
        loadingIndicator.style.display = 'none';
    }, 2000);
});

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);

    setupLights();
    setupGUI();
    displayImage();
    window.addEventListener('resize', onWindowResize, false);
}

function setupLights() {
    ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(100, 300, 100);
    spotLight.castShadow = true;
    scene.add(spotLight);

    spotLightHelper = new THREE.SpotLightHelper(spotLight, 0xffff00); // ヘルパーの初期化
    scene.add(spotLightHelper);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 300, 500);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5, 0x00ff00); // ヘルパーの初期化
    scene.add(directionalLightHelper);

    // ライトの方向を示す線を追加
    const dirLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const dirLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(directionalLight.position.x, directionalLight.position.y, directionalLight.position.z),
        new THREE.Vector3(directionalLight.position.x + directionalLight.target.position.x * 10,
                           directionalLight.position.y + directionalLight.target.position.y * 10,
                           directionalLight.position.z + directionalLight.target.position.z * 10)
    ]);
    const dirLine = new THREE.Line(dirLineGeometry, dirLineMaterial);
    scene.add(dirLine);
}

function setupGUI() {
    gui = new GUI();

    // スポットライトの設定
    const spotLightFolder = gui.addFolder('SpotLight');
    spotLightFolder.add(spotLight, 'intensity', 0, 2, 0.01).name('Intensity');
    spotLightFolder.add({temp: 6500}, 'temp', 2000, 20000).name('Color Temperature').onChange(value => {
        spotLight.color = colorTemperatureToRGB(value);
    });
    spotLightFolder.add(spotLight.position, 'x', -300, 300).name('Position X');
    spotLightFolder.add(spotLight.position, 'y', -300, 300).name('Position Y');
    spotLightFolder.add(spotLight.position, 'z', -300, 300).name('Position Z');
    spotLightFolder.open();

    // 環境光の設定
    const ambientLightFolder = gui.addFolder('AmbientLight');
    ambientLightFolder.add(ambientLight, 'intensity', 0, 1, 0.01).name('Intensity');
    ambientLightFolder.add({temp: 6500}, 'temp', 2000, 20000).name('Color Temperature').onChange(value => {
        ambientLight.color = colorTemperatureToRGB(value);
    });
    ambientLightFolder.open();

    // 方向光の設定
    const directionalLightFolder = gui.addFolder('DirectionalLight');
    directionalLightFolder.add(directionalLight, 'intensity', 0, 2, 0.01).name('Intensity');
    directionalLightFolder.add({temp: 6500}, 'temp', 2000, 20000).name('Color Temperature').onChange(value => {
        directionalLight.color = colorTemperatureToRGB(value);
    });
    directionalLightFolder.add(directionalLight.position, 'x', -500, 500).name('Position X');
    directionalLightFolder.add(directionalLight.position, 'y', -500, 500).name('Position Y');
    directionalLightFolder.add(directionalLight.position, 'z', -500, 500).name('Position Z');
    directionalLightFolder.open();
}

function colorTemperatureToRGB(kelvin){
    var temp = kelvin / 100;
    var red, green, blue;

    if( temp <= 66 ){ 
        red = 255; 
        green = temp;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;

        if( temp <= 19){
            blue = 0;
        } else {
            blue = temp-10;
            blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
        }
    } else {
        red = temp - 60;
        red = 329.698727446 * Math.pow(red, -0.1332047592);
        green = temp - 60;
        green = 288.1221695283 * Math.pow(green, -0.0755148492 );
        blue = 255;
    }

    return new THREE.Color(red/255, green/255, blue/255);
}

function displayImage() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('20240406-_DSC2100.jpg', (tex) => {
        const aspectRatio = tex.image.width / tex.image.height;
        const geometry = new THREE.PlaneGeometry(5 * aspectRatio, 5);
        const material = new THREE.MeshPhongMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 1, 0);
        scene.add(mesh);
    });
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

    // ライトヘルパーの更新
    spotLightHelper.update();
    directionalLightHelper.update();
}


