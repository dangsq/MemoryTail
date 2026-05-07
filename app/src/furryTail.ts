import * as THREE from 'three'

/**
 * 毛茸茸尾巴效果
 * 
 * 使用实例化几何体创建大量毛发，实现毛茸茸的视觉效果
 */

export interface FurryTailConfig {
  furDensity: number
  furLength: number
  furThickness: number
  furColor: THREE.Color
  furColor2: THREE.Color
  furRoughness: number
  furMetalness: number
}

export const defaultFurryConfig: FurryTailConfig = {
  furDensity: 500,
  furLength: 0.025,
  furThickness: 0.0008,
  furColor: new THREE.Color('#FFFFFF'),
  furColor2: new THREE.Color('#000000'),
  furRoughness: 0.95,
  furMetalness: 0.0,
}

export class FurryTailRenderer {
  private furMesh: THREE.InstancedMesh | null = null
  private config: FurryTailConfig
  private segmentCount: number
  private furPerSegment: number
  private totalFurs: number
  
  // 存储每根毛发的基础信息
  private furData: Array<{
    segmentIndex: number
    localOffset: THREE.Vector3
    localRotation: THREE.Euler
    bendFactor: number
    colorMix: number
  }> = []

  constructor(segmentCount: number, config: FurryTailConfig = defaultFurryConfig) {
    this.config = config
    this.segmentCount = segmentCount
    this.furPerSegment = config.furDensity
    this.totalFurs = segmentCount * this.furPerSegment
    
    this.initializeFurData()
    this.createFurMesh()
  }

  /**
   * 初始化毛发数据
   */
  private initializeFurData(): void {
    this.furData = []

    for (let seg = 0; seg < this.segmentCount; seg++) {
      const sectorCount = 10
      const sectors: number[] = []
      for (let s = 0; s < sectorCount; s++) {
        sectors.push(Math.random() < 0.3 ? 1 : 0)
      }

      for (let f = 0; f < this.furPerSegment; f++) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 0.018
        const zOffset = (Math.random() - 0.5) * 0.015

        const localOffset = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          zOffset
        )

        const baseTilt = -Math.PI / 2
        const randomTilt = (Math.random() - 0.5) * 0.5
        const sidewaysTilt = (Math.random() - 0.5) * 0.3
        const outwardTilt = Math.random() * 0.2

        const localRotation = new THREE.Euler(
          baseTilt + randomTilt,
          sidewaysTilt,
          outwardTilt
        )

        const sectorIndex = Math.floor((angle / (Math.PI * 2)) * sectorCount) % sectorCount
        const colorMix = sectors[sectorIndex]

        const bendFactor = 0.2 + Math.random() * 0.5

        this.furData.push({
          segmentIndex: seg,
          localOffset,
          localRotation,
          bendFactor,
          colorMix,
        })
      }

