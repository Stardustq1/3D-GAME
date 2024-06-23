import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { mix } from 'three/examples/jsm/nodes/Nodes.js'
import { tri } from 'three/examples/jsm/nodes/math/TriNoise3D.js'

// Инициализация сцены и камеры
const scene = new THREE.Scene()
scene.background = new THREE.Color(0, 0, 255)
const camera = new THREE.PerspectiveCamera(75, 1)
camera.position.set(0, 2, 5)
scene.add(camera)

// Настройка рендерера
const canvas = document.querySelector('.canvas')
const renderer = new THREE.WebGLRenderer({ alpha: true, canvas })

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setClearColor(0x66ffff, 0)
const quality = 2
renderer.setSize(window.innerWidth * quality, window.innerHeight * quality, false)

// Добавляем освещение

const hemilight = new THREE.HemisphereLight(0x66ffff, 0xffffff, 0.1)
hemilight.position.set(0, 10, 0)
scene.add(hemilight)

let dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(0, 300, 120)
dirLight.castShadow = true
dirLight.shadow.mapSize.set(1024, 1024)
dirLight.shadow.bias = 0.0001
dirLight.shadow.camera.top = 10
dirLight.shadow.camera.bottom = -10
dirLight.shadow.camera.left = -10
dirLight.shadow.camera.right = 10
dirLight.shadow.camera.near = 0.5
dirLight.shadow.camera.far = 2000
scene.add(dirLight)
// Создаем плоскость (пол)
const floor = new THREE.Mesh(
	new THREE.PlaneGeometry(20, 20),
	new THREE.MeshStandardMaterial({
		color: 'green',
		metalness: 0,
		roughness: 0.5,
		emissive: 0x111111,
		specular: 0xffffff,
		shadowSide: true,
		side: THREE.DoubleSide,
	})
)
floor.receiveShadow = true

floor.rotation.x = -Math.PI * 0.5
scene.add(floor)

// Загрузка модели
let mixer = null
let moveAction = null
let spaceAction = null
let myobj = null

const loader = new GLTFLoader()
loader.load('static/models/sculpt/sculpting.gltf', gltf => {
	gltf.scene.castShadow = true
	gltf.scene.traverse(function (node) {
		if (node.isMesh) {
			node.castShadow = true
		}
	})
	mixer = new THREE.AnimationMixer(gltf.scene)
	moveAction = mixer.clipAction(gltf.animations[1])
	spaceAction = mixer.clipAction(gltf.animations[0])
	myobj = gltf.scene
	myobj.scale.set(0.2, 0.2, 0.2)
	scene.add(myobj)
	console.log('Model loaded:', gltf)
})
for (let i = 0; i <= 110; i++) {
	loader.load('static/models/beach/Palm.gltf', gltf => {
		gltf.scene.castShadow = true
		gltf.scene.traverse(function (node) {
			if (node.isMesh) {
				node.castShadow = true
			}
		})
		let x = Math.random() * (10 - -10) + -10
		let z = Math.random() * (10 - -10) + -10
		gltf.scene.position.set(x, 0, z)
		gltf.scene.scale.set(0.01, 0.01, 0.01)
		scene.add(gltf.scene)
	})
}

// Управление и анимация
let keyPressed = {} // Объект для отслеживания нажатых клавиш
const moveDistance = 0.01 // Дистанция движения
const isAnimating = () => Object.values(keyPressed).includes(true) // Проверяет, удерживается ли какая-то клавиша

const moveObject = () => {
	if (!myobj) return

	if (keyPressed['d']) {
		myobj.position.x += moveDistance
		myobj.rotation.y = -Math.PI / 2
	}
	if (keyPressed['a']) {
		myobj.position.x -= moveDistance
		myobj.rotation.y = Math.PI / 2
	}
	if (keyPressed['w']) {
		myobj.position.z -= moveDistance
		myobj.rotation.y = 0
	}
	if (keyPressed['s']) {
		myobj.position.z += moveDistance
		myobj.rotation.y = Math.PI
	}

	if (isAnimating()) {
		if (!moveAction.isRunning()) {
			moveAction.play()
		}
	} else if (moveAction.isRunning()) {
		moveAction.stop()
	}
	if (isAnimating()) {
		if (keyPressed[' '] == true) {
			if (!spaceAction.isRunning()) {
				spaceAction.play()
			}
		} else if (keyPressed[' '] == false) {
			if (spaceAction.isRunning()) {
				spaceAction.stop()
			}
		}
	}
}

// Обработчик событий для клавиатуры
document.addEventListener('keydown', e => {
	// Отмечаем, что клавиша нажата
	keyPressed[e.key] = true
})

document.addEventListener('keyup', e => {
	keyPressed[e.key] = false
})

// Цикл анимации
const clock = new THREE.Clock()

const animate = () => {
	requestAnimationFrame(animate)
	const delta = clock.getDelta()
	camera.lookAt(myobj.position)
	moveObject() // Перемещаем объект в зависимости от нажатых клавиш

	if (mixer && isAnimating()) {
		mixer.update(delta)
	}

	renderer.render(scene, camera)
}

animate() // Запускаем анимацию
