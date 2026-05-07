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
    // 柔和的米白色背景 - 毛绒玩具感
    this.scene.background = new THREE.Color('#F5F5DC')  // 米色
    // 柔和的雾效
    this.scene.fog = new THREE.Fog('#F5F5DC', 4, 10)

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.01, 50)
    this.camera.position.set(0.5, 0.5, 2.0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.localClippingEnabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // 柔和的色调映射
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
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

    // 毛绒玩具风格地板 - 柔和的奶油色
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3, 64),
      new THREE.MeshToonMaterial({
        color: '#FFF8E7',  // 淡奶油色
        gradientMap: this.createSoftGradient(),
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.5
    floor.receiveShadow = true
    this.stage.add(floor)

    // 毛绒玩具风格光照 - 温暖柔和
    
    // 主光源 - 温暖的阳光
    const mainLight = new THREE.DirectionalLight('#FFF4E6', 1.2)  // 淡黄色
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
    mainLight.shadow.radius = 4  // 柔和阴影
    this.stage.add(mainLight)

    // 环境光 - 明亮柔和
    const ambientLight = new THREE.AmbientLight('#FFFAF0', 1.0)  // 花白色
    this.stage.add(ambientLight)

    // 补光 - 柔和的天空蓝
    const fillLight = new THREE.DirectionalLight('#E6F2FF', 0.5)  // 淡蓝色
    fillLight.position.set(-3, 3, -2)
    this.stage.add(fillLight)

    // 点光源 - 温暖的桃色
    const warmLight = new THREE.PointLight('#FFE4D6', 0.6, 6)  // 淡桃色
    warmLight.position.set(2, 1.5, 1)
    this.stage.add(warmLight)

    // 半球光 - 天空和地面的柔和过渡
    const hemiLight = new THREE.HemisphereLight('#F0F8FF', '#FFF8E7', 0.6)
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
    cake.scale.setScalar(0.5)
    addOutlineToGroup(cake)
    this.stage.add(cake)

    // 🥧 派
    const pie = this.createPie()
    pie.position.set(1.8, -0.4, 0.5)
    pie.scale.setScalar(0.44)
    addOutlineToGroup(pie)
    this.stage.add(pie)

    // 🍎 苹果
    const apple = this.createApple()
    apple.position.set(-1.2, -0.42, -1.5)
    apple.scale.setScalar(0.36)
    addOutlineToGroup(apple)
    this.stage.add(apple)

    // 🍒 樱桃
    const cherry1 = this.createCherry()
    cherry1.position.set(1.5, -0.43, -1.2)
    cherry1.scale.setScalar(0.3)
    addOutlineToGroup(cherry1)
    this.stage.add(cherry1)

    const cherry2 = this.createCherry()
    cherry2.position.set(1.7, -0.43, -1.0)
    cherry2.scale.setScalar(0.3)
    addOutlineToGroup(cherry2)
    this.stage.add(cherry2)

    // 🍩 甜甜圈
    const donut = this.createDonut()
    donut.position.set(-1.8, -0.38, -0.5)
    donut.scale.setScalar(0.44)
    addOutlineToGroup(donut)
    this.stage.add(donut)

    // 🧁 纸杯蛋糕
    const cupcake = this.createCupcake()
    cupcake.position.set(0.8, -0.4, 1.8)
    cupcake.scale.setScalar(0.36)
    addOutlineToGroup(cupcake)
    this.stage.add(cupcake)
  }

  /**
   * 创建蛋糕
   */
  private createCake(): THREE.Group {
    const cake = new THREE.Group()
    
    // 蛋糕底层
    const layer1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.5, 32),
      new THREE.MeshToonMaterial({
        color: '#FFE4E1',  // 淡粉色
        gradientMap: this.createSoftGradient(),
      })
    )
    layer1.position.y = 0.25
    cake.add(layer1)

    // 蛋糕上层
    const layer2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.4, 32),
      new THREE.MeshToonMaterial({
        color: '#FFF0F5',  // 薰衣草腮红
        gradientMap: this.createSoftGradient(),
      })
    )
    layer2.position.y = 0.7
    cake.add(layer2)

    // 樱桃装饰
    const cherry = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshToonMaterial({
        color: '#FF6B6B',  // 红色
        gradientMap: this.createSoftGradient(),
      })
    )
    cherry.position.y = 1.0
    cake.add(cherry)

    return cake
  }

  /**
   * 创建派
   */
  private createPie(): THREE.Group {
    const pie = new THREE.Group()
    
    // 派底
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.3, 32),
      new THREE.MeshToonMaterial({
        color: '#DEB887',  // 棕褐色
        gradientMap: this.createSoftGradient(),
      })
    )
    base.position.y = 0.15
    pie.add(base)

    // 派馅
    const filling = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.2, 32),
      new THREE.MeshToonMaterial({
        color: '#FFB347',  // 橙色
        gradientMap: this.createSoftGradient(),
      })
    )
    filling.position.y = 0.35
    pie.add(filling)

    return pie
  }

  /**
   * 创建苹果
   */
  private createApple(): THREE.Group {
    const apple = new THREE.Group()
    
    // 苹果身体
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshToonMaterial({
        color: '#FF6B6B',  // 红色
        gradientMap: this.createSoftGradient(),
      })
    )
    body.scale.set(1, 0.9, 1)
    apple.add(body)

    // 苹果茎
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
      new THREE.MeshToonMaterial({
        color: '#8B4513',  // 棕色
        gradientMap: this.createSoftGradient(),
      })
    )
    stem.position.y = 1.0
    apple.add(stem)

    // 叶子
    const leaf = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 16),
      new THREE.MeshToonMaterial({
        color: '#90EE90',  // 浅绿色
        gradientMap: this.createSoftGradient(),
        side: THREE.DoubleSide,
      })
    )
    leaf.rotation.x = Math.PI / 4
    leaf.position.set(0.2, 1.1, 0)
    apple.add(leaf)

    return apple
  }

  /**
   * 创建樱桃
   */
  private createCherry(): THREE.Group {
    const cherry = new THREE.Group()
    
    // 樱桃身体
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshToonMaterial({
        color: '#DC143C',  // 深红色
        gradientMap: this.createSoftGradient(),
      })
    )
    cherry.add(body)

    // 樱桃茎
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
      new THREE.MeshToonMaterial({
        color: '#8B4513',  // 棕色
        gradientMap: this.createSoftGradient(),
      })
    )
    stem.position.y = 0.7
    cherry.add(stem)

    return cherry
  }

  /**
   * 创建甜甜圈
   */
  private createDonut(): THREE.Group {
    const donut = new THREE.Group()
    
    // 甜甜圈身体
    const body = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.4, 16, 32),
      new THREE.MeshToonMaterial({
        color: '#FFD700',  // 金色
        gradientMap: this.createSoftGradient(),
      })
    )
    body.rotation.x = Math.PI / 2
    donut.add(body)

    // 糖霜
    const frosting = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.42, 16, 32),
      new THREE.MeshToonMaterial({
        color: '#FFB6C1',  // 粉色
        gradientMap: this.createSoftGradient(),
      })
    )
    frosting.rotation.x = Math.PI / 2
    frosting.position.y = 0.1
    frosting.scale.set(1, 1, 0.5)
    donut.add(frosting)

    return donut
  }

  /**
   * 创建纸杯蛋糕
   */
  private createCupcake(): THREE.Group {
    const cupcake = new THREE.Group()
    
    // 纸杯
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.5, 0.8, 32),
      new THREE.MeshToonMaterial({
        color: '#FFE4E1',  // 淡粉色
        gradientMap: this.createSoftGradient(),
      })
    )
    cup.position.y = 0.4
    cupcake.add(cup)

    // 奶油
    const cream = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.MeshToonMaterial({
        color: '#FFF8DC',  // 奶油色
        gradientMap: this.createSoftGradient(),
      })
    )
    cream.position.y = 1.0
    cream.scale.set(1, 1.2, 1)
    cupcake.add(cream)

    // 樱桃
    const cherry = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshToonMaterial({
        color: '#FF6B6B',  // 红色
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
