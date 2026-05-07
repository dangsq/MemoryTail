import * as THREE from 'three'

/**
 * 尾巴 IK 动画系统
 * 
 * 使用反向运动学（IK）通过控制尾巴尖端位置来驱动整个尾巴的运动
 * 坐标系：X-左右，Y-前后，Z-上下（向下为负）
 */

// ========== 类型定义 ==========

export interface IKJoint {
  position: THREE.Vector3
  rotation: THREE.Euler
  length: number
  maxAngle: number
}

export interface AnimationPreset {
  name: string
  description: string
  amplitude: THREE.Vector3    // 运动幅度 (x, y, z)
  frequency: THREE.Vector3    // 运动频率 (x, y, z)
  phase: THREE.Vector3        // 相位偏移
  pattern: 'sine' | 'circle' | 'figure8' | 'pendulum' | 'spiral'
  speed: number               // 整体速度倍数
}

export interface IKAnimationConfig {
  enabled: boolean
  mode: 'preset' | 'mouse'        // 新增：模式选择
  currentPreset: string
  customAmplitude: THREE.Vector3
  customFrequency: THREE.Vector3
  customSpeed: number
  ikIterations: number        // IK 求解迭代次数
  smoothing: number           // 平滑系数 (0-1)
  mouseTarget: THREE.Vector3  // 新增：鼠标目标位置
}

// ========== 预设动画 ==========

export const animationPresets: Record<string, AnimationPreset> = {
  idle: {
    name: 'Idle',
    description: '待机 - 轻微摇摆',
    amplitude: new THREE.Vector3(0.04, 0.04, 0.02),
    frequency: new THREE.Vector3(0.5, 0.3, 0.4),
    phase: new THREE.Vector3(0, Math.PI / 4, Math.PI / 2),
    pattern: 'sine',
    speed: 1.0,
  },
  
  happy: {
    name: 'Happy',
    description: '开心 - 快速左右摇摆',
    amplitude: new THREE.Vector3(0.15, 0.06, 0.04),
    frequency: new THREE.Vector3(2.0, 1.0, 0.5),
    phase: new THREE.Vector3(0, 0, 0),
    pattern: 'pendulum',
    speed: 2.0,
  },
  
  excited: {
    name: 'Excited',
    description: '兴奋 - 圆周运动',
    amplitude: new THREE.Vector3(0.12, 0.12, 0.06),
    frequency: new THREE.Vector3(1.5, 1.5, 0.8),
    phase: new THREE.Vector3(0, Math.PI / 2, 0),
    pattern: 'circle',
    speed: 1.8,
  },
  
  alert: {
    name: 'Alert',
    description: '警觉 - 向上竖起并轻微抖动',
    amplitude: new THREE.Vector3(0.02, 0.02, 0.10),
    frequency: new THREE.Vector3(3.0, 3.0, 0.2),
    phase: new THREE.Vector3(0, Math.PI / 3, 0),
    pattern: 'sine',
    speed: 1.5,
  },
  
  relaxed: {
    name: 'Relaxed',
    description: '放松 - 缓慢摇摆',
    amplitude: new THREE.Vector3(0.06, 0.04, 0.03),
    frequency: new THREE.Vector3(0.3, 0.2, 0.1),
    phase: new THREE.Vector3(0, Math.PI / 6, 0),
    pattern: 'sine',
    speed: 0.6,
  },
  
  curious: {
    name: 'Curious',
    description: '好奇 - 8字形运动',
    amplitude: new THREE.Vector3(0.10, 0.08, 0.04),
    frequency: new THREE.Vector3(1.0, 2.0, 0.5),
    phase: new THREE.Vector3(0, 0, Math.PI / 4),
    pattern: 'figure8',
    speed: 1.2,
  },
  
  playful: {
    name: 'Playful',
    description: '玩耍 - 螺旋运动',
    amplitude: new THREE.Vector3(0.12, 0.12, 0.08),
    frequency: new THREE.Vector3(1.2, 1.2, 0.8),
    phase: new THREE.Vector3(0, Math.PI / 2, Math.PI / 4),
    pattern: 'spiral',
    speed: 1.5,
  },
  
  nervous: {
    name: 'Nervous',
    description: '紧张 - 快速小幅抖动',
    amplitude: new THREE.Vector3(0.03, 0.03, 0.02),
    frequency: new THREE.Vector3(4.0, 4.5, 3.5),
    phase: new THREE.Vector3(0, Math.PI / 5, Math.PI / 3),
    pattern: 'sine',
    speed: 2.5,
  },
}

