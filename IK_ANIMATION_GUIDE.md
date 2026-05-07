# 尾巴 IK 动画系统使用指南

## 🎯 概述

新增的 IK（反向运动学）动画系统允许通过控制尾巴尖端的目标位置来驱动整个尾巴的运动，实现自然流畅的动画效果。

## 🚀 快速开始

### 启动项目

```bash
cd app
npm run dev
```

访问：http://localhost:5175/MemoryTail/

### 启用 IK 动画

1. 导航到最后一页（3D 交互页面）
2. 在右侧 GUI 面板中找到 **🎭 IK Animation** 文件夹
3. 勾选 **Enable Animation** 开关
4. 选择一个预设动画（如 "happy"）
5. 观察尾巴开始运动！

---

## 📋 预设动画列表

### 1. **Idle（待机）**
- **描述**：轻微摇摆，适合待机状态
- **特点**：小幅度、慢速度、自然
- **参数**：
  - 幅度：X=0.02m, Y=0.02m, Z=0.01m
  - 频率：X=0.5Hz, Y=0.3Hz, Z=0.4Hz
  - 速度：1.0x

### 2. **Happy（开心）**
- **描述**：快速左右摇摆，像狗狗高兴时摇尾巴
- **特点**：大幅度、高频率、钟摆运动
- **参数**：
  - 幅度：X=0.08m, Y=0.03m, Z=0.02m
  - 频率：X=2.0Hz, Y=1.0Hz, Z=0.5Hz
  - 速度：2.0x

### 3. **Excited（兴奋）**
- **描述**：圆周运动，表达兴奋激动
- **特点**：圆形轨迹、中等速度
- **参数**：
  - 幅度：X=0.06m, Y=0.06m, Z=0.03m
  - 频率：X=1.5Hz, Y=1.5Hz, Z=0.8Hz
  - 速度：1.8x
  - 模式：circle（圆周）

### 4. **Alert（警觉）**
- **描述**：向上竖起并轻微抖动
- **特点**：Z轴向上、高频抖动
- **参数**：
  - 幅度：X=0.01m, Y=0.01m, Z=0.05m
  - 频率：X=3.0Hz, Y=3.0Hz, Z=0.2Hz
  - 速度：1.5x

### 5. **Relaxed（放松）**
- **描述**：缓慢下垂摇摆，表达放松状态
- **特点**：Z轴向下、慢速度
- **参数**：
  - 幅度：X=0.03m, Y=0.02m, Z=-0.04m
  - 频率：X=0.3Hz, Y=0.2Hz, Z=0.1Hz
  - 速度：0.6x

### 6. **Curious（好奇）**
- **描述**：8字形运动，表达探索好奇
- **特点**：8字轨迹、中等速度
- **参数**：
  - 幅度：X=0.05m, Y=0.04m, Z=0.02m
  - 频率：X=1.0Hz, Y=2.0Hz, Z=0.5Hz
  - 速度：1.2x
  - 模式：figure8（8字形）

### 7. **Playful（玩耍）**
- **描述**：螺旋运动，表达玩耍嬉戏
- **特点**：螺旋轨迹、动态半径
- **参数**：
  - 幅度：X=0.06m, Y=0.06m, Z=0.04m
  - 频率：X=1.2Hz, Y=1.2Hz, Z=0.8Hz
  - 速度：1.5x
  - 模式：spiral（螺旋）

### 8. **Nervous（紧张）**
- **描述**：快速小幅抖动，表达紧张不安
- **特点**：小幅度、高频率
- **参数**：
  - 幅度：X=0.015m, Y=0.015m, Z=0.01m
  - 频率：X=4.0Hz, Y=4.5Hz, Z=3.5Hz
  - 速度：2.5x

---

## 🎛️ GUI 控制面板详解

### 基础控制

#### **Enable Animation**
- 开关 IK 动画系统
- 关闭时恢复到线缆驱动模式

#### **Preset**
- 下拉菜单选择预设动画
- 8 种情绪预设可选

#### **Speed**
- 范围：0.1 - 3.0
- 控制整体动画速度
- 默认：1.0

#### **Smoothing**
- 范围：0.01 - 0.5
- 控制运动的平滑度
- 值越小越灵敏，越大越平滑
- 默认：0.15

#### **IK Iterations**
- 范围：1 - 20
- IK 算法的迭代次数
- 值越大越精确，但计算量越大
- 默认：10

### 自定义参数

#### **Amplitude（幅度）**
- **Amplitude X（左右）**：控制左右摆动幅度
- **Amplitude Y（前后）**：控制前后摆动幅度
- **Amplitude Z（上下）**：控制上下摆动幅度
  - 正值：向上
  - 负值：向下

#### **Frequency（频率）**
- **Frequency X**：X 轴运动频率（Hz）
- **Frequency Y**：Y 轴运动频率（Hz）
- **Frequency Z**：Z 轴运动频率（Hz）

---

## 🔧 技术原理

### IK 算法：CCD (Cyclic Coordinate Descent)

1. **目标位置计算**：根据预设和时间计算尾巴尖端的目标位置
2. **反向求解**：从尾部向头部迭代，计算每个关节需要的旋转
3. **约束应用**：限制关节角度在最大角度范围内
4. **长度保持**：确保每个链节保持固定长度

### 运动模式

#### **Sine（正弦波）**
```
offset.x = amplitude.x * sin(t * frequency.x + phase.x)
offset.y = amplitude.y * sin(t * frequency.y + phase.y)
offset.z = amplitude.z * sin(t * frequency.z + phase.z)
```

