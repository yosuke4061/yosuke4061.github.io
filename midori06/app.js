let scene, camera, renderer, controls;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 100, 200);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(50, 50, 50);
    scene.add(light);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.maxPolarAngle = Math.PI / 4;
    controls.minPolarAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.minAzimuthAngle = -Math.PI / 4;

    document.getElementById('startButton').addEventListener('click', () => {
        animate();
        createFire(scene); // 炎の表現を開始
        document.getElementById('startButton').style.display = 'none'; // ボタンを非表示にする
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

class FireParticle {
    constructor(scene) {
        this.scene = scene;
        // 形状をランダムに選択
        let geometry;
        if (Math.random() > 0.5) {
            // 球形
            geometry = new THREE.SphereGeometry(2, 32, 32);
        } else {
            // とがった形状
            geometry = new THREE.ConeGeometry(1, 3, 32);
        }
        const material = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.5 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.reset();
        this.scene.add(this.mesh);
    }

    reset() {
        this.mesh.position.set(
            (Math.random() * 2 - 1) * 50,
            (Math.random() * 2 - 1) * 50,
            (Math.random() * 2 - 1) * 50
        );
        this.velocity = new THREE.Vector3(0, Math.random() * 2, 0);
        this.lifespan = Math.random() * 60 + 60; // 60 to 120 frames
        this.mesh.material.opacity = 0.5;
        this.mesh.visible = true;

        // スケールと回転をランダムに設定
        this.mesh.scale.set(Math.random() * 0.5 + 0.5, Math.random() * 2 + 1, Math.random() * 0.5 + 0.5);
        this.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }

    update() {
        if (this.lifespan > 0) {
            this.mesh.position.add(this.velocity);
            this.lifespan--;
            this.mesh.material.opacity = this.lifespan / 120;
        } else {
            this.reset();
        }
    }

    isAlive() {
        return this.mesh.visible;
    }
}

function createFire(scene) {
    const particles = [];
    for (let i = 0; i < 550; i++) {
        const particle = new FireParticle(scene);
        particles.push(particle);
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        particles.forEach(particle => {
            particle.update();
        });
        renderer.render(scene, camera);
    }

    animateParticles();
}

init();