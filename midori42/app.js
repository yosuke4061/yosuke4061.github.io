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

    createNonOverlappingShapes(); // この関数をinit関数内または適切な場所で呼び出す

    animate(); // アニメーションループを開始する
}

function createNonOverlappingShapes() {
    // 既存の形状の作成
    createMathematicalPatternSphere();
    createMathematicalPatternTorus();
    createMathematicalPatternIcosahedron();
    createJuliaFractal();
    createGlowingSphere();
    createComplexFractalSphere();
    createShinyRippleSphere();
    createComplexPolyhedron();
    createComplexDodecahedron();
    createAdvancedPatternSphere(); // 新しい形状の追加

    // 新しい複雑なパターンのトーラスの追加
    createComplexPatternTorus();

    // モービウスのリングの追加
    createMobiusRing();

    // 新しい複雑な数学的パターンの球体の追加
    createComplexMathematicalSphere();

    // 新しい複雑な数学的チューブの追加
    createComplexMathematicalTube();

    // 各オブジェクトの位置調整
    const sphere = scene.getObjectByName('patternedSphere');
    const torus = scene.getObjectByName('patternedTorus');
    const icosahedron = scene.getObjectByName('patternedIcosahedron');
    const juliaFractal = scene.getObjectByName('juliaFractal');
    const glowingSphere = scene.getObjectByName('glowingSphere');
    const fractalSphere = scene.getObjectByName('complexFractalSphere');
    const shinyRippleSphere = scene.getObjectByName('shinyRippleSphere');
    const complexPolyhedron = scene.getObjectByName('complexPolyhedron');
    const complexDodecahedron = scene.getObjectByName('complexDodecahedron');
    const advancedSphere = scene.getObjectByName('advancedPatternSphere');
    const complexTorus = scene.getObjectByName('complexPatternTorus');
    const mobiusRing = scene.getObjectByName('mobiusRing');
    const complexMathSphere = scene.getObjectByName('complexMathematicalSphere');
    const complexTube = scene.getObjectByName('complexMathematicalTube'); // 新しいオブジェクトの取得

    // 位置の調整
    sphere.position.set(-30, 0, 0);
    torus.position.set(30, 0, 0);
    icosahedron.position.set(0, 30, 0);
    juliaFractal.position.set(0, -30, 0);
    glowingSphere.position.set(20, 20, 0);
    fractalSphere.position.set(-20, -20, 0);
    shinyRippleSphere.position.set(0, 0, 20);
    complexPolyhedron.position.set(20, -20, 20);
    complexDodecahedron.position.set(-20, 20, 20);
    advancedSphere.position.set(0, 0, -30);
    complexTorus.position.set(0, -20, -20);
    mobiusRing.position.set(10, 10, -10);
    complexMathSphere.position.set(-10, -10, 10);
    complexTube.position.set(10, 10, 10); // 新しい位置に配置

    // ラベルの追加
    createLabel('patternedSphere', sphere.position);
    createLabel('patternedTorus', torus.position);
    createLabel('patternedIcosahedron', icosahedron.position);
    createLabel('juliaFractal', juliaFractal.position);
    createLabel('glowingSphere', glowingSphere.position);
    createLabel('complexFractalSphere', fractalSphere.position);
    createLabel('shinyRippleSphere', shinyRippleSphere.position);
    createLabel('complexPolyhedron', complexPolyhedron.position);
    createLabel('complexDodecahedron', complexDodecahedron.position);
    createLabel('advancedPatternSphere', advancedSphere.position);
    createLabel('complexPatternTorus', complexTorus.position);
    createLabel('mobiusRing', mobiusRing.position);
    createLabel('complexMathematicalSphere', complexMathSphere.position);
    createLabel('complexMathematicalTube', complexTube.position); // 新しいラベルの追加
}





function createLabel(text, position) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '24px Arial';
    context.fillStyle = 'rgba(255, 255, 0, 1)';
    context.fillText(text, 20, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 5, 1);
    // ラベルの位置をオブジェクトの上に十分に配置
    sprite.position.copy(position.clone().add(new THREE.Vector3(0, 20, 0))); // ラベルの位置をさらに上に調整
    scene.add(sprite);
}

