import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
    100,
    window.innerWidth / window.innerHeight,
    0.1,
    100
)
camera.position.set(0, 10, 15)

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

document.getElementById('start-button').addEventListener('click', () => {
    // Hide the menu and show the game container
    document.getElementById('menu-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    // Call the function to start the game
    startGame();
});

// Function to start the game
function startGame() {
  
}

const loader2 = new GLTFLoader();

loader2.load(
    'assets/models/Scene/scene.gltf',
    function (gltf) {
        // This function will be called when the model is loaded successfully
        const model = gltf.scene;
        scene.add(model); // Add the loaded model to your scene

        // Optionally, adjust the position and rotation of the loaded model if needed
        model.position.set(0, -1.70, 0);   
        model.rotation.y = Math.PI / 2;
    },
    undefined,
    function (error) {
        console.error('Error loading GLTF model', error);
    }
);

const controls = new OrbitControls(camera, renderer.domElement)

let score = 0; // Variável para armazenar a pontuação
let characterModel;

class Box extends THREE.Mesh {
    constructor({
        width,
        height,
        depth,
        color = '#00ff00',
        velocity = { x: 0, y: 0, z: 0 },
        position = { x: 0, y: 0, z: 0 },
        zAcceleration = false
    }) {
        super(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({ color })
        )

        this.width = width
        this.height = height
        this.depth = depth

        this.position.set(position.x, position.y, position.z)

        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2

        this.velocity = velocity
        this.gravity = -0.02

        this.zAcceleration = zAcceleration
    }

    updateSides() {
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    }

    update(ground) {
        this.updateSides()

        if (this.zAcceleration) this.velocity.z += 0.0003

        this.position.x += this.velocity.x
        this.position.z += this.velocity.z

        this.applyGravity(ground)
    }

    applyGravity(ground) {
        this.velocity.y += this.gravity

        // this is where it hits the ground
        if (BoxCollision({
            box1: this,
            box2: ground
        })) {
            const friction = 0.5
            this.velocity.y *= friction
            this.velocity.y = -this.velocity.y
        }
        else this.position.y += this.velocity.y
    }
}

function BoxCollision({ box1, box2 }) {
    const xCollision = box1.right >= box2.left && box1.left <= box2.right
    const yCollision =
        box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom
    const zCollision = box1.front >= box2.back && box1.back <= box2.front

    return xCollision && yCollision && zCollision
}

const cube = new Box({
    width: 1,
    height: 1,
    depth: 1,
    velocity: { x: 0, y: -0.1, z: 0 }
})

cube.castShadow = true
scene.add(cube)

const ground = new Box({
    width: 11,
    height: 0.5,
    depth: 1000,
    color: '#0369a1',
    position: { x: 0, y: -2, z: 0 }
})

ground.receiveShadow = true
scene.add(ground)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.y = 3
light.position.z = 1
light.castShadow = true

scene.add(light)
scene.add(new THREE.AmbientLight(0xffffff, 0.5))

camera.position.z = 5

const Keys = {
    a: { pressed: false },
    d: { pressed: false },
    s: { pressed: false },
    w: { pressed: false }
}

window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyA':
            Keys.a.pressed = true
            break
        case 'KeyD':
            Keys.d.pressed = true
            break
        case 'KeyS':
            Keys.s.pressed = true
            break
        case 'KeyW':
            Keys.w.pressed = true
            break
        case 'Space':
            cube.velocity.y = 0.35
            characterModel.velocity.y = 0.35
            break
    }
})

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyA':
            Keys.a.pressed = false
            break
        case 'KeyD':
            Keys.d.pressed = false
            break
        case 'KeyS':
            Keys.s.pressed = false
            break
        case 'KeyW':
            Keys.w.pressed = false
            break
    }
})

const enemies = []

let frames = 0
let spawnRate = 200

// Função para atualizar a posição da câmera com base na posição do cubo verde
function updateCameraPosition() {
    camera.position.x = cube.position.x; // Acompanha a posição do cubo verde
    camera.position.z = cube.position.z + 10; // Ajusta a posição da câmera para uma visualização adequada
    camera.lookAt(cube.position); // Mantém a câmera olhando para o cubo verde
}

function animate() {
    const animationId = requestAnimationFrame(animate)
    renderer.render(scene, camera)

    // movement code
    cube.velocity.x = 0
    cube.velocity.z = 0

    if (Keys.a.pressed) cube.velocity.x = -0.05 
    else if (Keys.d.pressed) cube.velocity.x = 0.05
    if (Keys.s.pressed) cube.velocity.z = 0.05
    else if (Keys.w.pressed) cube.velocity.z = -0.05

    
    cube.update(ground)
    enemies.forEach(enemy => {
        enemy.update(ground)
        if (BoxCollision({
            box1: cube,
            box2: enemy
        })) {
            cancelAnimationFrame(animationId)
            alert('Game Over! Your score: ' + score); // Exibe a pontuação ao final do jogo
        }
    })

    if (frames % spawnRate === 0) {
        if (spawnRate > 20) {
            spawnRate -= 20
        }

        const enemy = new Box({
            width: 1,
            height: 1,
            depth: 1,
            position: {
                x: (Math.random() - 0.5) * 10,
                y: 0,
                z: -40
            },
            velocity: { x: 0, y: 0, z: 0.01 },
            color: 'red',
            zAcceleration: true
        })
        enemy.castShadow = true
        scene.add(enemy)
        enemies.push(enemy)
    }
    updateCameraPosition();
    frames++
}
animate()
