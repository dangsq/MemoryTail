import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { TailIKAnimationController } from './tailIKAnimation'
import { FurryTailRenderer, defaultFurryConfig } from './furryTail'

/**
 * 基于 STL 的物理驱动尾巴系统
 * 支持线缆驱动和 IK 动画
 */

// ========== 类型定义 ==========

export interface CableHole {
  index: number
  angle: number
  enabled: boolean
  tension: number
}

export interface LinkDimensions {
  linkHeight: number
  baseGround: number
  jointRadius: number
  totalHeight: number
}

export interface MountingBlock {
  enabled: boolean
  sizeX: number
  sizeY: number
  sizeZ: number
  posX: number
  posY: number
  posZ: number
}

export interface DiskConfig {
  thickness: number
  holeCount: number
  holeRadius: number
  baseRadius: number  // 基准圆盘半径
}

export interface TailConfig {
  segmentCount: number
  cableHoles: CableHole[]
  maxJointAngle: number
  linkScale: number
  headScale: number
  midScale: number
  tailScale: number
  dimensions: LinkDimensions
  mountingBlock: MountingBlock
  diskConfig: DiskConfig
  skinEnabled: boolean
  furryEnabled: boolean  // 实例化毛发
}

// ========== 默认配置 ==========

export const defaultLinkDimensions: LinkDimensions = {
  linkHeight: 10,
  baseGround: 0.4,
  jointRadius: 2.8,
  totalHeight: 10.4,
}

export const defaultTailConfig: TailConfig = {
  segmentCount: 26,  // 改为 26
  cableHoles: Array.from({ length: 12 }, (_, i) => ({
    index: i,
    angle: i * 30,
    enabled: false,
    tension: 0,
  })),
  maxJointAngle: 45,
  linkScale: 0.0014,
  headScale: 1.2,    // 改为 1.2
  midScale: 2.4,     // 改为 2.4
  tailScale: 2.8,    // 改为 2.8
  dimensions: defaultLinkDimensions,
  mountingBlock: {
    enabled: true,
    sizeX: 0.044,
    sizeY: 0.087,
    sizeZ: 0.112,
    posX: 0.213,
    posY: -0.045,
    posZ: -0.18,
  },
  diskConfig: {
    thickness: 0.003,
    holeCount: 12,
    holeRadius: 0.0015,
    baseRadius: 0.01,
  },
  skinEnabled: false,
  furryEnabled: true,  // 启用实例化毛发
}

// ========== STL 加载器 ==========

export class STLLinkLoader {
  private loader: STLLoader
  private geometry: THREE.BufferGeometry | null = null
  private loading: Promise<THREE.BufferGeometry> | null = null

  constructor() {
    this.loader = new STLLoader()
  }

