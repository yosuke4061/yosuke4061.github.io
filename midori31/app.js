import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

let scene, camera, renderer, controls, stats, water;

function startAnimation() {
    console.log("アニメーションが開始されました。");
}

function init() {
    let startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
    });

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    setupScene();
    createWaterSurface();
    createAquarium();
    addAquariumDecorations();
    setupAquariumLighting();
    addInteraction();
    setupControls();

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.left = 'auto';
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,
        fogColor: 0xaaccff,
        fogNear: 1,
        fogFar: 1000,
        ambientLightColor: 0xFFFFFF
    };

    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_SETTINGS.backgroundColor);
    scene.fog = new THREE.Fog(SCENE_SETTINGS.fogColor, SCENE_SETTINGS.fogNear, SCENE_SETTINGS.fogFar);

    const ambientLight = new THREE.AmbientLight(SCENE_SETTINGS.ambientLightColor);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    renderer.shadowMap.enabled = true;
    directionalLight.castShadow = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
}

function createWaterSurface() {
    const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
    const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPos;
            void main() {
                vUv = uv;
                vPos = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying vec3 vPos;
            uniform float time;
            uniform vec3 lightPosition;
            uniform vec3 customCameraPosition;
            uniform float waterDepth;
            uniform vec2 center;

            void main() {
                float depth = length(vPos - customCameraPosition);
                float scatter = exp(-depth / waterDepth);
                vec3 incomingLight = vec3(1.0, 1.0, 0.9);
                vec3 scatteredLight = incomingLight * scatter;

                float distanceFromCenter = distance(vUv, center);
                float wave = 0.05 * sin(40.0 * distanceFromCenter - time * 10.0);
                vec3 waterColor = vec3(0.0, 0.5, 0.7);
                vec3 refractedColor = waterColor * (1.0 - wave);
                vec3 reflectedColor = vec3(0.2, 0.2, 0.2) * wave;

                gl_FragColor = vec4(refractedColor + reflectedColor + scatteredLight, 0.9);
            }
        `,
        uniforms: {
            time: { value: 0.0 },
            lightPosition: { value: new THREE.Vector3(0, 50, 0) },
            customCameraPosition: { value: camera.position },
            waterDepth: { value: 50.0 },
            center: { value: new THREE.Vector2(0.5, 0.5) }
        },
        transparent: true
    });
    water = new THREE.Mesh(geometry, shaderMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 50.1;
    scene.add(water);
}

function createAquarium() {
    const textureLoader = new THREE.TextureLoader();
    const tileTexture = textureLoader.load('textures/tile.jpg');
    const boxGeometry = new THREE.BoxGeometry(100, 50, 100);
    const materials = [
        new THREE.MeshPhongMaterial({ map: tileTexture, side: THREE.BackSide }),
        new THREE.MeshPhongMaterial({ map: tileTexture, side: THREE.BackSide }),
        new THREE.MeshPhongMaterial({ map: tileTexture, side: THREE.BackSide, transparent: true, opacity: 0.0 }),
        new THREE.MeshPhongMaterial({ map: tileTexture, side: THREE.BackSide }),
        new THREE.MeshPhongMaterial({ map: tileTexture, side: THREE.BackSide }),
        new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.1, side: THREE.FrontSide }),
    ];

    const box = new THREE.Mesh(boxGeometry, materials);
    box.position.y = 25;
    scene.add(box);
}

function addAquariumDecorations() {
    const plantGeometry = new THREE.ConeGeometry(2, 5, 32);
    const plantMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const plants = [];
    for (let i = 0; i < 5; i++) {
        const plant = new THREE.Mesh(plantGeometry, plantMaterial);
        plant.position.set(Math.random() * 80 - 40, 25, Math.random() * 80 - 40);
        scene.add(plant);
        plants.push(plant);
    }

    const rockGeometry = new THREE.DodecahedronGeometry(3, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    const rocks = [];
    for (let i = 0; i < 10; i++) {
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(Math.random() * 80 - 40, 25, Math.random() * 80 - 40);
        scene.add(rock);
        rocks.push(rock);
    }
}

function setupAquariumLighting() {
    const pointLight = new THREE.PointLight(0xadd8e6, 1.5, 200); // 明るい水色
    pointLight.position.set(0, 50, 0);
    scene.add(pointLight);

    const spotLight = new THREE.SpotLight(0xffffff, 0.8);
    spotLight.position.set(-30, 60, 30);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.1;
    scene.add(spotLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
}

function addInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onClick(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([water]);
        if (intersects.length > 0) {
            const uv = intersects[0].uv;
            water.material.uniforms.center.value = uv;
            water.material.uniforms.time.value = 0;
        }
    }

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onClick, false);
}

function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;

    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = 0;

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
    if (water) {
        water.material.uniforms.time.value += 0.03;
    }
}

init();
