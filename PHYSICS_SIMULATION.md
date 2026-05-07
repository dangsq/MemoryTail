# 尾巴物理模拟实现说明

## 📐 问题诊断

### 为什么看不到多个关节？

可能的原因：
1. **链节重叠** - 所有链节在同一位置
2. **linkHeight 计算错误** - 链节间距为 0
3. **STL 文件中心点问题** - geometry.center() 可能影响了连接点

### 调试步骤

打开浏览器控制台（F12），查看：
```
Built tail: 6 segments, 5 joints
Updating 6 segments, linkHeight: 0.0208m
Segment 1 pos: (0.000, 0.000, 0.021)
```

如果 linkHeight 是 0 或很小，说明尺寸计算有问题。

---

## 🔧 物理模拟实现原理

### 1. 物理关节（PhysicalJoint）

每个关节模拟一个球窝关节，具有：

```typescript
class PhysicalJoint {
  rotation: THREE.Euler           // 当前旋转角度
  angularVelocity: THREE.Vector3  // 角速度
  maxAngle: number                // 最大转角限制
  damping: number                 // 阻尼系数 (0.95)
  stiffness: number               // 弹簧刚度 (0.1)
}
```

### 2. 力矩计算

**线缆张力 → 力矩**

```typescript
// 对于每个启用的线孔
enabledHoles.forEach(hole => {
  const angleRad = hole.angle * Math.PI / 180  // 线孔角度
  const force = hole.tension * 10              // 张力 × 放大系数
  
  // 分解为两个轴的力矩
  totalTorqueX += Math.sin(angleRad) * force   // Pitch (前后)
  totalTorqueY += Math.cos(angleRad) * force   // Yaw (左右)
})

torque = new THREE.Vector3(totalTorqueX, totalTorqueY, 0)
```

**示例：**
- 线孔 0 (0°)：向前拉 → torqueY = +force
- 线孔 3 (90°)：向右拉 → torqueX = +force
- 线孔 6 (180°)：向后拉 → torqueY = -force

### 3. 物理更新循环

每帧（60 FPS）执行：

```typescript
updatePhysics(deltaTime) {
  // 1. 计算所有线缆产生的力矩
  cableTorques = calculateCableTorques()
  
  // 2. 对每个关节
  joints.forEach((joint, i) => {
    // 2a. 应用线缆力矩
    joint.applyTorque(cableTorques[i], deltaTime)
    
    // 2b. 应用弹簧恢复力
    joint.applySpringForce(deltaTime)
  })
  
  // 3. 更新链节位置
  updateTailPose()
}
```

### 4. 力矩应用（欧拉积分）

```typescript
applyTorque(torque, deltaTime) {
  // 更新角速度：ω = ω + τ·Δt
  angularVelocity += torque * deltaTime
  
  // 应用阻尼：ω = ω × damping
  angularVelocity *= 0.95
  
  // 更新角度：θ = θ + ω·Δt
  rotation.x += angularVelocity.x * deltaTime
  rotation.y += angularVelocity.y * deltaTime
  
  // 限制角度：θ ∈ [-maxAngle, maxAngle]
  rotation.x = clamp(rotation.x, -maxAngle, maxAngle)
  rotation.y = clamp(rotation.y, -maxAngle, maxAngle)
}
```

### 5. 弹簧恢复力

```typescript
applySpringForce(deltaTime) {
  // 胡克定律：F = -k·x
  restoreTorque = new Vector3(
    -rotation.x * stiffness,  // 与偏移成正比
    -rotation.y * stiffness,  // 方向相反
    -rotation.z * stiffness
  )
  
  applyTorque(restoreTorque, deltaTime)
}
```

**效果：**
- 关节偏离中心 → 产生恢复力
- 释放张力 → 尾巴缓慢回到直线

### 6. 链节位置更新（正向运动学）

```typescript
updateTailPose() {
  segments.forEach((segment, i) => {
    if (i === 0) {
      // 第一个链节固定
      segment.position = (0, 0, 0)
      segment.rotation = (0, 0, 0)
    } else {
      // 计算连接点（父链节的球头位置）
      connectionPoint = (0, 0, linkHeight)
      connectionPoint.applyRotation(parent.rotation)
      connectionPoint += parent.position
      
      // 当前链节的球窝对准父链节的球头
      segment.position = connectionPoint
      
      // 继承父节点旋转 + 关节旋转
      segment.rotation = parent.rotation + joint.rotation
    }
  })
}
```

---

## 🎯 物理参数调优

### 当前参数

```typescript
damping: 0.95      // 阻尼（越小衰减越快）
stiffness: 0.1     // 弹簧刚度（越大恢复越快）
maxAngle: 35°      // 最大转角
force: tension × 10 // 力的放大倍数
```

### 调整建议

**如果尾巴太软（晃动太多）：**
- 增加 `damping` → 0.98
- 增加 `stiffness` → 0.2

**如果尾巴太硬（反应慢）：**
- 减少 `damping` → 0.90
- 减少 `stiffness` → 0.05
- 增加 `force multiplier` → 20

**如果尾巴弯曲不够：**
- 增加 `maxAngle` → 45°
- 增加 `force multiplier` → 15

---

## 🔍 调试技巧

### 1. 检查链节数量
```javascript
console.log(`Segments: ${segments.length}, Joints: ${joints.length}`)
// 应该是：Segments: 6, Joints: 5
```

### 2. 检查链节位置
```javascript
segments.forEach((seg, i) => {
  console.log(`Segment ${i}: ${seg.position.toArray()}`)
})
// 应该看到 z 坐标递增
```

### 3. 检查关节角度
```javascript
joints.forEach((joint, i) => {
  console.log(`Joint ${i}: x=${joint.rotation.x}, y=${joint.rotation.y}`)
})
// 启用线缆后应该看到角度变化
```

### 4. 检查力矩
```javascript
const torques = calculateCableTorques()
console.log('Torques:', torques)
// 启用线缆后应该看到非零力矩
```

---

## 🚀 下一步

1. **启动开发服务器**：
   ```bash
   cd app && npm run dev
   ```

2. **打开浏览器控制台**，查看调试信息

3. **测试**：
   - 启用一个线孔，设置 tension = 0.5
   - 观察控制台输出
   - 观察尾巴是否弯曲

4. **如果链节重叠**，可能需要调整 `linkScale` 或检查 STL 文件的尺寸
