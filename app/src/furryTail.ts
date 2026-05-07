import * as THREE from 'three'

/**
 * 毛茸茸尾巴效果
 * 
 * 使用实例化几何体创建大量毛发，实现毛茸茸的视觉效果
 */

export interface FurryTailConfig {
  furDensity: number        // 毛发密度（每个链节的毛发数量）
  furLength: number         // 毛发长度
  furThickness: number      // 毛发粗细
  furColor: THREE.Color     // 毛发颜色
  furRoughness: number      // 粗糙度
  furMetalness: number      // 金属度
}

export const defaultFurryConfig: FurryTailConfig = {
  furDensity: 500,          // 500 根/链节，超级密集
  furLength: 0.025,         // 2.5cm
  furThickness: 0.0008,     // 0.8mm
  furColor: new THREE.Color('#FFD4A3'),  // 温暖的杏色/奶油色
  furRoughness: 0.95,       // 非常粗糙
  furMetalness: 0.0,        // 完全不反光
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
      for (let f = 0; f < this.furPerSegment; f++) {
        // 在圆盘表面随机分布
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 0.018  // 增加到 1.8cm，更大的分布范围
        
        // Z 轴偏移：在链节的前后都分布毛发
        const zOffset = (Math.random() - 0.5) * 0.015  // ±7.5mm，覆盖链节长度
        
        const localOffset = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          zOffset  // 添加 Z 轴偏移
        )
        
        // 毛发方向：从圆盘表面向外辐射，增加随机倾斜
        const radialAngle = Math.atan2(localOffset.y, localOffset.x)
        const tiltAngle = (Math.random() - 0.5) * 0.7  // 增加到 ±40度，非常蓬松
        const tiltAngle2 = (Math.random() - 0.5) * 0.7
        
        const localRotation = new THREE.Euler(
          tiltAngle,
          tiltAngle2,
          radialAngle
        )
        
        // 弯曲因子：毛发末端会随运动弯曲
        const bendFactor = 0.2 + Math.random() * 0.5  // 0.2-0.7，更多变化
        
        this.furData.push({
          segmentIndex: seg,
          localOffset,
          localRotation,
          bendFactor,
        })
      }
      
      // 在链节末端添加额外的毛发（红色区域）
      if (seg === this.segmentCount - 1) {
        // 最后一个链节，添加更多末端毛发
        for (let f = 0; f < this.furPerSegment * 0.5; f++) {
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * 0.02  // 更大的半径
          
          // 集中在链节末端
          const zOffset = 0.01 + Math.random() * 0.01  // 10-20mm，末端位置
          
          const localOffset = new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            zOffset
          )
          
          const radialAngle = Math.atan2(localOffset.y, localOffset.x)
          const tiltAngle = (Math.random() - 0.5) * 0.8  // 更大的倾斜
          const tiltAngle2 = (Math.random() - 0.5) * 0.8
          
          const localRotation = new THREE.Euler(
            tiltAngle,
            tiltAngle2,
            radialAngle
          )
          
          const bendFactor = 0.3 + Math.random() * 0.4
          
          this.furData.push({
            segmentIndex: seg,
            localOffset,
            localRotation,
            bendFactor,
          })
        }
      }
    }
  }

  /**
   * 创建毛发网格
   */
  private createFurMesh(): void {
    // 创建单根毛发的几何体（圆锥形）
    const furGeometry = new THREE.ConeGeometry(
      this.config.furThickness,      // 底部半径
      this.config.furLength,          // 高度
      3,                              // 3个面（三角形截面，性能更好）
      1                               // 1个高度段
    )
    
    // 调整几何体，让底部在原点，顶部向上
    furGeometry.translate(0, this.config.furLength / 2, 0)
    
    // 创建毛发材质
    const furMaterial = new THREE.MeshStandardMaterial({
      color: this.config.furColor,
      roughness: this.config.furRoughness,
      metalness: this.config.furMetalness,
      side: THREE.DoubleSide,
      flatShading: true,  // 平面着色，更有毛发质感
    })
    
    // 创建实例化网格
    this.furMesh = new THREE.InstancedMesh(
      furGeometry,
      furMaterial,
      this.totalFurs
    )
    
    this.furMesh.castShadow = true
    this.furMesh.receiveShadow = true
    
    // 初始化所有实例的变换矩阵
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < this.totalFurs; i++) {
      matrix.identity()
      this.furMesh.setMatrixAt(i, matrix)
    }
    
    this.furMesh.instanceMatrix.needsUpdate = true
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
      this.furMesh.material.color.copy(this.config.furColor)
      this.furMesh.material.roughness = this.config.furRoughness
      this.furMesh.material.metalness = this.config.furMetalness
      this.furMesh.material.needsUpdate = true
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