function createComplexMathematicalSphere() {
    // 球体ジオメトリの作成
    const geometry = new THREE.SphereGeometry(5, 256, 256); // 高密度のメッシュ

    // 頂点の位置を変更して複雑なパターンを作成
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const p = vertex.clone().normalize();
        // Perlinノイズに似た関数を使用して形状を変形
        const noise = perlinNoise(p.x * 10, p.y * 10, p.z * 10);
        vertex.multiplyScalar(1 + 0.3 * noise); // ノイズの影響を強調
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線を再計算して、照明の効果を正しくする

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.7,
        roughness: 0.3,
        flatShading: true
    });

    // 球体メッシュの作成
    const complexSphere = new THREE.Mesh(geometry, material);
    complexSphere.name = 'complexMathematicalSphere';
    scene.add(complexSphere);
}

// Perlinノイズに似た関数
function perlinNoise(x, y, z) {
    // 簡易的なPerlinノイズの実装
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(t, a, b) { return a + t * (b - a); }
    function grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    const p = [];
    for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);
    const a = p[p[p[xi] + yi] + zi];
    const b = p[p[p[xi + 1] + yi] + zi];
    const c = p[p[p[xi] + yi + 1] + zi];
    const d = p[p[p[xi + 1] + yi + 1] + zi];
    const e = p[p[p[xi] + yi] + zi + 1];
    const f = p[p[p[xi + 1] + yi] + zi + 1];
    const g = p[p[p[xi] + yi + 1] + zi + 1];
    const h = p[p[p[xi + 1] + yi + 1] + zi + 1];
    const x1 = lerp(u, grad(a, xf, yf, zf), grad(b, xf - 1, yf, zf));
    const x2 = lerp(u, grad(c, xf, yf - 1, zf), grad(d, xf - 1, yf - 1, zf));
    const y1 = lerp(v, x1, x2);
    const x3 = lerp(u, grad(e, xf, yf, zf - 1), grad(f, xf - 1, yf, zf - 1));
    const x4 = lerp(u, grad(g, xf, yf - 1, zf - 1), grad(h, xf - 1, yf - 1, zf - 1));
    const y2 = lerp(v, x3, x4);
    return lerp(w, y1, y2);
}


function createComplexMathematicalTube() {
    // カスタムパスの定義
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-10, 0, 10),
        new THREE.Vector3(-5, 5, 5),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(5, -5, 5),
        new THREE.Vector3(10, 0, 10)
    ]);

    // チューブジオメトリの作成
    const geometry = new THREE.TubeGeometry(curve, 64, 2, 8, false);

    // 頂点の位置を変更して複雑なパターンを作成
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const p = vertex.clone().normalize();
        const noise = perlinNoise(p.x * 10, p.y * 10, p.z * 10);
        vertex.multiplyScalar(1 + 0.2 * noise); // ノイズの影響を調整
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線を再計算して、照明の効果を正しくする

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.6,
        roughness: 0.4,
        flatShading: true
    });

    // チューブメッシュの作成
    const tube = new THREE.Mesh(geometry, material);
    tube.name = 'complexMathematicalTube';
    scene.add(tube);
}




function createComplexPatternTorus() {
    // トーラスジオメトリの作成
    const geometry = new THREE.TorusKnotGeometry(5, 1.5, 256, 64, 2, 3); // 大径5、小径1.5、高密度メッシュ、p=2, q=3

    // 頂点の位置を変更してより複雑なパターンを作成
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const p = vertex.clone().normalize();
        const noise = Math.sin(20 * p.x) * Math.cos(20 * p.y) * Math.sin(20 * p.z);
        vertex.multiplyScalar(1 + 0.1 * noise); // ノイズの影響を調整
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線を再計算して、照明の効果を正しくする

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.6,
        roughness: 0.4,
        flatShading: true
    });

    // トーラスメッシュの作成
    const complexTorus = new THREE.Mesh(geometry, material);
    complexTorus.name = 'complexPatternTorus';
    scene.add(complexTorus);
}