#### **Circle（圆周）**
```
offset.x = amplitude.x * cos(t * frequency.x)
offset.y = amplitude.y * sin(t * frequency.y)
```

#### **Figure8（8字形）**
```
offset.x = amplitude.x * sin(t * frequency.x)
offset.y = amplitude.y * sin(t * frequency.y * 2)
```

#### **Pendulum（钟摆）**
```
angle = amplitude.x * sin(t * frequency.x)
offset.x = angle
offset.z = amplitude.z * abs(cos(t * frequency.x))
```

#### **Spiral（螺旋）**
```
radius = amplitude.x * (1 + 0.3 * sin(t * frequency.z))
offset.x = radius * cos(t * frequency.x)
offset.y = radius * sin(t * frequency.x)
```

---

## 🎨 坐标系说明

```
        Z (上)
        ↑
        |
        |
        +----→ Y (前)
       /
      /
     X (右)
```

- **X 轴**：左右方向（正方向为右）
- **Y 轴**：前后方向（正方向为前）
- **Z 轴**：上下方向（正方向为上，尾巴向下生长为负）

### 第一个关节位置固定

- 第一个链节（根部）的位置始终固定在安装座底部
- IK 算法只控制后续关节的旋转
- 这确保了尾巴始终连接在机器狗身上

---

## 💡 使用技巧

### 1. 调整情绪表达

**让尾巴更开心**：
- 增加 Speed（2.0 - 3.0）
- 增加 Amplitude X（0.08 - 0.12）
- 使用 "happy" 或 "excited" 预设

**让尾巴更放松**：
- 减少 Speed（0.5 - 0.8）
- 增加 Smoothing（0.3 - 0.5）
- 使用 "relaxed" 预设

**让尾巴更警觉**：
- 增加 Amplitude Z（0.05 - 0.08）
- 增加 Frequency（3.0 - 5.0）
- 使用 "alert" 预设

### 2. 创建自定义动画

1. 选择一个接近的预设作为基础
2. 在 "Custom Parameters" 中调整参数
3. 实时观察效果
4. 记录满意的参数组合

### 3. 性能优化

**如果动画卡顿**：
- 减少 IK Iterations（5 - 8）
- 减少 Segment Count（6 - 10）
- 关闭 Skin（毛皮）

**如果动画不够精确**：
- 增加 IK Iterations（15 - 20）
- 减少 Smoothing（0.05 - 0.1）

---

## 🔄 与线缆驱动的切换

### IK 动画模式
- 启用：勾选 "Enable Animation"
- 特点：自动运动、预设情绪、程序化
- 适用：展示、演示、情感表达

### 线缆驱动模式
- 启用：取消勾选 "Enable Animation"
- 特点：手动控制、精确调整、物理模拟
- 适用：调试、精确控制、物理测试

**两种模式互斥**：启用 IK 动画时，线缆控制会被忽略。

---

## 📊 参数推荐值

### 日常待机
```
Preset: idle
Speed: 1.0
Smoothing: 0.2
```

### 迎接主人
```
Preset: happy
Speed: 2.5
Smoothing: 0.1
```

### 探索环境
```
Preset: curious
Speed: 1.2
Smoothing: 0.15
```

### 休息睡觉
```
Preset: relaxed
Speed: 0.5
Smoothing: 0.4
```

### 听到声音
```
Preset: alert
Speed: 1.8
Smoothing: 0.08
```

---

## 🐛 故障排除

### 问题：尾巴不动
- 检查 "Enable Animation" 是否勾选
- 检查 Speed 是否为 0
- 检查 Amplitude 是否过小

### 问题：运动不自然
- 增加 Smoothing（0.2 - 0.4）
- 减少 Frequency
- 增加 IK Iterations

### 问题：尾巴抖动
- 增加 Smoothing
- 减少 IK Iterations
- 检查 Max Joint Angle 是否过小

### 问题：尾巴脱离身体
- 这不应该发生（第一个关节固定）
- 如果发生，请刷新页面重新加载

---

## 🎓 进阶使用

### 组合多个运动

虽然当前系统一次只能使用一个预设，但你可以通过调整自定义参数来组合效果：

```
// 左右摇摆 + 上下起伏
Amplitude X: 0.06  (左右)
Amplitude Y: 0.02  (前后)
Amplitude Z: 0.03  (上下)

Frequency X: 2.0   (快速左右)
Frequency Y: 0.5   (慢速前后)
Frequency Z: 1.0   (中速上下)
```

### 创建节奏感

通过调整不同轴的频率比例：

```
// 2:1 节奏
Frequency X: 2.0
Frequency Y: 1.0

// 3:2 节奏
Frequency X: 3.0
Frequency Y: 2.0
```

---

## 📝 代码集成

如果你想在代码中控制动画：

```typescript
// 获取 IK 控制器
const ikController = tailRenderer.getIKController()

// 启用动画
ikController.setEnabled(true)

// 切换预设
ikController.setPreset('happy')

// 更新配置
ikController.updateConfig({
  customSpeed: 2.0,
  smoothing: 0.15,
  ikIterations: 10
})

// 获取当前配置
const config = ikController.getConfig()
console.log(config)
```

---

## 🎉 总结

IK 动画系统为 Memory Tail 项目增加了生动的情感表达能力。通过 8 种预设动画和丰富的自定义参数，你可以让机器狗的尾巴展现出各种情绪和状态。

**核心优势**：
- ✅ 自然流畅的运动
- ✅ 丰富的情绪表达
- ✅ 实时参数调整
- ✅ 与线缆驱动无缝切换
- ✅ 高性能 IK 算法

享受创作吧！🐕✨
