import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();

// Configuração da câmera
const camera = new THREE.PerspectiveCamera(
    100, // Campo de visão
    window.innerWidth / window.innerHeight, // Proporção de tela
    0.1, // Distância mínima de renderização
    1000 // Distância máxima de renderização
);

// Posição inicial da câmera
camera.position.set(0, 5, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
renderer.shadowMap.enabled = true; // Habilitar o mapa de sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipo de sombra (opcional)
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

document.getElementById('start-button').addEventListener('click', () => {
    // Hide the menu and show the game container
    document.getElementById('menu-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    // Call the function to start the game
    startGame();
});

const loader2 = new GLTFLoader();

let roads = []; // Array to keep track of roads

loader2.load(
    'assets/models/Scene/scene.gltf',
    function (gltf) {
        const model = gltf.scene;

        model.scale.set(1.5, 2, 2);
        model.position.set(0, -1.50, 0);
        model.rotation.y = Math.PI;

        scene.add(model);
        roads.push(model);
    },
    undefined,
    function (error) {
        console.error('Erro ao carregar o modelo GLTF', error);
    }
);

const loader3 = new GLTFLoader();

let characterModel;
let characterBoundingBox;

loader3.load(
    'assets/models/Character/scene.gltf',
    function (gltf) {
        const model = gltf.scene;
        
        model.scale.set(1.4, 1.4, 1.4);
        model.position.set(cubeStartPosition.x, cubeStartPosition.y, cubeStartPosition.z);
        
        // Definir a rotação do modelo como 180 graus (Math.PI)
        model.rotation.y = Math.PI;

        // Habilitar projeção de sombra
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(model);
        characterModel = model;

        // Criar caixa de colisão para o personagem
        characterBoundingBox = new THREE.Box3().setFromObject(characterModel);
    },
    undefined,
    function (error) {
        console.error('Erro ao carregar o modelo GLTF', error);
    }
);

const loader4 = new GLTFLoader();
let enemyCarModel;

loader4.load(
    'assets/models/Enemy/scene.gltf',
    function (gltf) {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        
        // Ajuste da posição inicial para que o carro inimigo comece um pouco mais acima
        model.rotation.y = -Math.PI / 2;

        // Habilitar projeção de sombra
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        enemyCarModel = model;
    },
    undefined,
    function (error) {
        console.error('Erro ao carregar o modelo GLTF do carro inimigo', error);
    }
);

const controls = new OrbitControls(camera, renderer.domElement);

class Box extends THREE.Mesh {
    constructor({
        width,
        height,
        depth,
        color = '#00ff00',
        velocity = { x: 0, y: 0, z: 1 },
        position = { x: 0, y: 0, z: 0 },
        zAcceleration = false
    }) {
        super(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({ color })
        );

        this.width = width;
        this.height = height;
        this.depth = depth;

        this.position.set(position.x, position.y, position.z);

        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;

        this.velocity = velocity;
        this.gravity = -0.02;

        this.zAcceleration = zAcceleration;

        // Configurar sombras
        this.castShadow = true;
        this.receiveShadow = true;
    }

    updateSides() {
        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;
    }

    update(ground) {
        this.updateSides();

        if (this.zAcceleration) this.velocity.z += 0.0003;

        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;

        this.applyGravity(ground);
    }

    applyGravity(ground) {
        this.velocity.y += this.gravity;

        if (BoxCollision({ box1: this, box2: ground })) {
            const friction = 0.5;
            this.velocity.y *= friction;
            this.velocity.y = -this.velocity.y;
        } else this.position.y += this.velocity.y;
    }
}

function BoxCollision({ box1, box2 }) {
    const xCollision = box1.right >= box2.left && box1.left <= box2.right;
    const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
    const zCollision = box1.front >= box2.back && box1.back <= box2.front;

    return xCollision && yCollision && zCollision;
}

const cubeStartPosition = { x: 0, y: -9.2, z: 0 };

const cube = new Box({
    width: 1,
    height: 0.5,
    depth: 1,
    position: cubeStartPosition,
    velocity: { x: 0, y: -0.1, z: 0 }
});

cube.castShadow = true;
scene.add(cube);

const ground = new Box({
    width: 31.5,
    height: 0.01,
    depth: 10000,
    color: '#0369a1',
    position: { x: cubeStartPosition.x, y: cubeStartPosition.y - 0.75, z: cubeStartPosition.z - 4950 }
});

ground.receiveShadow = true;
scene.add(ground);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.y = 3;
light.position.z = 1;
light.castShadow = true; // Habilitar sombras para a luz

light.shadow.mapSize.width = 1024; // Tamanho do mapa de sombras (opcional)
light.shadow.mapSize.height = 1024; // Tamanho do mapa de sombras (opcional)
light.shadow.camera.near = 0.5; // Distância mínima da sombra (opcional)
light.shadow.camera.far = 50; // Distância máxima da sombra (opcional)

scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

camera.position.z = 5;

const Keys = {
    a: { pressed: false },
    d: { pressed: false },
    s: { pressed: false },
    w: { pressed: false },
    p: { pressed: false }
};

window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyA':
            Keys.a.pressed = true;
            break;
        case 'KeyD':
            Keys.d.pressed = true;
            break;
        case 'KeyS':
            Keys.s.pressed = true;
            break;
        case 'KeyW':
            Keys.w.pressed = true;
            break;
        case 'KeyC': // Change camera angle
            cameraAngle = (cameraAngle + 1) % 3;
            updateCameraPosition();
            break;
        case 'KeyP': // Pause key
            if (!Keys.p.pressed) {
                Keys.p.pressed = true;
                pauseGame();
            }
            break;
        
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyA':
            Keys.a.pressed = false;
            break;
        case 'KeyD':
            Keys.d.pressed = false;
            break;
        case 'KeyS':
            Keys.s.pressed = false;
            break;
        case 'KeyW':
            Keys.w.pressed = false;
            break;
        case 'KeyP':
            Keys.p.pressed = false;
            break;
    }
});

