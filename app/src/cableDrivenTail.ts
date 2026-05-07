import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

/**
 * 基于 STL 的物理驱动尾巴系统
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

export interface TailConfig {
  segmentCount: number
  cableHoles: CableHole[]
  maxJointAngle: number
  linkScale: number
  dimensions: LinkDimensions
  mountingBlock: MountingBlock
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
  maxJointAngle: 45,
  linkScale: 0.002,
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
  private mountingBlock: THREE.Mesh | null = null
  private config: TailConfig
  private loaded: boolean = false
  private animationId: number | null = null
  private lastTime: number = 0

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
    this.segments = []
    this.joints = []

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

    const material = new THREE.MeshStandardMaterial({
      color: 0x4169E1,
      metalness: 0.7,
      roughness: 0.3,
    })

    for (let i = 0; i < this.config.segmentCount; i++) {
      const segment = this.stlLoader.createLinkMesh(material)
      segment.scale.setScalar(this.config.linkScale)
      segment.name = `tail-segment-${i}`
      
      this.segments.push(segment)
      this.tailGroup.add(segment)
      
      if (i > 0) {
        const joint = new PhysicalJoint(this.config.maxJointAngle)
        this.joints.push(joint)
      }
    }

    this.updateTailPose()
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
    const cableTorques = this.calculateCableTorques()
    
    this.joints.forEach((joint, i) => {
      if (cableTorques[i]) {
        joint.applyTorque(cableTorques[i], deltaTime)
      }
      joint.applySpringForce(deltaTime)
    })
    
    this.updateTailPose()
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
    this.config = { ...this.config, ...config }
    if (this.loaded) {
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
