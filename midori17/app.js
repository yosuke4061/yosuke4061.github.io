let scene, camera, renderer, controls, startButton;
let animateRain; // 雨のアニメーション関数を格納するための変数

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 100); // カメラの位置を調整
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // カメラが中心を向くように

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // 球体を追加
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    scene.add(sphere);

    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(50, 50, 50);
    scene.add(light);
 
    startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        setTimeout(startAnimation, 3000);
    });

    window.addEventListener('resize', onWindowResize, false);
    setupControls();
    animateRain = addRainEffect(); // 雨のアニメーション関数を保存
    
}


function addRainEffect() {
    const rainGeometry = new THREE.BufferGeometry();
    const rainCount = 1000; // 雨粒の数を減らす
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
        positions[i * 3] = Math.random() * 400 - 200;
        positions[i * 3 + 1] = Math.random() * 500 - 250;
        positions[i * 3 + 2] = Math.random() * 400 - 200;
    }
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.3, // サイズを小さくする
        transparent: true,
        opacity: 0.6,
        depthWrite: false
    });

    const rain = new THREE.Points(rainGeometry, rainMaterial);
    scene.add(rain);

    function animateRain() {
        const positions = rain.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= 0.6;
            if (positions[i + 1] < 0) {
                explodeRaindrop(positions[i], positions[i + 1], positions[i + 2]);
                positions[i + 1] = 200;
            }
        }
        rain.geometry.attributes.position.needsUpdate = true;
    }

    return animateRain;
}
function explodeRaindrop(x, y, z) {
    const particleCount = 5; // パーティクルの数を減らす
    const radius = 0.1;
    const particles = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 6, 6), material);
        sphere.position.set(x, y, z);
        const direction = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2, Math.random() * 2 - 1);
        direction.normalize().multiplyScalar(0.5);
        sphere.userData.velocity = direction;
        particles.add(sphere);
    }
    scene.add(particles);

    let count = 0;
    function animateParticles() {
        if (count < 60) { // アニメーションの持続時間を制限
            requestAnimationFrame(animateParticles);
            particles.children.forEach(particle => {
                particle.position.add(particle.userData.velocity);
                particle.userData.velocity.y -= 0.01; // 重力のシミュレーション
            });
            count++;
        } else {
            scene.remove(particles); // アニメーション終了後にパーティクルを削除
        }
    }

    animateParticles();
}


function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.minAzimuthAngle = -Math.PI / 4;
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

function startAnimation() {
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    if (animateRain) animateRain(); // 雨のアニメーションを更新
}

init();