function createAdvancedPatternSphere() {
    // 球体ジオメトリの作成
    const geometry = new THREE.SphereGeometry(5, 256, 256); // 高密度のメッシュで詳細な形状

    // 頂点の位置を変更して複雑なパターンを作成
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const p = vertex.clone().normalize();
        // ノイズ関数を変更してより複雑なパターンを生成
        const noise = Math.sin(20 * p.x) * Math.cos(20 * p.y) * Math.sin(20 * p.z);
        vertex.multiplyScalar(1 + 0.3 * noise); // ノイズの影響を強調
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線を再計算して、照明の効果を正しくする

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.7,
        roughness: 0.3,
        flatShading: true
    });

    // 球体メッシュの作成
    const advancedSphere = new THREE.Mesh(geometry, material);
    advancedSphere.name = 'advancedPatternSphere';
    scene.add(advancedSphere);
}
function createComplexDodecahedron() {
    // ドデカヘドロンジオメトリの作成
    const geometry = new THREE.DodecahedronGeometry(5, 1); // 半径5、細分化レベル1

    // 頂点の位置を変更してパターンを作成
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const p = vertex.clone().normalize();
        const noise = Math.sin(10 * p.x) * Math.cos(10 * p.y) * Math.sin(10 * p.z);
        vertex.multiplyScalar(1 + 0.1 * noise); // ノイズの影響を調整
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線を再計算して、照明の効果を正しくする

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.5,
        roughness: 0.4,
        flatShading: true
    });

    // ドデカヘドロンメッシュの作成
    const dodecahedron = new THREE.Mesh(geometry, material);
    dodecahedron.name = 'complexDodecahedron';
    scene.add(dodecahedron);
}
function createComplexPolyhedron() {
    // より高密度で複雑なカスタムの頂点と面を定義
    const vertices = new Float32Array([
        // 基本的な立方体の頂点に加えて、さらに多くの頂点を追加
        1, 1, 1,   -1, 1, 1,   -1, -1, 1,   1, -1, 1,
        1, 1, -1,  -1, 1, -1,  -1, -1, -1,  1, -1, -1,
        0, 2, 0,   0, -2, 0,   2, 0, 0,     -2, 0, 0,
        1.5, 1.5, 1.5, -1.5, 1.5, 1.5, -1.5, -1.5, 1.5, 1.5, -1.5, 1.5,
        1.5, 1.5, -1.5, -1.5, 1.5, -1.5, -1.5, -1.5, -1.5, 1.5, -1.5, -1.5,
        0, 3, 0,   0, -3, 0,   3, 0, 0,     -3, 0, 0
    ]);

    const indices = new Uint16Array([
        // 通常の立方体の面に加えて、追加の頂点を使用した面を定義
        0, 1, 2, 0, 2, 3, 4, 7, 6, 4, 6, 5, 0, 4, 5, 0, 5, 1,
        1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
        8, 0, 1, 8, 1, 5, 9, 2, 3, 9, 6, 2, 10, 0, 3, 10, 4, 0,
        11, 1, 2, 11, 5, 1, 12, 13, 14, 12, 14, 15, 16, 19, 18, 16, 18, 17,
        12, 16, 17, 12, 17, 13, 13, 17, 18, 13, 18, 14, 14, 18, 19, 14, 19, 15,
        15, 19, 16, 15, 16, 12, 20, 12, 13, 20, 13, 17, 21, 14, 15, 21, 18, 14
    ]);

    // ジオメトリの作成
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals(); // 法線を計算

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.5,
        roughness: 0.5
    });

    // メッシュの作成
    const polyhedron = new THREE.Mesh(geometry, material);
    polyhedron.name =    polyhedron.name = 'complexPolyhedron';
    scene.add(polyhedron);
}



function createShinyRippleSphere() {
    const geometry = new THREE.SphereGeometry(5, 128, 128); // 高密度のメッシュで球体を作成
    const material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                float ripple = sin(dot(vPosition, vPosition) * 0.1 + time * 2.0);
                vec3 baseColor = vec3(0.5, 0.7, 1.0);
                vec3 rippleColor = vec3(1.0, 0.5, 0.2) * ripple;
                vec3 color = baseColor + rippleColor;
                float intensity = pow(0.5 - dot(vNormal, vec3(0, 1, 0)), 4.0);
                gl_FragColor = vec4(color * intensity, 1.0);
            }
        `,
        uniforms: {
            time: { value: 0.0 }
        },
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'shinyRippleSphere';
    scene.add(sphere);
}




function createComplexFractalSphere() {
    const geometry = new THREE.SphereGeometry(5, 256, 256); // 高密度のメッシュで球体を作成
    const material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            void main() {
                vec2 p = vUv * 2.0 - 1.0;
                float a = time * 10.0; // 時間の影響をさらに減らす
                float d, e, f, g;
                e = 100.0 * (p.x * 0.5 + 0.5); // スケールをさらに大きくする
                f = 100.0 * (p.y * 0.5 + 0.5); // スケールをさらに大きくする
                g = 1.0 / f;
                float i = 50.0 + sin(e * g + a / 150.0) * 5.0; // ノイズの影響をさらに減らす
                d = 50.0 + cos(f * g / 2.0) * 4.5 + cos(e * g) * 1.75; // ノイズの影響をさらに減らす
                d = sqrt(d);
                if (d < 5.5) {
                    e = (e + d) / 2.0;
                    f = (f + d) / 2.0;
                }
                d = length(vec2(p.x - e, p.y - f));
                e = (e + d) / 2.0;
                f = (f + d) / 2.0;
                g = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                g = smoothstep(0.2, 0.7, g);
                gl_FragColor = vec4(vec3(d, e, f) * g, 1.0);
            }
        `,
        uniforms: {
            time: { value: 0.0 }
        },
        side: THREE.DoubleSide,
        transparent: true
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'complexFractalSphere';
    scene.add(sphere);
}




