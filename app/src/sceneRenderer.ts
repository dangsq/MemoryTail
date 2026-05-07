import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { addOutlineToGroup } from './outlineUtils'

/* ═══════════════════════════════════════════════════
   Scene Renderer — 毛绒玩具风格场景
   
   柔和、温暖、像毛绒玩具的质感
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
  private time = 0

  constructor(container: HTMLElement) {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#FFF0E0')
    this.scene.fog = new THREE.Fog('#FFF0E0', 3, 8)

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.01, 50)
    this.camera.position.set(0.5, 0.5, 2.0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.localClippingEnabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
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

    // 地板
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3, 64),
      new THREE.MeshToonMaterial({
        color: '#F5E0C8',
        gradientMap: this.createSoftGradient(),
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.5
    floor.receiveShadow = true
    this.stage.add(floor)

    const mainLight = new THREE.DirectionalLight('#FFF0D0', 1.5)
    mainLight.position.set(3, 5, 2)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 15
    mainLight.shadow.camera.left = -5
    mainLight.shadow.camera.right = 5
    mainLight.shadow.camera.top = 5
    mainLight.shadow.camera.bottom = -5
    mainLight.shadow.bias = -0.0001
    mainLight.shadow.radius = 4
    this.stage.add(mainLight)

    const ambientLight = new THREE.AmbientLight('#FFF0E0', 0.8)
    this.stage.add(ambientLight)

    const fillLight = new THREE.DirectionalLight('#FFE0C0', 0.4)
    fillLight.position.set(-3, 3, -2)
    this.stage.add(fillLight)

    const warmLight = new THREE.PointLight('#FFCCA0', 0.5, 6)
    warmLight.position.set(2, 1.5, 1)
    this.stage.add(warmLight)

    const hemiLight = new THREE.HemisphereLight('#FFE8D0', '#F0D8C0', 0.5)
    this.stage.add(hemiLight)

    // 添加可爱的食物装饰
    this.addFoodDecorations()

    this.resizeObserver = new ResizeObserver(() => this.onResize())
    this.resizeObserver.observe(this.container)
    this.onResize()

    this.animate()
  }

  /**
   * 添加可爱的食物装饰
   */
  private addFoodDecorations(): void {
    // 🍰 蛋糕
    const cake = this.createCake()
    cake.position.set(-1.5, -0.35, 1.2)
    cake.scale.setScalar(0.75)
    addOutlineToGroup(cake)
    this.stage.add(cake)

    // 🥧 派
    const pie = this.createPie()
    pie.position.set(1.8, -0.4, 0.5)
    pie.scale.setScalar(0.66)
    addOutlineToGroup(pie)
    this.stage.add(pie)

    // 🍎 苹果
    const apple = this.createApple()
    apple.position.set(-1.2, -0.42, -1.5)
    apple.scale.setScalar(0.54)
    addOutlineToGroup(apple)
    this.stage.add(apple)

    // 🍒 樱桃
    const cherry1 = this.createCherry()
    cherry1.position.set(1.5, -0.43, -1.2)
    cherry1.scale.setScalar(0.45)
    addOutlineToGroup(cherry1)
    this.stage.add(cherry1)

    const cherry2 = this.createCherry()
    cherry2.position.set(1.7, -0.43, -1.0)
    cherry2.scale.setScalar(0.45)
    addOutlineToGroup(cherry2)
    this.stage.add(cherry2)

    // 🍩 甜甜圈
    const donut = this.createDonut()
    donut.position.set(-1.8, -0.38, -0.5)
    donut.scale.setScalar(0.66)
    addOutlineToGroup(donut)
    this.stage.add(donut)

    // 🧁 纸杯蛋糕
    const cupcake = this.createCupcake()
    cupcake.position.set(0.8, -0.4, 1.8)
    cupcake.scale.setScalar(0.54)
    addOutlineToGroup(cupcake)
    this.stage.add(cupcake)
  }

  /**
   * 创建蛋糕
   */
  private createCake(): THREE.Group {
    const cake = new THREE.Group()

    const layer1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.5, 32),
      new THREE.MeshToonMaterial({
        color: '#FFD0D0',
        gradientMap: this.createSoftGradient(),
      })
    )
    layer1.position.y = 0.25
    cake.add(layer1)

    const layer2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.4, 32),
      new THREE.MeshToonMaterial({
        color: '#FFF0E0',
        gradientMap: this.createSoftGradient(),
      })
    )
    layer2.position.y = 0.7
    cake.add(layer2)

    const cherry = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshToonMaterial({
        color: '#FF8080',
        gradientMap: this.createSoftGradient(),
      })
    )
    cherry.position.y = 1.0
    cake.add(cherry)

    return cake
  }

  private createPie(): THREE.Group {
    const pie = new THREE.Group()

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.3, 32),
      new THREE.MeshToonMaterial({
        color: '#E8C080',
        gradientMap: this.createSoftGradient(),
      })
    )
    base.position.y = 0.15
    pie.add(base)

    const filling = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.2, 32),
      new THREE.MeshToonMaterial({
        color: '#FFB060',
        gradientMap: this.createSoftGradient(),
      })
    )
    filling.position.y = 0.35
    pie.add(filling)

    return pie
  }

  private createApple(): THREE.Group {
    const apple = new THREE.Group()
    
    // 苹果身体
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshToonMaterial({
        color: '#00FFCC',
        gradientMap: this.createSoftGradient(),
      })
    )
    body.scale.set(1, 0.9, 1)
    apple.add(body)

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
      new THREE.MeshToonMaterial({
        color: '#FF44AA',
        gradientMap: this.createSoftGradient(),
      })
    )
    stem.position.y = 1.0
    apple.add(stem)

    const leaf = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 16),
      new THREE.MeshToonMaterial({
        color: '#FFEE00',
        gradientMap: this.createSoftGradient(),
        side: THREE.DoubleSide,
      })
    )
    leaf.rotation.x = Math.PI / 4
    leaf.position.set(0.2, 1.1, 0)
    apple.add(leaf)

    return apple
  }

  private createCherry(): THREE.Group {
    const cherry = new THREE.Group()

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshToonMaterial({
        color: '#44FF88',
        gradientMap: this.createSoftGradient(),
      })
    )
    cherry.add(body)

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
      new THREE.MeshToonMaterial({
        color: '#FF0088',
        gradientMap: this.createSoftGradient(),
      })
    )
    stem.position.y = 0.7
    cherry.add(stem)

    return cherry
  }

  private createDonut(): THREE.Group {
    const donut = new THREE.Group()

    const body = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.4, 16, 32),
      new THREE.MeshToonMaterial({
        color: '#FF44AA',
        gradientMap: this.createSoftGradient(),
      })
    )
    body.rotation.x = Math.PI / 2
    donut.add(body)

    const frosting = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.42, 16, 32),
      new THREE.MeshToonMaterial({
        color: '#8800FF',
        gradientMap: this.createSoftGradient(),
      })
    )
    frosting.rotation.x = Math.PI / 2
    frosting.position.y = 0.1
    frosting.scale.set(1, 1, 0.5)
    donut.add(frosting)

    return donut
  }

  private createCupcake(): THREE.Group {
    const cupcake = new THREE.Group()

    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.5, 0.8, 32),
      new THREE.MeshToonMaterial({
        color: '#FF8800',
        gradientMap: this.createSoftGradient(),
      })
    )
    cup.position.y = 0.4
    cupcake.add(cup)

    const cream = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.MeshToonMaterial({
        color: '#00E5FF',
        gradientMap: this.createSoftGradient(),
      })
    )
    cream.position.y = 1.0
    cream.scale.set(1, 1.2, 1)
    cupcake.add(cream)

    const cherry = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshToonMaterial({
        color: '#FF0088',
        gradientMap: this.createSoftGradient(),
      })
    )
    cherry.position.y = 1.6
    cupcake.add(cherry)

    return cupcake
  }

  /**
   * 创建柔和的渐变纹理
   */
  private createSoftGradient(): THREE.Texture {
    const colors = new Uint8Array([
      255, 255, 255,  // 亮部
      250, 248, 245,  // 中间
      245, 243, 240,  // 暗部
    ])
    
    const gradientMap = new THREE.DataTexture(colors, 3, 1, THREE.RGBFormat)
    gradientMap.needsUpdate = true
    
    return gradientMap
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
    this.time += 0.01
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  enableControls() {
    this.controls.enabled = true
  }

  disableControls() {
    this.controls.enabled = false
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  dispose() {
    cancelAnimationFrame(this.animationFrame)
    this.resizeObserver.disconnect()
    this.renderer.dispose()
    this.controls.dispose()
  }
}