// ========== IK 动画控制器 ==========

export class TailIKAnimationController {
  private joints: IKJoint[] = []
  private config: IKAnimationConfig
  private time: number = 0
  private basePosition: THREE.Vector3
  private targetPosition: THREE.Vector3
  private currentTargetPosition: THREE.Vector3
  private tailLength: number = 0

  constructor(
    segmentCount: number,
    linkLength: number,
    basePosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    maxJointAngle: number = 45
  ) {
    this.basePosition = basePosition.clone()
    this.targetPosition = new THREE.Vector3()
    this.currentTargetPosition = new THREE.Vector3()
    
    this.config = {
      enabled: true,  // 默认启用动画
      mode: 'preset',
      currentPreset: 'idle',
      customAmplitude: new THREE.Vector3(0.05, 0.05, 0.02),
      customFrequency: new THREE.Vector3(1.0, 1.0, 0.5),
      customSpeed: 1.0,
      ikIterations: 10,
      smoothing: 0.15,
      mouseTarget: new THREE.Vector3(0, 0, -this.tailLength),
    }

    this.initializeJoints(segmentCount, linkLength, maxJointAngle)
  }

  private initializeJoints(segmentCount: number, linkLength: number, maxJointAngle: number): void {
    this.joints = []
    this.tailLength = 0

    const maxAngleRad = maxJointAngle * Math.PI / 180

    for (let i = 0; i < segmentCount; i++) {
      const joint: IKJoint = {
        position: new THREE.Vector3(
          this.basePosition.x,
          this.basePosition.y,
          this.basePosition.z + linkLength * i  // linkLength 已经是负值，所以用加法
        ),
        rotation: new THREE.Euler(0, 0, 0),
        length: linkLength,
        maxAngle: maxAngleRad,
      }
      this.joints.push(joint)
      this.tailLength += Math.abs(linkLength)  // 累加绝对值作为总长度
    }

    // 初始化目标位置为尾巴末端
    const lastJoint = this.joints[this.joints.length - 1]
    this.targetPosition.copy(lastJoint.position)
    this.currentTargetPosition.copy(lastJoint.position)
  }

  /**
   * 更新动画
   */
  update(deltaTime: number): void {
    if (!this.config.enabled) return

    this.time += deltaTime

    // 根据当前预设计算目标位置
    this.updateTargetPosition()

    // 使用 IK 求解关节角度
    this.solveIK()
  }

