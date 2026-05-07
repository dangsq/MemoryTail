import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import RAPIER from '@dimforge/rapier3d-compat'

/**
 * 基于 Rapier 物理引擎的尾巴系统
 * 
 * 使用真实的物理模拟：
 * - 刚体动力学
 * - 球窝关节约束
 * - 力和力矩
 * - 碰撞检测
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

export interface TailConfig {
  segmentCount: number
  cableHoles: CableHole[]
  maxJointAngle: number
  linkScale: number
  dimensions: LinkDimensions
}

// ========== 默认配置 ==========

export const defaultLinkDimensions: LinkDimensions = {
  linkHeight: 10,
  baseGround: 0.4,
  jointRadius: 2.8,
  totalHeight: 10.4,
}

export const defaultTailConfig: TailConfig = {
  segmentCount: 6,
  cableHoles: Array.from({ length: 12 }, (_, i) => ({
    index: i,
    angle: i * 30,
    enabled: false,
    tension: 0,
  })),
  maxJointAngle: 35,
  linkScale: 0.002,
  dimensions: defaultLinkDimensions,
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

// ========== Rapier 物理尾巴系统 ==========

export class CableDrivenTailRenderer {
  private scene: THREE.Scene
  private tailGroup: THREE.Group
  private stlLoader: STLLinkLoader
  private segments: THREE.Mesh[] = []
  private config: TailConfig
  private loaded: boolean = false
  
  // Rapier 物理世界
  private world: RAPIER.World | null = null
  private rigidBodies: RAPIER.RigidBody[] = []
  private joints: RAPIER.ImpulseJoint[] = []
  
  private animationId: number | null = null
  private physicsEnabled: boolean = false  // 默认关闭物理模拟

  constructor(scene: THREE.Scene, config: TailConfig = defaultTailConfig) {
    this.scene = scene
    this.config = config
    this.tailGroup = new THREE.Group()
    this.stlLoader = new STLLinkLoader()
    
    this.scene.add(this.tailGroup)
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      // 初始化 Rapier
      await RAPIER.init()
      
      // 创建物理世界（重力向下）
      const gravity = new RAPIER.Vector3(0, 0, -9.81)
      this.world = new RAPIER.World(gravity)
      
      console.log('Rapier initialized')
      
      // 加载 STL
      await this.stlLoader.load()
      
      // 构建尾巴
      this.buildTail()
      this.loaded = true
      
      // 启动渲染循环（物理默认关闭）
      this.startPhysicsLoop()
      
      console.log('Tail initialized with Rapier physics (disabled by default)')
    } catch (error) {
      console.error('Failed to initialize tail:', error)
    }
  }

  private buildTail(): void {
    if (!this.world) return
    
    // 清除旧的物理对象
    this.rigidBodies.forEach(body => {
      if (this.world) {
        this.world.removeRigidBody(body)
      }
    })
    
    // 清除旧的视觉网格
    this.segments.forEach(seg => this.tailGroup.remove(seg))
    this.segments = []
    this.rigidBodies = []
    this.joints = []

    const material = new THREE.MeshStandardMaterial({
      color: 0x4169E1,
      metalness: 0.7,
      roughness: 0.3,
    })

    const linkHeight = this.config.dimensions.totalHeight * this.config.linkScale / 1000
    const linkRadius = 0.008 * this.config.linkScale / 1000 // 链节半径 8mm

    console.log(`Building tail: linkHeight=${linkHeight.toFixed(4)}m, linkRadius=${linkRadius.toFixed(4)}m`)

    // 创建所有链节
    for (let i = 0; i < this.config.segmentCount; i++) {
      // 创建视觉网格
      const segment = this.stlLoader.createLinkMesh(material)
      segment.scale.setScalar(this.config.linkScale)
      segment.name = `tail-segment-${i}`
      segment.position.z = i * linkHeight
      
      this.segments.push(segment)
      this.tailGroup.add(segment)
      
      // 创建物理刚体
      const rigidBodyDesc = i === 0
        ? RAPIER.RigidBodyDesc.fixed() // 第一个链节固定
        : RAPIER.RigidBodyDesc.dynamic()
      
      rigidBodyDesc.setTranslation(0, 0, i * linkHeight)
      
      // 设置阻尼（防止过度震荡）
      if (i > 0) {
        rigidBodyDesc.setLinearDamping(0.5)
        rigidBodyDesc.setAngularDamping(2.0)  // 增加角阻尼
      }
      
      const rigidBody = this.world!.createRigidBody(rigidBodyDesc)
      
      // 创建碰撞体（圆柱体近似）
      const colliderDesc = RAPIER.ColliderDesc.cylinder(linkHeight / 2, linkRadius)
      colliderDesc.setDensity(1000)  // 设置密度（kg/m³）
      this.world!.createCollider(colliderDesc, rigidBody)
      
      this.rigidBodies.push(rigidBody)
      
      // 创建球窝关节（连接到上一个链节）
      if (i > 0) {
        const parentBody = this.rigidBodies[i - 1]
        const childBody = rigidBody
        
        // 关节锚点（父链节的顶部 = 子链节的底部）
        const anchor1 = new RAPIER.Vector3(0, 0, linkHeight / 2)
        const anchor2 = new RAPIER.Vector3(0, 0, -linkHeight / 2)
        
        // 创建球窝关节
        const jointParams = RAPIER.JointData.spherical(anchor1, anchor2)
        const joint = this.world!.createImpulseJoint(jointParams, parentBody, childBody, true)
        
        this.joints.push(joint)
      }
    }

    console.log(`Built tail: ${this.segments.length} segments, ${this.joints.length} joints, physics: ${this.physicsEnabled ? 'ON' : 'OFF'}`)
  }

  private startPhysicsLoop(): void {
    const animate = () => {
      if (!this.loaded || !this.world) return
      
      this.updatePhysics()
      this.animationId = requestAnimationFrame(animate)
    }
    
    this.animationId = requestAnimationFrame(animate)
  }

  private updatePhysics(): void {
    if (!this.world) return
    
    // 只有在物理启用时才步进模拟
    if (this.physicsEnabled) {
      // 应用线缆力
      this.applyCableForces()
      
      // 步进物理世界
      this.world.step()
    }
    
    // 始终同步视觉网格
    this.syncMeshes()
  }

  private applyCableForces(): void {
    const enabledHoles = this.config.cableHoles.filter(h => h.enabled)
    if (enabledHoles.length === 0) return
    
    // 对每个链节（除了第一个）应用力
    for (let i = 1; i < this.rigidBodies.length; i++) {
      const body = this.rigidBodies[i]
      
      let totalForceX = 0
      let totalForceY = 0
      
      enabledHoles.forEach(hole => {
        const angleRad = hole.angle * Math.PI / 180
        const force = hole.tension * 5 // 力的大小
        
        totalForceX += Math.cos(angleRad) * force
        totalForceY += Math.sin(angleRad) * force
      })
      
      // 应用力矩（在链节顶部施加力）
      const torque = new RAPIER.Vector3(totalForceY, -totalForceX, 0)
      body.applyTorqueImpulse(torque, true)
    }
  }

  private syncMeshes(): void {
    // 同步每个视觉网格和物理刚体的位置/旋转
    this.segments.forEach((segment, i) => {
      const body = this.rigidBodies[i]
      const translation = body.translation()
      const rotation = body.rotation()
      
      segment.position.set(translation.x, translation.y, translation.z)
      segment.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
      
      // 调试：打印前3个链节的位置
      if (i < 3) {
        console.log(`Segment ${i}: pos=(${translation.x.toFixed(3)}, ${translation.y.toFixed(3)}, ${translation.z.toFixed(3)})`)
      }
    })
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

  resetJoints(): void {
    // 重置所有刚体的速度和位置
    const linkHeight = this.config.dimensions.totalHeight * this.config.linkScale / 1000
    
    this.rigidBodies.forEach((body, i) => {
      body.setTranslation(new RAPIER.Vector3(0, 0, i * linkHeight), true)
      body.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true)
      body.setLinvel(new RAPIER.Vector3(0, 0, 0), true)
      body.setAngvel(new RAPIER.Vector3(0, 0, 0), true)
    })
  }

  /**
   * 启用/禁用物理模拟
   */
  setPhysicsEnabled(enabled: boolean): void {
    this.physicsEnabled = enabled
    console.log(`Physics simulation: ${enabled ? 'ENABLED' : 'DISABLED'}`)
    
    if (!enabled) {
      // 禁用物理时，重置到初始位置
      this.resetJoints()
    }
  }

  /**
   * 获取物理模拟状态
   */
  isPhysicsEnabled(): boolean {
    return this.physicsEnabled
  }

  rebuild(config: Partial<TailConfig>): void {
    this.config = { ...this.config, ...config }
    if (this.loaded && this.world) {
      // 清除旧的物理对象
      this.rigidBodies.forEach(body => this.world!.removeRigidBody(body))
      this.buildTail()
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

  isLoaded(): boolean {
    return this.loaded
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    // 清除物理世界
    if (this.world) {
      this.rigidBodies.forEach(body => this.world!.removeRigidBody(body))
      this.world.free()
      this.world = null
    }
    
    // 清除视觉网格
    this.segments.forEach(segment => {
      segment.geometry.dispose()
      if (Array.isArray(segment.material)) {
        segment.material.forEach(mat => mat.dispose())
      } else {
        segment.material.dispose()
      }
      this.tailGroup.remove(segment)
    })
    
    this.segments = []
    this.rigidBodies = []
    this.joints = []
    this.scene.remove(this.tailGroup)
  }
}

export function createPresetConfig(preset: 'straight' | 'curved' | 'spiral'): Partial<TailConfig> {
  const baseConfig: Partial<TailConfig> = { segmentCount: 6 }

  switch (preset) {
    case 'straight':
      return {
        ...baseConfig,
        cableHoles: Array.from({ length: 12 }, (_, i) => ({
          index: i,
          angle: i * 30,
          enabled: false,
          tension: 0,
        })),
      }
    case 'curved':
      return {
        ...baseConfig,
        cableHoles: Array.from({ length: 12 }, (_, i) => ({
          index: i,
          angle: i * 30,
          enabled: i === 0,
          tension: i === 0 ? 0.5 : 0,
        })),
      }
    case 'spiral':
      return {
        ...baseConfig,
        cableHoles: Array.from({ length: 12 }, (_, i) => ({
          index: i,
          angle: i * 30,
          enabled: i === 0 || i === 3 || i === 6 || i === 9,
          tension: (i === 0 || i === 3 || i === 6 || i === 9) ? 0.3 : 0,
        })),
      }
    default:
      return baseConfig
  }
}