const enemies = [];
const enemyCarInstances = [];
const enemyBoundingBoxes = [];


let frames = 0;
let spawnRate = 100;

let cubeZPosition = cube.position.z;
const distanceThreshold = 50;

let cameraAngle = 0;

function updateCameraPosition() {
    switch (cameraAngle) {
        case 0:
            camera.position.x = cube.position.x;
            camera.position.z = cube.position.z + 10;
            camera.position.y = cube.position.y + 10;
            break;
        case 1:
            camera.position.x = cube.position.x - 10 ;
            camera.position.z = cube.position.z + 10;
            camera.position.y = cube.position.y + 10;
            break;
        case 2:
            camera.position.x = cube.position.x + 10  ;
            camera.position.z = cube.position.z + 10;
            camera.position.y = cube.position.y +10;
            break;
        default:
            break;
    }
    camera.lookAt(cube.position);
}

function gameOver(score) {
    document.getElementById('game-over-scene').classList.remove('game-over-hidden'); // Show the scene
    document.getElementById('game-over-score').textContent = score; // Update final score
    // Stop animation or other game logic
    document.getElementById('restart-button').addEventListener('click', () => {
        // Reset the game
        location.reload();
    });
}

let isGamePaused = false;

function pauseGame() {
    isGamePaused = !isGamePaused;
}

function startGame() {
    let score = 0;
    cube.velocity.z = -0.8;
    function updateScore() {
        score++;
        document.getElementById('score-value').innerText = score;
    }

    function animate() {
        const animationId = requestAnimationFrame(animate);
        renderer.render(scene, camera);

        if (!isGamePaused) {
            updateCameraPosition();

            cube.velocity.x = 0;

            if (Keys.a.pressed) cube.velocity.x = -0.5;
            else if (Keys.d.pressed) cube.velocity.x = 0.5;
            //if (Keys.w.pressed) cube.velocity.z = -0.5;

            cube.update(ground);

            if (characterModel) {
                characterModel.position.copy(cube.position);
                characterModel.rotation.copy(cube.rotation);
                characterBoundingBox.setFromObject(characterModel);
            }

            const roadWidth = 31.5;
            if (cube.position.x < -roadWidth / 2 || cube.position.x > roadWidth / 2) {
                cancelAnimationFrame(animationId);
                gameOver(score);
                return;
            }

            enemies.forEach((enemy, index) => {
                enemy.update(ground);

                if (enemyCarInstances[index]) {
                    enemyCarInstances[index].position.copy(enemy.position);
                    enemyCarInstances[index].rotation.copy(enemy.rotation);
                    enemyBoundingBoxes[index].setFromObject(enemyCarInstances[index]);

                    if (characterBoundingBox.intersectsBox(enemyBoundingBoxes[index])) {
                        cancelAnimationFrame(animationId);
                        gameOver(score + 1);
                        return;
                    }
                }
            });

            if (cubeZPosition - cube.position.z >= distanceThreshold) {
                loadNewRoad();
                cubeZPosition = cube.position.z;
            }

            if (frames % spawnRate === 0) {
                if (spawnRate > 20) {
                    spawnRate -= 20;
                }

                const enemy = new Box({
                    width: 0,
                    height: 0,
                    depth: 0,
                    position: {
                        x: (Math.random() - 0.5) * 31.5,
                        y: 0,
                        z: cube.position.z - 500
                    },
                    velocity: { x: 0, y: 0, z: 1 },
                    zAcceleration: true
                });
                enemy.castShadow = true;
                scene.add(enemy);
                enemies.push(enemy);

                const enemyCarClone = enemyCarModel.clone();
                enemyCarClone.position.copy(enemy.position);
                enemyCarClone.rotation.copy(enemy.rotation);
                scene.add(enemyCarClone);
                enemyCarInstances.push(enemyCarClone);

                const enemyBoundingBox = new THREE.Box3().setFromObject(enemyCarClone);
                enemyBoundingBoxes.push(enemyBoundingBox);
            }

            updateScore();

            frames++;
        }
    }

    animate();
}

function loadNewRoad() {
    const loader = new GLTFLoader();

    loader.load(
        'assets/models/Scene/scene.gltf',
        function (gltf) {
            const model = gltf.scene;

            model.scale.set(1.5, 2, 2);

            const lastRoad = roads[roads.length - 1];
            const newPositionZ = lastRoad.position.z - 450;
            model.position.set(0, -1.50, newPositionZ);
            model.rotation.y = Math.PI;

            // Habilitar projeção de sombra para o novo trecho da estrada
            model.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(model);
            roads.push(model);
        },
        undefined,
        function (error) {
            console.error('Erro ao carregar o modelo GLTF', error);
        }
    );
}

animate();