  /**
   * 根据预设计算目标位置
   */
  private updateTargetPosition(): void {
    if (this.config.mode === 'mouse') {
      // 鼠标跟随模式：直接使用鼠标目标位置
      this.targetPosition.copy(this.config.mouseTarget)
    } else {
      // 预设情绪模式：使用程序化动画
      const preset = animationPresets[this.config.currentPreset]
      if (!preset) return

      const t = this.time * preset.speed

      // 计算尾巴末端的自然位置（直线向下）
      // tailLength 是正值，所以要减去它让尾巴向下
      const naturalEndPos = new THREE.Vector3(
        this.basePosition.x,
        this.basePosition.y,
        this.basePosition.z - this.tailLength
      )

      // 根据不同的运动模式计算偏移
      const offset = new THREE.Vector3()

      switch (preset.pattern) {
        case 'sine':
          // 正弦波运动
          offset.x = preset.amplitude.x * Math.sin(t * preset.frequency.x + preset.phase.x)
          offset.y = preset.amplitude.y * Math.sin(t * preset.frequency.y + preset.phase.y)
          offset.z = preset.amplitude.z * Math.sin(t * preset.frequency.z + preset.phase.z)
          break

        case 'circle':
          // 圆周运动
          offset.x = preset.amplitude.x * Math.cos(t * preset.frequency.x)
          offset.y = preset.amplitude.y * Math.sin(t * preset.frequency.y)
          offset.z = preset.amplitude.z * Math.sin(t * preset.frequency.z + preset.phase.z)
          break

        case 'figure8':
          // 8字形运动
          offset.x = preset.amplitude.x * Math.sin(t * preset.frequency.x)
          offset.y = preset.amplitude.y * Math.sin(t * preset.frequency.y * 2)
          offset.z = preset.amplitude.z * Math.sin(t * preset.frequency.z + preset.phase.z)
          break

        case 'pendulum':
          // 钟摆运动（主要在 X 轴）
          const pendulumAngle = preset.amplitude.x * Math.sin(t * preset.frequency.x)
          offset.x = pendulumAngle
          offset.y = preset.amplitude.y * Math.sin(t * preset.frequency.y + preset.phase.y)
          offset.z = preset.amplitude.z * Math.abs(Math.cos(t * preset.frequency.x)) // 摆动时略微抬起
          break

        case 'spiral':
          // 螺旋运动
          const spiralT = t * preset.frequency.x
          const radius = preset.amplitude.x * (1 + 0.3 * Math.sin(t * preset.frequency.z))
          offset.x = radius * Math.cos(spiralT)
          offset.y = radius * Math.sin(spiralT)
          offset.z = preset.amplitude.z * Math.sin(t * preset.frequency.z + preset.phase.z)
          break
      }

      // 计算新的目标位置
      this.targetPosition.copy(naturalEndPos).add(offset)
    }

    // 平滑过渡到目标位置
    this.currentTargetPosition.lerp(this.targetPosition, this.config.smoothing)
  }