  async load(url: string = '/MemoryTail/models/snake-link.stl'): Promise<THREE.BufferGeometry> {
    if (this.geometry) return this.geometry
    if (this.loading) return this.loading

    this.loading = new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (geometry) => {
          geometry.computeVertexNormals()
          geometry.center()
          this.geometry = geometry
          console.log('STL loaded')
          resolve(geometry)
        },
        undefined,
        (error) => {
          console.error('Failed to load STL:', error)
          reject(error)
        }
      )
    })

    return this.loading
  }

  createLinkMesh(material?: THREE.Material): THREE.Mesh {
    if (!this.geometry) {
      throw new Error('Geometry not loaded')
    }

    const mat = material || new THREE.MeshStandardMaterial({
      color: 0x4169E1,
      metalness: 0.7,
      roughness: 0.3,
    })

    const mesh = new THREE.Mesh(this.geometry, mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  getGeometry(): THREE.BufferGeometry | null {
    return this.geometry
  }
}

// ========== 物理关节 ==========

class PhysicalJoint {
  rotation: THREE.Euler
  angularVelocity: THREE.Vector3
  maxAngle: number
  damping: number
  stiffness: number

  constructor(maxAngle: number = 35) {
    this.rotation = new THREE.Euler()
    this.angularVelocity = new THREE.Vector3()
    this.maxAngle = maxAngle * Math.PI / 180
    this.damping = 0.95
    this.stiffness = 0.1
  }

  applyTorque(torque: THREE.Vector3, deltaTime: number): void {
    this.angularVelocity.add(torque.multiplyScalar(deltaTime))
    this.angularVelocity.multiplyScalar(this.damping)
    
    this.rotation.x += this.angularVelocity.x * deltaTime
    this.rotation.y += this.angularVelocity.y * deltaTime
    this.rotation.z += this.angularVelocity.z * deltaTime
    
    this.rotation.x = Math.max(-this.maxAngle, Math.min(this.maxAngle, this.rotation.x))
    this.rotation.y = Math.max(-this.maxAngle, Math.min(this.maxAngle, this.rotation.y))
  }

  applySpringForce(deltaTime: number): void {
    const restoreTorque = new THREE.Vector3(
      -this.rotation.x * this.stiffness,
      -this.rotation.y * this.stiffness,
      -this.rotation.z * this.stiffness
    )
    this.applyTorque(restoreTorque, deltaTime)
  }

  reset(): void {
    this.rotation.set(0, 0, 0)
    this.angularVelocity.set(0, 0, 0)
  }
}

// ========== 尾巴渲染器 ==========

export class CableDrivenTailRenderer {
  private scene: THREE.Scene
  private tailGroup: THREE.Group
  private stlLoader: STLLinkLoader
  private segments: THREE.Mesh[] = []
  private joints: PhysicalJoint[] = []
  private disks: THREE.Group[] = []
  private skinMesh: THREE.Mesh | null = null
  private mountingBlock: THREE.Mesh | null = null
  private config: TailConfig
  private loaded: boolean = false
  private animationId: number | null = null
  private lastTime: number = 0
  private ikController: TailIKAnimationController | null = null
  private furryRenderer: FurryTailRenderer | null = null

  constructor(scene: THREE.Scene, config: TailConfig = defaultTailConfig) {
    this.scene = scene
    this.config = config
    this.tailGroup = new THREE.Group()
    this.stlLoader = new STLLinkLoader()
    
    this.scene.add(this.tailGroup)
    this.initialize()
  }

  /**
   * 创建卡通渐变纹理
   */
  private createToonGradient(): THREE.Texture {
    const colors = new Uint8Array([
      255, 255, 255,  // 亮部
      240, 240, 240,  // 中间
      220, 220, 220,  // 暗部
    ])
    
    const gradientMap = new THREE.DataTexture(colors, 3, 1, THREE.RGBFormat)
    gradientMap.needsUpdate = true
    
    return gradientMap
  }

  private async initialize(): Promise<void> {
    try {
      await this.stlLoader.load()
      this.buildTail()
      this.loaded = true
      this.startPhysicsLoop()
      console.log('Tail initialized')
    } catch (error) {
      console.error('Failed to initialize tail:', error)
    }
  }

  private buildTail(): void {
    this.segments.forEach(seg => this.tailGroup.remove(seg))
    this.disks.forEach(disk => this.tailGroup.remove(disk))
    if (this.skinMesh) {
      this.tailGroup.remove(this.skinMesh)
      this.skinMesh = null
    }
    this.segments = []
    this.joints = []
    this.disks = []

    // 创建安装座（mounting block）
    if (this.config.mountingBlock.enabled) {
      if (this.mountingBlock) {
        this.tailGroup.remove(this.mountingBlock)
      }
      
      const blockGeometry = new THREE.BoxGeometry(
        this.config.mountingBlock.sizeX,
        this.config.mountingBlock.sizeY,
        this.config.mountingBlock.sizeZ
      )
      
      const blockMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        metalness: 0.8,
        roughness: 0.2,
      })
      
      this.mountingBlock = new THREE.Mesh(blockGeometry, blockMaterial)
      this.mountingBlock.position.set(
        this.config.mountingBlock.posX,
        this.config.mountingBlock.posY,
        this.config.mountingBlock.posZ
      )
      this.mountingBlock.name = 'mounting-block'
      this.tailGroup.add(this.mountingBlock)
    }

    const material = new THREE.MeshToonMaterial({
      color: 0xFFFFFF,  // 白色
      gradientMap: this.createToonGradient(),
    })

    // 创建轮廓线材质
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,  // 黑色轮廓
      side: THREE.BackSide,
    })

    for (let i = 0; i < this.config.segmentCount; i++) {
      // 所有链节使用相同的 linkScale
      const segment = this.stlLoader.createLinkMesh(material)
      segment.scale.setScalar(this.config.linkScale)
      segment.name = `tail-segment-${i}`
      
      this.segments.push(segment)
      this.tailGroup.add(segment)

      // 添加轮廓线
      const outline = this.stlLoader.createLinkMesh(outlineMaterial)
      outline.scale.setScalar(this.config.linkScale * 1.05)  // 稍微大一点
      outline.name = `tail-segment-outline-${i}`
      segment.add(outline)  // 作为子对象，跟随主体移动
      
      if (i > 0) {
        const joint = new PhysicalJoint(this.config.maxJointAngle)
        this.joints.push(joint)
        
        // 在关节位置创建圆盘，圆盘大小根据位置变化
        const diskRadius = this.getDiskRadius(i)
        console.log(`Creating disk ${i-1}: radius = ${diskRadius.toFixed(6)}m`)
        const disk = this.createDisk(diskRadius)
        this.disks.push(disk)
        this.tailGroup.add(disk)
      }
    }

    // 创建皮肤
    if (this.config.skinEnabled) {
      this.createSkin()
    }

    // 初始化 IK 动画控制器
    this.initializeIKController()

    // 初始化毛发渲染器
    this.initializeFurryRenderer()

    this.updateTailPose()
  }

  private getDiskRadius(index: number): number {
    const total = this.config.segmentCount
    
    // 三段式插值：头部 -> 中部 -> 尾部
    const t = index / (total - 1) // 0 到 1
    
    let radiusMultiplier: number
    if (t < 0.5) {
      // 前半段：头部到中部
      const localT = t * 2 // 0 到 1
      radiusMultiplier = this.config.headScale * (1 - localT) + this.config.midScale * localT
    } else {
      // 后半段：中部到尾部
      const localT = (t - 0.5) * 2 // 0 到 1
      radiusMultiplier = this.config.midScale * (1 - localT) + this.config.tailScale * localT
    }
    
    // 圆盘半径 = 基准半径 × 倍数
    return this.config.diskConfig.baseRadius * radiusMultiplier
  }

  private createDisk(radius: number): THREE.Group {
    const diskGroup = new THREE.Group()
    
    console.log(`Creating disk with radius: ${radius.toFixed(6)}m, thickness: ${this.config.diskConfig.thickness}m`)
    
    // 圆盘主体 - 固定厚度
    const diskGeometry = new THREE.CylinderGeometry(
      radius,
      radius,
      this.config.diskConfig.thickness,
      32
    )
    
    const diskMaterial = new THREE.MeshToonMaterial({
      color: 0xFFFFFF,  // 白色
      gradientMap: this.createToonGradient(),
    })
    
    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial)
    diskMesh.rotation.x = Math.PI / 2
    diskGroup.add(diskMesh)

    // 添加圆盘轮廓线
    const diskOutlineGeometry = new THREE.CylinderGeometry(
      radius * 1.05,
      radius * 1.05,
      this.config.diskConfig.thickness * 1.1,
      32
    )
    const diskOutlineMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    })
    const diskOutline = new THREE.Mesh(diskOutlineGeometry, diskOutlineMaterial)
    diskOutline.rotation.x = Math.PI / 2
    diskGroup.add(diskOutline)
    
    // 在圆盘上创建孔的标记
    const holeMarkerGeometry = new THREE.CylinderGeometry(
      this.config.diskConfig.holeRadius,
      this.config.diskConfig.holeRadius,
      this.config.diskConfig.thickness * 1.2,
      8
    )
    
    const holeMarkerMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.5,
      roughness: 0.5,
    })
    
    for (let i = 0; i < this.config.diskConfig.holeCount; i++) {
      const angle = (i * 360 / this.config.diskConfig.holeCount) * Math.PI / 180
      const holeMarker = new THREE.Mesh(holeMarkerGeometry, holeMarkerMaterial)
      
      holeMarker.position.x = Math.cos(angle) * radius * 0.85
      holeMarker.position.y = Math.sin(angle) * radius * 0.85
      holeMarker.rotation.x = Math.PI / 2
      
      diskGroup.add(holeMarker)
    }
    
    console.log(`Disk created with ${this.config.diskConfig.holeCount} holes`)
    
    return diskGroup
  }

  private createSkin(): void {
    // 使用 CatmullRomCurve3 创建平滑的曲线路径
    const pathPoints: THREE.Vector3[] = []
    const radii: number[] = []
    
    // 收集所有链节的位置和对应的圆盘半径
    this.segments.forEach((segment, i) => {
      pathPoints.push(segment.position.clone())
      const diskRadius = this.getDiskRadius(i)
      // 皮肤半径略大于圆盘半径
      radii.push(diskRadius * 1.15)
    })
    
    // 在尾部添加一个额外的点，用于封闭
    const lastSegment = this.segments[this.segments.length - 1]
    const linkHeight = -this.config.dimensions.totalHeight * this.config.linkScale * 1.15
    const tailEndPoint = new THREE.Vector3(0, 0, linkHeight)
    tailEndPoint.applyEuler(lastSegment.rotation)
    tailEndPoint.add(lastSegment.position)
    pathPoints.push(tailEndPoint)
    radii.push(0) // 尾部收尖到0
    
    // 创建平滑曲线，使用更高的张力参数
    const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.3)
    
    // 创建自定义的管状几何体，半径沿路径变化
    const tubularSegments = this.config.segmentCount * 32 // 大幅增加细分
    const radialSegments = 32
    const vertices: number[] = []
    const indices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    
    // 沿着曲线生成顶点
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments
      const point = curve.getPoint(t)
      const tangent = curve.getTangent(t).normalize()
      
      // 使用平滑的半径插值
      const pathT = t * (pathPoints.length - 1)
      const lowerIndex = Math.floor(pathT)
      const upperIndex = Math.min(Math.ceil(pathT), pathPoints.length - 1)
      const localT = pathT - lowerIndex
      
      // 使用平滑步函数进行插值
      const smoothT = localT * localT * (3 - 2 * localT) // smoothstep
      const radius = radii[lowerIndex] * (1 - smoothT) + radii[upperIndex] * smoothT
      
      // 计算法向量和副法向量（Frenet frame）
      const normal = new THREE.Vector3()
      const binormal = new THREE.Vector3()
      
      if (Math.abs(tangent.y) < 0.999) {
        normal.set(0, 1, 0).cross(tangent).normalize()
      } else {
        normal.set(1, 0, 0).cross(tangent).normalize()
      }
      binormal.crossVectors(tangent, normal).normalize()
      
      // 生成圆环上的顶点
      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        
        const vertex = new THREE.Vector3()
        vertex.x = point.x + radius * (cos * normal.x + sin * binormal.x)
        vertex.y = point.y + radius * (cos * normal.y + sin * binormal.y)
        vertex.z = point.z + radius * (cos * normal.z + sin * binormal.z)
        
        vertices.push(vertex.x, vertex.y, vertex.z)
        
        const normalVec = new THREE.Vector3(
          cos * normal.x + sin * binormal.x,
          cos * normal.y + sin * binormal.y,
          cos * normal.z + sin * binormal.z
        ).normalize()
        
        normals.push(normalVec.x, normalVec.y, normalVec.z)
        uvs.push(j / radialSegments, t)
      }
    }
    
    // 生成面索引
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j
        const b = a + radialSegments + 1
        const c = a + radialSegments + 2
        const d = a + 1
        
        indices.push(a, b, d)
        indices.push(b, c, d)
      }
    }
    
    const skinGeometry = new THREE.BufferGeometry()
    skinGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    skinGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    skinGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    skinGeometry.setIndex(indices)
    skinGeometry.computeVertexNormals() // 重新计算法线，让表面更平滑
    
    // 创建毛茸茸的 shader 材质
    const skinMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(0xD2B48C) },
        furColor: { value: new THREE.Color(0x8B7355) },
        lightDirection: { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 furColor;
        uniform vec3 lightDirection;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(lightDirection);
          float diffuse = max(dot(normal, lightDir), 0.0);
          
          float ao = 0.3 + 0.7 * diffuse;
          
          float furPattern = noise(vUv * 100.0);
          furPattern += noise(vUv * 200.0) * 0.5;
          furPattern += noise(vUv * 400.0) * 0.25;
          furPattern /= 1.75;
          
          vec3 color = mix(baseColor, furColor, furPattern * 0.3);
          
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(dot(viewDir, normal), 0.0);
          rim = pow(rim, 3.0);
          color += vec3(0.2, 0.15, 0.1) * rim;
          
          color *= ao;
          color *= (0.5 + 0.5 * diffuse);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    })
    
    this.skinMesh = new THREE.Mesh(skinGeometry, skinMaterial)
    this.skinMesh.name = 'tail-skin'
    this.tailGroup.add(this.skinMesh)
    
    // 隐藏机械结构
    this.segments.forEach(seg => seg.visible = false)
    this.disks.forEach(disk => disk.visible = false)
    
    console.log('Skin created with smooth radius variation and furry shader')
  }

  private startPhysicsLoop(): void {
    const animate = (time: number) => {
      if (!this.loaded) return
      
      const deltaTime = this.lastTime ? (time - this.lastTime) / 1000 : 0.016
      this.lastTime = time
      
      this.updatePhysics(deltaTime)
      this.animationId = requestAnimationFrame(animate)
    }
    
    this.animationId = requestAnimationFrame(animate)
  }

  private updatePhysics(deltaTime: number): void {
    // 更新 IK 动画
    if (this.ikController) {
      this.ikController.update(deltaTime)
      
      // 如果 IK 动画启用，使用 IK 计算的旋转
      const ikConfig = this.ikController.getConfig()
      if (ikConfig.enabled) {
        const ikRotations = this.ikController.getJointRotations()
        this.joints.forEach((joint, i) => {
          if (i < ikRotations.length) {
            joint.rotation.copy(ikRotations[i])
          }
        })
        this.updateTailPose()
        
        return
      }
    }
    
    // 否则使用线缆驱动的物理模拟
    const cableTorques = this.calculateCableTorques()
    
    this.joints.forEach((joint, i) => {
      if (cableTorques[i]) {
        joint.applyTorque(cableTorques[i], deltaTime)
      }
      joint.applySpringForce(deltaTime)
    })
    
    this.updateTailPose()
  }

  private initializeIKController(): void {
    // 计算链节长度
    const linkHeight = this.config.dimensions.totalHeight * this.config.linkScale * 1.15
    
    // 计算基础位置（第一个链节的位置）
    let basePosition = new THREE.Vector3(0, 0, 0)
    if (this.mountingBlock) {
      basePosition.set(
        this.config.mountingBlock.posX,
        this.config.mountingBlock.posY,
        this.config.mountingBlock.posZ - this.config.mountingBlock.sizeZ / 2 - linkHeight / 2
      )
    }
    
    // 创建 IK 控制器
    this.ikController = new TailIKAnimationController(
      this.config.segmentCount,
      linkHeight,
      basePosition,
      this.config.maxJointAngle
    )
    
    console.log('IK Controller initialized:', {
      segmentCount: this.config.segmentCount,
      linkHeight: linkHeight.toFixed(6),
      basePosition: basePosition.toArray().map(v => v.toFixed(3)),
    })
  }

  private initializeFurryRenderer(): void {
    // 移除旧的毛发
    if (this.furryRenderer) {
      const oldMesh = this.furryRenderer.getMesh()
      if (oldMesh) {
        this.tailGroup.remove(oldMesh)
      }
      this.furryRenderer.dispose()
      this.furryRenderer = null
    }

    // 如果启用毛发，创建新的渲染器
    if (this.config.furryEnabled) {
      this.furryRenderer = new FurryTailRenderer(this.config.segmentCount, defaultFurryConfig)
      const furMesh = this.furryRenderer.getMesh()
      if (furMesh) {
        this.tailGroup.add(furMesh)
      }
      console.log('Furry renderer initialized with', this.config.segmentCount, 'segments')
    }
  }

  private calculateCableTorques(): THREE.Vector3[] {
    const torques: THREE.Vector3[] = []
    const enabledHoles = this.config.cableHoles.filter(h => h.enabled)
    
    if (enabledHoles.length === 0) {
      return Array(this.joints.length).fill(new THREE.Vector3())
    }
    
    for (let i = 0; i < this.joints.length; i++) {
      let totalTorqueX = 0
      let totalTorqueY = 0
      
      enabledHoles.forEach(hole => {
        const angleRad = hole.angle * Math.PI / 180
        const force = hole.tension * 10
        
        totalTorqueX += Math.sin(angleRad) * force
        totalTorqueY += Math.cos(angleRad) * force
      })
      
      torques.push(new THREE.Vector3(totalTorqueX, totalTorqueY, 0))
    }
    
    return torques
  }

  private updateTailPose(): void {
    if (!this.loaded || this.segments.length === 0) return
    
    // linkScale 已经是缩放比例，不需要再除以 1000
    // totalHeight 是 mm，linkScale 是缩放因子
    // 增加 15% 的间隙，让链节之间不那么紧密
    // Z 轴反向：使用负值让尾巴向下生长
    const linkHeight = -this.config.dimensions.totalHeight * this.config.linkScale * 1.15

    this.segments.forEach((segment, i) => {
      if (i === 0) {
        // 第一个链节连接到安装座的底面
        if (this.mountingBlock) {
          segment.position.copy(this.mountingBlock.position)
          // 安装座底面位置 - 链节高度的一半
          segment.position.z = this.mountingBlock.position.z - this.config.mountingBlock.sizeZ / 2 + linkHeight / 2
        } else {
          segment.position.set(0, 0, 0)
        }
        segment.rotation.set(0, 0, 0)
      } else {
        const joint = this.joints[i - 1]
        const parent = this.segments[i - 1]
        
        const connectionPoint = new THREE.Vector3(0, 0, linkHeight)
        connectionPoint.applyEuler(parent.rotation)
        connectionPoint.add(parent.position)
        
        segment.position.copy(connectionPoint)
        segment.rotation.copy(parent.rotation)
        segment.rotation.x += joint.rotation.x
        segment.rotation.y += joint.rotation.y
        segment.rotation.z += joint.rotation.z
        
        // 更新圆盘位置和旋转
        if (this.disks[i - 1]) {
          this.disks[i - 1].position.copy(connectionPoint)
          this.disks[i - 1].rotation.copy(segment.rotation)
        }
      }
    })
    
    // 更新皮肤
    if (this.config.skinEnabled && this.skinMesh) {
      this.updateSkin()
    }

    // 更新毛发
    if (this.config.furryEnabled && this.furryRenderer) {
      this.updateFurry()
    }
  }

  private updateFurry(): void {
    if (!this.furryRenderer || this.segments.length === 0) return

    // 收集所有链节的位置和旋转
    const positions: THREE.Vector3[] = []
    const rotations: THREE.Euler[] = []
    const radii: number[] = []

    this.segments.forEach((segment, index) => {
      positions.push(segment.position.clone())
      rotations.push(segment.rotation.clone())
      
      // 获取当前链节的圆盘半径
      const diskRadius = this.getDiskRadius(index)
      radii.push(diskRadius)
    })

    // 更新毛发，传递半径信息
    this.furryRenderer.updateFur(positions, rotations, radii)
  }

  private updateSkin(): void {
    if (!this.skinMesh || this.segments.length === 0) return
    
    // 重新生成皮肤几何体
    const pathPoints: THREE.Vector3[] = []
    const radii: number[] = []
    
    // 收集所有链节的位置和对应的圆盘半径
    this.segments.forEach((segment, i) => {
      pathPoints.push(segment.position.clone())
      const diskRadius = this.getDiskRadius(i)
      radii.push(diskRadius * 1.15)
    })
    
    // 在尾部添加一个额外的点，用于封闭
    const lastSegment = this.segments[this.segments.length - 1]
    const linkHeight = -this.config.dimensions.totalHeight * this.config.linkScale * 1.15
    const tailEndPoint = new THREE.Vector3(0, 0, linkHeight)
    tailEndPoint.applyEuler(lastSegment.rotation)
    tailEndPoint.add(lastSegment.position)
    pathPoints.push(tailEndPoint)
    radii.push(0) // 尾部收尖到0
    
    // 创建平滑曲线
    const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.3)
    
    // 创建自定义的管状几何体
    const tubularSegments = this.config.segmentCount * 32
    const radialSegments = 32
    const vertices: number[] = []
    const indices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    
    // 沿着曲线生成顶点
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments
      const point = curve.getPoint(t)
      const tangent = curve.getTangent(t).normalize()
      
      // 使用平滑的半径插值
      const pathT = t * (pathPoints.length - 1)
      const lowerIndex = Math.floor(pathT)
      const upperIndex = Math.min(Math.ceil(pathT), pathPoints.length - 1)
      const localT = pathT - lowerIndex
      
      // 使用平滑步函数进行插值
      const smoothT = localT * localT * (3 - 2 * localT)
      const radius = radii[lowerIndex] * (1 - smoothT) + radii[upperIndex] * smoothT
      
      // 计算法向量和副法向量
      const normal = new THREE.Vector3()
      const binormal = new THREE.Vector3()
      
      if (Math.abs(tangent.y) < 0.999) {
        normal.set(0, 1, 0).cross(tangent).normalize()
      } else {
        normal.set(1, 0, 0).cross(tangent).normalize()
      }
      binormal.crossVectors(tangent, normal).normalize()
      
      // 生成圆环上的顶点
      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        
        const vertex = new THREE.Vector3()
        vertex.x = point.x + radius * (cos * normal.x + sin * binormal.x)
        vertex.y = point.y + radius * (cos * normal.y + sin * binormal.y)
        vertex.z = point.z + radius * (cos * normal.z + sin * binormal.z)
        
        vertices.push(vertex.x, vertex.y, vertex.z)
        
        const normalVec = new THREE.Vector3(
          cos * normal.x + sin * binormal.x,
          cos * normal.y + sin * binormal.y,
          cos * normal.z + sin * binormal.z
        ).normalize()
        
        normals.push(normalVec.x, normalVec.y, normalVec.z)
        uvs.push(j / radialSegments, t)
      }
    }
    
    // 生成面索引
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j
        const b = a + radialSegments + 1
        const c = a + radialSegments + 2
        const d = a + 1
        
        indices.push(a, b, d)
        indices.push(b, c, d)
      }
    }
    
    const newGeometry = new THREE.BufferGeometry()
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    newGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    newGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    newGeometry.setIndex(indices)
    newGeometry.computeVertexNormals()
    
    this.skinMesh.geometry.dispose()
    this.skinMesh.geometry = newGeometry
  }

  setCableTension(holeIndex: number, tension: number): void {
    const hole = this.config.cableHoles.find(h => h.index === holeIndex)
    if (hole) {
      hole.tension = Math.max(0, Math.min(1, tension))
    }
  }

  toggleCableHole(holeIndex: number, enabled: boolean): void {
    const hole = this.config.cableHoles.find(h => h.index === holeIndex)
    if (hole) {
      hole.enabled = enabled
    }
  }

  updateCableHoles(holes: CableHole[]): void {
    this.config.cableHoles = holes
  }

  updateMountingBlock(params: Partial<MountingBlock>): void {
    this.config.mountingBlock = { ...this.config.mountingBlock, ...params }
    if (this.mountingBlock) {
      // 更新尺寸
      if (params.sizeX !== undefined || params.sizeY !== undefined || params.sizeZ !== undefined) {
        const geometry = new THREE.BoxGeometry(
          this.config.mountingBlock.sizeX,
          this.config.mountingBlock.sizeY,
          this.config.mountingBlock.sizeZ
        )
        this.mountingBlock.geometry.dispose()
        this.mountingBlock.geometry = geometry
      }
      
      // 更新位置
      this.mountingBlock.position.set(
        this.config.mountingBlock.posX,
        this.config.mountingBlock.posY,
        this.config.mountingBlock.posZ
      )
    }
  }

  resetJoints(): void {
    this.joints.forEach(joint => joint.reset())
    this.updateTailPose()
  }

  rebuild(config: Partial<TailConfig>): void {
    // 保存当前 IK 控制器的状态
    let ikEnabled = false
    let ikPreset = 'idle'
    let ikMode = 'preset'
    let ikConfig = null
    
    if (this.ikController) {
      const currentConfig = this.ikController.getConfig()
      ikEnabled = currentConfig.enabled
      ikPreset = currentConfig.currentPreset
      ikMode = currentConfig.mode
      ikConfig = {
        customSpeed: currentConfig.customSpeed,
        smoothing: currentConfig.smoothing,
        ikIterations: currentConfig.ikIterations,
        customAmplitude: currentConfig.customAmplitude.clone(),
        customFrequency: currentConfig.customFrequency.clone(),
      }
    }
    
    this.config = { ...this.config, ...config }
    if (this.loaded) {
      this.buildTail()
      
      // 恢复 IK 控制器的状态
      if (this.ikController && ikConfig) {
        this.ikController.setEnabled(ikEnabled)
        this.ikController.setPreset(ikPreset)
        this.ikController.setMode(ikMode as 'preset' | 'mouse')
        this.ikController.updateConfig({
          customSpeed: ikConfig.customSpeed,
          smoothing: ikConfig.smoothing,
          ikIterations: ikConfig.ikIterations,
        })
        this.ikController.getConfig().customAmplitude.copy(ikConfig.customAmplitude)
        this.ikController.getConfig().customFrequency.copy(ikConfig.customFrequency)
      }
    }
  }

  setVisible(visible: boolean): void {
    this.tailGroup.visible = visible
  }

  setPosition(x: number, y: number, z: number): void {
    this.tailGroup.position.set(x, y, z)
  }

  setRotation(x: number, y: number, z: number): void {
    this.tailGroup.rotation.set(x, y, z)
  }

  getConfig(): TailConfig {
    return this.config
  }

  getIKController(): TailIKAnimationController | null {
    return this.ikController
  }

  isLoaded(): boolean {
    return this.loaded
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    this.segments.forEach(segment => {
      segment.geometry.dispose()
      if (Array.isArray(segment.material)) {
        segment.material.forEach(mat => mat.dispose())
      } else {
        segment.material.dispose()
      }
      this.tailGroup.remove(segment)
    })
    
    // 清理毛发渲染器
    if (this.furryRenderer) {
      const furMesh = this.furryRenderer.getMesh()
      if (furMesh) {
        this.tailGroup.remove(furMesh)
      }
      this.furryRenderer.dispose()
      this.furryRenderer = null
    }
    
    this.segments = []
    this.joints = []
    this.scene.remove(this.tailGroup)
  }
}

export function createPresetConfig(preset: 'straight' | 'curved' | 'spiral'): Partial<TailConfig> {
  const base: Partial<TailConfig> = { segmentCount: 6 }

  switch (preset) {
    case 'straight':
      return {
        ...base,
        cableHoles: Array.from({ length: 12 }, (_, i) => ({
          index: i,
          angle: i * 30,
          enabled: false,
          tension: 0,
        })),
      }
    case 'curved':
      return {
        ...base,
        cableHoles: Array.from({ length: 12 }, (_, i) => ({
          index: i,
          angle: i * 30,
          enabled: i === 0,
          tension: i === 0 ? 0.5 : 0,
        })),
      }
    case 'spiral':
      return {
        ...base,
        cableHoles: Array.from({ length: 12 }, (_, i) => ({
          index: i,
          angle: i * 30,
          enabled: i % 3 === 0,
          tension: i % 3 === 0 ? 0.3 : 0,
        })),
      }
    default:
      return base
  }
}
