document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('webgl-canvas');
    const startButton = document.getElementById('startButton');
    const isMobile = navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i);

    const renderer = new THREE.WebGLRenderer({canvas: canvas});
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // 背景色を黒に設定

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 100); 
    

    addGridHelper(scene);
    const sphere = addSphere(scene); // 球体を追加し、参照を保持
    addImage(scene);
    setupControls(canvas, camera, isMobile);

    startButton.addEventListener('click', () => {
        animate();
        addCubeParticles(scene, camera, renderer);   
        addImageParticles(scene, "pic02.png", renderer, camera);
        addCubeParticles(scene, camera, renderer);           
        startButton.style.display = 'none';
    });

    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.y += 0.01; // 球体を回転させる
        renderer.render(scene, camera);
    }

    
});

function addImageParticles(scene, imagePath, renderer, camera) {
    const particlesCount = 100;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
        positions[i] = Math.random() * 800 - 400; // X座標
        positions[i + 1] = Math.random() * 800 - 400; // Y座標
        positions[i + 2] = Math.random() * 800 - 400; // Z座標
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 立方体のジオメトリを作成
    const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // 緑色

    // パーティクルとして立方体を追加
    for (let i = 0; i < particlesCount; i++) {
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.x = positions[i * 3];
        cube.position.y = positions[i * 3 + 1];
        cube.position.z = positions[i * 3 + 2];
        scene.add(cube);
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        scene.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
                child.rotation.x += 0.01;
                child.rotation.y += 0.01;
            }
        });
        renderer.render(scene, camera);
    }

    animateParticles();
}

function addCubeParticles(scene, camera, renderer) {
    const particleCount = 100; // パーティクルの数を100に設定
    const sphereSize = 5; // 球体のサイズ
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // 緑色でマテリアルを作成
    const spheres = []; // 球体を格納する配列
    const velocities = []; // 各球体の速度を格納する配列

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(sphereSize, 16, 16); // 球体のジオメトリを作成
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = Math.random() * 400 - 200;
        sphere.position.y = Math.random() * 400 - 200;
        sphere.position.z = Math.random() * 400 - 200;
        scene.add(sphere);
        spheres.push(sphere);

        // 各球体にランダムな速度を割り当て
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2, // X方向の速度
            (Math.random() - 0.5) * 2, // Y方向の速度
            (Math.random() - 0.5) * 2  // Z方向の速度
        );
        velocities.push(velocity);
    }

    // アニメーション関数を定義
    function animate() {
        requestAnimationFrame(animate);

        // 各球体の位置を更新
        spheres.forEach((sphere, index) => {
            sphere.position.add(velocities[index]);
        });

        renderer.render(scene, camera);
    }

    animate(); // アニメーションを開始
}


function addGridHelper(scene) {
    //const gridHelper = new THREE.GridHelper(100, 100);
    //scene.add(gridHelper);
}




function addSphere(scene) {
    const geometry = new THREE.SphereGeometry(5, 32, 32); // サイズを大きくする
    const material = new THREE.MeshBasicMaterial({color: 0x50C878, wireframe: true});
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    return sphere;
}

function addImage(scene) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('_MG_8971.jpg', function(texture) {
        const geometry = new THREE.PlaneGeometry(5, 3);
        const material = new THREE.MeshBasicMaterial({map: texture});
        const imageMesh = new THREE.Mesh(geometry, material);
        imageMesh.position.set(0, 0, -1); // 画像の位置調整
        scene.add(imageMesh);

        const outlineMaterial = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.BackSide});
        const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
        outlineMesh.scale.multiplyScalar(1.1); // 枠を少し大きくする
        scene.add(outlineMesh);
    });
}

function setupControls(canvas, camera, isMobile) {
    let lastX, lastY, isDragging = false, rotateMode = false;
    const maxRotation = Math.PI / 4; // 45度をラジアンに変換
    const minZoom = 5; // ズームの最小値
    const maxZoom = 15; // ズームの最大値を調整

    canvas.addEventListener('dblclick', () => {
        rotateMode = !rotateMode; // ダブルクリックで回転モードの切り替え
    });

    const startDragging = (event) => {
        isDragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
    };

    const drag = (event) => {
        if (!isDragging) return;
        const deltaX = event.clientX - lastX;
        const deltaY = event.clientY - lastY;

        if (rotateMode) {
            const rotationSpeed = 0.005;
            camera.rotation.y -= deltaX * rotationSpeed;
            camera.rotation.x -= deltaY * rotationSpeed;
        } else {
            camera.position.x -= deltaX * 0.01;
            camera.position.y += deltaY * 0.01;
        }

        lastX = event.clientX;
        lastY = event.clientY;
    };

    const endDragging = () => {
        isDragging = false;
    };

    const zoom = (deltaY) => {
        const zoomIntensity = 0.5; // ズームの強度を調整
        let targetZ = camera.position.z - deltaY * zoomIntensity; // deltaYの符号を調整
        targetZ = Math.max(minZoom, Math.min(maxZoom, targetZ)); // ズームの上限と下限を設定して制限する
        smoothZoom(camera.position.z, targetZ, camera);
    };

    if (isMobile) {
        // モバイルデバイス用のイベントリスナー
        canvas.addEventListener('touchstart', (event) => startDragging(event.touches[0]));
        canvas.addEventListener('touchmove', (event) => drag(event.touches[0]));
        canvas.addEventListener('touchend', endDragging);
    } else {
        // PC用のイベントリスナー
        canvas.addEventListener('mousedown', startDragging);
        canvas.addEventListener('mousemove', drag);
        canvas.addEventListener('mouseup', endDragging);
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault(); // スクロールのデフォルト動作を防止
            zoom(event.deltaY); // deltaYの値に応じてズーム方向と強度を調整
        });
    }
}

function smoothZoom(startZ, endZ, camera) {
    const duration = 500; // ズームの持続時間を2000ミリ秒（2秒）に延長
    const startTime = performance.now();

    function zoomStep(timestamp) {
        const elapsed = timestamp - startTime;
        const fraction = Math.min(elapsed / duration, 1);
        // イージング関数を改善してより滑らかに
        const easeInOutCubic = fraction < 0.5 ? 4 * fraction * fraction * fraction : 1 - Math.pow(-2 * fraction + 2, 3) / 2;
        camera.position.z = startZ + (endZ - startZ) * easeInOutCubic;

        if (fraction < 1) {
            requestAnimationFrame(zoomStep);
        } else {
            camera.position.z = endZ; // 最終的な位置を確定
        }
    }

    requestAnimationFrame(zoomStep);
}