  /**
   * IK 求解 - 使用 CCD (Cyclic Coordinate Descent) 算法
   */
  private solveIK(): void {
    const iterations = this.config.ikIterations
    const endEffectorIndex = this.joints.length - 1

    for (let iter = 0; iter < iterations; iter++) {
      // 从尾部向头部迭代
      for (let i = endEffectorIndex - 1; i >= 0; i--) {
        const joint = this.joints[i]
        const endEffector = this.joints[endEffectorIndex].position

        // 第一个关节位置固定
        if (i === 0) {
          joint.position.copy(this.basePosition)
          continue
        }

        // 计算从当前关节到末端和到目标的向量
        const toEnd = new THREE.Vector3().subVectors(endEffector, joint.position)
        const toTarget = new THREE.Vector3().subVectors(this.currentTargetPosition, joint.position)

        // 如果已经很接近目标，跳过
        const distanceToTarget = toEnd.distanceTo(toTarget)
        if (distanceToTarget < 0.001) continue

        toEnd.normalize()
        toTarget.normalize()

        // 计算旋转轴和角度
        const rotationAxis = new THREE.Vector3().crossVectors(toEnd, toTarget)
        let rotationAngle = Math.acos(Math.max(-1, Math.min(1, toEnd.dot(toTarget))))

        // 严格限制旋转角度，防止过度弯曲
        const maxRotationPerIteration = joint.maxAngle * 0.3  // 每次迭代最多旋转 30% 的最大角度
        rotationAngle = Math.min(rotationAngle, maxRotationPerIteration)

        if (rotationAxis.length() > 0.001 && rotationAngle > 0.001) {
          rotationAxis.normalize()

          // 创建旋转矩阵
          const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle)

          // 旋转所有后续关节
          for (let j = i + 1; j <= endEffectorIndex; j++) {
            const relativePos = new THREE.Vector3().subVectors(this.joints[j].position, joint.position)
            relativePos.applyQuaternion(quaternion)
            this.joints[j].position.copy(joint.position).add(relativePos)
          }

          // 更新关节旋转（累积）
          const euler = new THREE.Euler().setFromQuaternion(quaternion)
          joint.rotation.x += euler.x
          joint.rotation.y += euler.y
          joint.rotation.z += euler.z

          // 严格限制关节角度范围
          const totalRotation = Math.sqrt(
            joint.rotation.x * joint.rotation.x +
            joint.rotation.y * joint.rotation.y
          )
          
          if (totalRotation > joint.maxAngle) {
            const scale = joint.maxAngle / totalRotation
            joint.rotation.x *= scale
            joint.rotation.y *= scale
          }
        }
      }
      
      // 每次迭代后强制约束
      this.enforceConstraints()
    }
  }

  /**
   * 强制约束 - 确保每个链节保持固定长度，防止打结
   */
  private enforceConstraints(): void {
    // 前向传递：从根部到末端，确保每个链节长度正确
    for (let i = 1; i < this.joints.length; i++) {
      const parent = this.joints[i - 1]
      const current = this.joints[i]

      const direction = new THREE.Vector3().subVectors(current.position, parent.position)
      const currentDistance = direction.length()

      // 如果距离不对，强制修正
      if (Math.abs(currentDistance - Math.abs(current.length)) > 0.0001) {
        if (currentDistance > 0.0001) {
          direction.normalize()
          // 使用绝对值确保长度正确
          current.position.copy(parent.position).add(direction.multiplyScalar(Math.abs(current.length)))
        } else {
          // 如果两个关节重叠，给一个默认方向（向下）
          current.position.copy(parent.position)
          current.position.z += current.length  // length 是负值，所以向下
        }
      }
    }
    
    // 反向传递：从末端到根部，再次确保约束
    for (let i = this.joints.length - 2; i >= 1; i--) {
      const current = this.joints[i]
      const child = this.joints[i + 1]
      
      const direction = new THREE.Vector3().subVectors(current.position, child.position)
      const currentDistance = direction.length()
      
      if (Math.abs(currentDistance - Math.abs(child.length)) > 0.0001) {
        if (currentDistance > 0.0001) {
          direction.normalize()
          current.position.copy(child.position).add(direction.multiplyScalar(Math.abs(child.length)))
        }
      }
    }
    
    // 确保第一个关节始终固定
    this.joints[0].position.copy(this.basePosition)
  }

  /**
   * 获取关节旋转数据（用于渲染）
   */
  getJointRotations(): THREE.Euler[] {
    return this.joints.map(joint => joint.rotation.clone())
  }

  /**
   * 获取关节位置数据（用于调试）
   */
  getJointPositions(): THREE.Vector3[] {
    return this.joints.map(joint => joint.position.clone())
  }

  /**
   * 设置预设动画
   */
  setPreset(presetName: string): void {
    if (animationPresets[presetName]) {
      this.config.currentPreset = presetName
      console.log('IK Controller: Preset set to', presetName)
    } else {
      console.warn('IK Controller: Invalid preset name:', presetName)
    }
  }

  /**
   * 设置模式
   */
  setMode(mode: 'preset' | 'mouse'): void {
    this.config.mode = mode
  }

  /**
   * 设置鼠标目标位置（世界坐标）
   */
  setMouseTarget(position: THREE.Vector3): void {
    this.config.mouseTarget.copy(position)
  }

  /**
   * 启用/禁用动画
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    if (!enabled) {
      // 重置到自然位置
      this.resetToNaturalPose()
    }
  }

  /**
   * 重置到自然姿态
   */
  private resetToNaturalPose(): void {
    for (let i = 0; i < this.joints.length; i++) {
      this.joints[i].rotation.set(0, 0, 0)
      // linkLength 是负值，用加法让尾巴向下
      this.joints[i].position.set(
        this.basePosition.x,
        this.basePosition.y,
        this.basePosition.z + this.joints[i].length * i
      )
    }
  }

  /**
   * 获取配置
   */
  getConfig(): IKAnimationConfig {
    return this.config
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<IKAnimationConfig>): void {
    Object.assign(this.config, config)
  }

  /**
   * 重新初始化（当链节数量或长度改变时）
   */
  reinitialize(segmentCount: number, linkLength: number, maxJointAngle: number): void {
    this.initializeJoints(segmentCount, linkLength, maxJointAngle)
    this.time = 0
  }

  /**
   * 设置基础位置
   */
  setBasePosition(position: THREE.Vector3): void {
    this.basePosition.copy(position)
    this.joints[0].position.copy(position)
  }

  /**
   * 获取当前目标位置（用于调试可视化）
   */
  getCurrentTargetPosition(): THREE.Vector3 {
    return this.currentTargetPosition.clone()
  }
}