function createGlowingSphere() {
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = 0.1 + 0.9 * pow(0.5 - dot(vNormal, vec3(0, 1, 0)), 2.0);
                gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0) * intensity;
            }
        `,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'glowingSphere';
    scene.add(sphere);
}

function createMathematicalPatternSphere() {
    // 球体ジオメトリの作成
    const geometry = new THREE.SphereGeometry(5, 128, 128); // 高密度のメッシュ

    // 頂点の位置を変更してパターンを作成
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const p = vertex.clone().normalize();
        const noise = Math.sin(10 * p.x) * Math.sin(10 * p.y) * Math.sin(10 * p.z);
        vertex.multiplyScalar(1 + 0.2 * noise);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線を再計算して、照明の効果を正しくする

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.7,
        roughness: 0.3,
        flatShading: true
    });

    // 球体メッシュの作成
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'patternedSphere';
    scene.add(sphere);
}

function createMathematicalPatternTorus() {
    // トーラスジオメトリの作成
    const geometry = new THREE.TorusGeometry(5, 2, 128, 128); // 大径5、小径2、高密度メッシュ

    // 頂点の位置を変更してパターンを作成
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const p = vertex.clone().normalize();
        const noise = Math.sin(10 * p.x) * Math.cos(10 * p.y);
        vertex.multiplyScalar(1 + 0.1 * noise); // ノイズの影響を調整
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線を再計算して、照明の効果を正しする

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.5,
        roughness: 0.4,
        flatShading: true
    });

    // トーラスメッシュの作成
    const torus = new THREE.Mesh(geometry, material);
    torus.name = 'patternedTorus';
    scene.add(torus);
}

function createMathematicalPatternIcosahedron() {
    // アイコサヘドロンジオメトリの作成
    const geometry = new THREE.IcosahedronGeometry(5, 2); // 半径5、細分化レベル2

    // 頂点の位置を変更してパターンを作成
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const p = vertex.clone().normalize();
        const noise = Math.sin(10 * p.x) * Math.sin(10 * p.y) * Math.sin(10 * p.z);
        vertex.multiplyScalar(1 + 0.1 * noise); // ノイズの影響を調整
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線を再計算して、照明の効果を正しくする

    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.5,
        roughness: 0.4,
        flatShading: true
    });

    // アイコサヘドロンメッシュの作成
    const icosahedron = new THREE.Mesh(geometry, material);
    icosahedron.name = 'patternedIcosahedron';
    scene.add(icosahedron);
}
function createMobiusRing() {
    const geometry = new THREE.TorusGeometry(10, 3, 100, 100);
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        // モービウス変形の適用
        const angle = Math.PI * vertex.x / 10;
        vertex.x += 2.5 * Math.sin(3 * angle);
        vertex.y += 2.5 * Math.cos(3 * angle);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals(); // 法線の再計算

    const material = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.5,
        roughness: 0.3,
        flatShading: true
    });

    const mobiusRing = new THREE.Mesh(geometry, material);
    mobiusRing.name = 'mobiusRing';
    scene.add(mobiusRing);
}
function createJuliaFractal() {
    const geometry = new THREE.IcosahedronGeometry(5, 4); // 細分化レベルを高くして詳細な形状を生成
    const material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.5 - dot(vNormal, vec3(0, 0, 1)), 20.0);
                gl_FragColor = vec4(0.4, 0.7, 0.9, 1.0) * intensity;
            }
        `,
        wireframe: true, // ワイヤーフレームを無効にして、面で表示
        side: THREE.DoubleSide // 両面をレンダリング
    });

    const juliaFractal = new THREE.Mesh(geometry, material);
    juliaFractal.name = 'juliaFractal';
    juliaFractal.position.set(0, 0, -20); // 他のオブジェクトと重ならないように位置調整
    scene.add(juliaFractal);
}

function setupScene() {
    const SCENE_SETTINGS = {
        backgroundColor: 0x000000,  // 背景色を黒に設定
        fogColor: 0x000000,         // 霧の色
        fogNear: 1,                 // 霧の開始距離
        fogFar: 300,                // 霧の終了距離
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

    // スポットライトの加
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

    // スマートフォンでの二タッチによるパン作を有効にする
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