      if (seg === this.segmentCount - 1) {
        for (let f = 0; f < this.furPerSegment * 0.5; f++) {
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * 0.02
          const zOffset = 0.01 + Math.random() * 0.01

          const localOffset = new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            zOffset
          )

          const baseTilt = -Math.PI / 2
          const randomTilt = (Math.random() - 0.5) * 0.6
          const sidewaysTilt = (Math.random() - 0.5) * 0.35
          const outwardTilt = Math.random() * 0.25

          const localRotation = new THREE.Euler(
            baseTilt + randomTilt,
            sidewaysTilt,
            outwardTilt
          )

          const sectorIndex = Math.floor((angle / (Math.PI * 2)) * sectorCount) % sectorCount
          const colorMix = sectors[sectorIndex]

          const bendFactor = 0.3 + Math.random() * 0.4

          this.furData.push({
            segmentIndex: seg,
            localOffset,
            localRotation,
            bendFactor,
            colorMix,
          })
        }
      }
    }
  }

  /**
   * 创建毛发网格
   */
  private createFurMesh(): void {
    const furGeometry = this.createCurvedFurGeometry(
      this.config.furLength,
      this.config.furThickness * 1.5,
      this.config.furThickness * 0.1,
      0.35
    )

    const furMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: this.config.furRoughness,
      metalness: this.config.furMetalness,
      side: THREE.DoubleSide,
      flatShading: true,
    })

    this.furMesh = new THREE.InstancedMesh(
      furGeometry,
      furMaterial,
      this.totalFurs
    )

    this.furMesh.castShadow = true
    this.furMesh.receiveShadow = true

    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    for (let i = 0; i < this.totalFurs; i++) {
      matrix.identity()
      this.furMesh.setMatrixAt(i, matrix)

      const mix = this.furData[i]?.colorMix ?? Math.random()
      color.copy(this.config.furColor).lerp(this.config.furColor2, mix)
      this.furMesh.setColorAt(i, color)
    }

    this.furMesh.instanceMatrix.needsUpdate = true
    if (this.furMesh.instanceColor) {
      this.furMesh.instanceColor.needsUpdate = true
    }
  }

  private createCurvedFurGeometry(
    length: number, baseRadius: number, tipRadius: number, curlFactor: number
  ): THREE.BufferGeometry {
    const heightSegs = 6
    const radialSegs = 3
    const pos: number[] = []
    const idx: number[] = []
    const nrm: number[] = []

    for (let i = 0; i <= heightSegs; i++) {
      const t = i / heightSegs
      const y = t * length
      const curl = Math.sin(t * Math.PI * 0.5) * curlFactor * length
      const r = baseRadius * (1 - t) + tipRadius * t

      for (let j = 0; j <= radialSegs; j++) {
        const a = (j / radialSegs) * Math.PI * 2
        pos.push(curl + r * Math.cos(a), y, r * Math.sin(a))
        nrm.push(Math.cos(a), 0, Math.sin(a))
      }
    }

    for (let i = 0; i < heightSegs; i++) {
      for (let j = 0; j < radialSegs; j++) {
        const a = i * (radialSegs + 1) + j
        const b = a + radialSegs + 1
        const c = a + radialSegs + 2
        const d = a + 1
        idx.push(a, b, d, b, c, d)
      }
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
    g.setIndex(idx)
    return g
  }

  /**
   * 更新毛发位置
   */
  updateFur(
    segmentPositions: THREE.Vector3[], 
    segmentRotations: THREE.Euler[],
    segmentRadii?: number[]  // 新增：每个链节的半径
  ): void {
    if (!this.furMesh || segmentPositions.length === 0) return

    const dummy = new THREE.Object3D()

    this.furData.forEach((data, i) => {
      const segIndex = data.segmentIndex
      
      if (segIndex >= segmentPositions.length) return

      // 获取当前链节的位置和旋转
      const segPos = segmentPositions[segIndex]
      const segRot = segmentRotations[segIndex]

      // 获取当前链节的半径（用于缩放毛发长度）
      const radiusScale = segmentRadii && segIndex < segmentRadii.length 
        ? segmentRadii[segIndex] / 0.01  // 归一化到基础半径 1cm
        : 1.0

      // 设置毛发基础位置（链节位置 + 局部偏移）
      dummy.position.copy(segPos)
      dummy.rotation.copy(segRot)
      
      // 应用局部偏移（根据半径缩放）
      const worldOffset = data.localOffset.clone()
      worldOffset.multiplyScalar(radiusScale)  // 根据半径缩放偏移
      worldOffset.applyEuler(segRot)
      dummy.position.add(worldOffset)

      // 应用毛发方向
      dummy.rotation.x += data.localRotation.x
      dummy.rotation.y += data.localRotation.y
      dummy.rotation.z += data.localRotation.z

      // 根据半径缩放毛发长度
      dummy.scale.set(radiusScale, radiusScale, radiusScale)

      // 如果不是最后一个链节，添加链节间的过渡毛发
      if (segIndex < segmentPositions.length - 1) {
        const nextSegPos = segmentPositions[segIndex + 1]
        const direction = new THREE.Vector3().subVectors(nextSegPos, segPos)
        const distance = direction.length()
        
        // 根据距离调整毛发方向，填充空隙
        if (distance > 0.01) {  // 如果链节间距离较大
          const bendAmount = data.bendFactor * 0.3
          direction.normalize()
          dummy.rotation.x += direction.x * bendAmount
          dummy.rotation.y += direction.y * bendAmount
        }
      }

      // 更新实例矩阵
      dummy.updateMatrix()
      if (this.furMesh) {
        this.furMesh.setMatrixAt(i, dummy.matrix)
      }
    })

    if (this.furMesh) {
      this.furMesh.instanceMatrix.needsUpdate = true
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<FurryTailConfig>): void {
    Object.assign(this.config, config)
    
    // 如果改变了颜色或材质属性，更新材质
    if (this.furMesh && this.furMesh.material instanceof THREE.MeshStandardMaterial) {
      this.furMesh.material.roughness = this.config.furRoughness
      this.furMesh.material.metalness = this.config.furMetalness
      this.furMesh.material.needsUpdate = true

      const color = new THREE.Color()
      for (let i = 0; i < this.totalFurs; i++) {
        const mix = this.furData[i]?.colorMix ?? 0.5
        color.copy(this.config.furColor).lerp(this.config.furColor2, mix)
        this.furMesh.setColorAt(i, color)
      }
      if (this.furMesh.instanceColor) {
        this.furMesh.instanceColor.needsUpdate = true
      }
    }
    
    // 如果改变了密度或长度，需要重新创建
    if (config.furDensity !== undefined || config.furLength !== undefined || config.furThickness !== undefined) {
      this.dispose()
      this.furPerSegment = this.config.furDensity
      this.totalFurs = this.segmentCount * this.furPerSegment
      this.initializeFurData()
      this.createFurMesh()
    }
  }

  /**
   * 重新初始化（当链节数量改变时）
   */
  reinitialize(segmentCount: number): void {
    this.segmentCount = segmentCount
    this.totalFurs = segmentCount * this.furPerSegment
    this.dispose()
    this.initializeFurData()
    this.createFurMesh()
  }

  /**
   * 获取毛发网格
   */
  getMesh(): THREE.InstancedMesh | null {
    return this.furMesh
  }

  /**
   * 销毁资源
   */
  dispose(): void {
    if (this.furMesh) {
      this.furMesh.geometry.dispose()
      if (this.furMesh.material instanceof THREE.Material) {
        this.furMesh.material.dispose()
      }
      this.furMesh = null
    }
    this.furData = []
  }
}
