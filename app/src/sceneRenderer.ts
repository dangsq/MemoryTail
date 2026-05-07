import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/* ═══════════════════════════════════════════════════
   Scene Renderer — 基础场景管理器
   
   提供 Three.js 场景、相机、灯光、渲染循环等基础功能
   ═══════════════════════════════════════════════════ */

export class SceneRenderer {
  public readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly container: HTMLElement
  private readonly stage = new THREE.Group()
  private animationFrame = 0
  private readonly resizeObserver: ResizeObserver

  constructor(container: HTMLElement) {
    this.container = container

    this.scene = new THREE.Scene()
    // Black background for theatrical stage
    this.scene.background = new THREE.Color('#000000')
    this.scene.fog = new THREE.Fog('#000000', 3, 8)

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.01, 50)
    this.camera.position.set(0.5, 0.5, 2.0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.localClippingEnabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enabled = true
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.target.set(-0.2, 0.2, 0)
    this.controls.minDistance = 0.5
    this.controls.maxDistance = 6
    
    this.controls.enableRotate = true
    this.controls.enableZoom = true
    this.controls.enablePan = true
    
    this.controls.rotateSpeed = 1.0
    this.controls.zoomSpeed = 1.0
    this.controls.panSpeed = 1.0

    this.scene.add(this.stage)

    // Theatrical stage floor with spotlight effect
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2, 64),
      new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 0.9,
        metalness: 0.0,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.5
    floor.receiveShadow = true
    this.stage.add(floor)

    // Theatrical lighting setup
    // Main spotlight (warm golden)
    const spotlight = new THREE.SpotLight('#FFD700', 8.0)
    spotlight.position.set(0, 3, 1)
    spotlight.angle = Math.PI / 6
    spotlight.penumbra = 0.5
    spotlight.decay = 2
    spotlight.distance = 10
    spotlight.castShadow = true
    spotlight.shadow.mapSize.width = 1024
    spotlight.shadow.mapSize.height = 1024
    spotlight.shadow.camera.near = 0.5
    spotlight.shadow.camera.far = 10
    this.stage.add(spotlight)

    // Rim light (cool blue, from behind)
    const rimLight = new THREE.SpotLight('#4169E1', 3.0)
    rimLight.position.set(-2, 2, -2)
    rimLight.angle = Math.PI / 4
    rimLight.penumbra = 0.8
    rimLight.decay = 2
    rimLight.distance = 8
    this.stage.add(rimLight)

    // Fill light (soft ambient)
    const fillLight = new THREE.AmbientLight('#ffffff', 0.3)
    this.stage.add(fillLight)

    // Accent light (warm, from side)
    const accentLight = new THREE.PointLight('#FFA500', 2.0)
    accentLight.position.set(2, 1, 1)
    accentLight.decay = 2
    accentLight.distance = 5
    this.stage.add(accentLight)

    this.resizeObserver = new ResizeObserver(() => this.onResize())
    this.resizeObserver.observe(this.container)
    this.onResize()

    this.animate()
  }

  private onResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private animate = () => {
    this.animationFrame = requestAnimationFrame(this.animate)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  enableControls() {
    this.controls.enabled = true
  }

  disableControls() {
    this.controls.enabled = false
  }

  dispose() {
    cancelAnimationFrame(this.animationFrame)
    this.resizeObserver.disconnect()
    this.renderer.dispose()
    this.controls.dispose()
  }
}
