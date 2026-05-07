# 🎭 IK 动画快速参考

## 🚀 快速启动

```bash
cd app && npm run dev
# 访问 http://localhost:5175/MemoryTail/
```

## 📋 8 种预设动画

| 预设 | 描述 | 幅度 | 频率 | 速度 | 适用场景 |
|------|------|------|------|------|----------|
| **idle** | 待机摇摆 | 小 | 慢 | 1.0x | 日常待机 |
| **happy** | 快速摇摆 | 大 | 快 | 2.0x | 迎接主人 |
| **excited** | 圆周运动 | 中 | 中 | 1.8x | 玩耍时刻 |
| **alert** | 竖起抖动 | 小 | 快 | 1.5x | 听到声音 |
| **relaxed** | 缓慢下垂 | 中 | 慢 | 0.6x | 休息睡觉 |
| **curious** | 8字运动 | 中 | 中 | 1.2x | 探索环境 |
| **playful** | 螺旋运动 | 中 | 中 | 1.5x | 嬉戏玩耍 |
| **nervous** | 快速抖动 | 小 | 快 | 2.5x | 紧张不安 |

## 🎛️ 关键参数

### 基础控制
- **Enable Animation**: 开关动画
- **Preset**: 选择预设
- **Speed**: 0.1 - 3.0（整体速度）
- **Smoothing**: 0.01 - 0.5（平滑度）
- **IK Iterations**: 1 - 20（精度）

### 自定义参数
- **Amplitude X/Y/Z**: 运动幅度（米）
- **Frequency X/Y/Z**: 运动频率（Hz）

## 📐 坐标系

```
Z↑ (上)
 |
 +→Y (前)
/
X (右)
```

- X: 左右（正=右）
- Y: 前后（正=前）
- Z: 上下（正=上，尾巴向下=-Z）

## 💡 常用配置

### 日常待机
```
Preset: idle
Speed: 1.0
Smoothing: 0.2
```

### 热情迎接
```
Preset: happy
Speed: 2.5
Smoothing: 0.1
Amplitude X: 0.10
```

### 安静休息
```
Preset: relaxed
Speed: 0.5
Smoothing: 0.4
Amplitude Z: -0.05
```

### 警觉状态
```
Preset: alert
Speed: 1.8
Smoothing: 0.08
Amplitude Z: 0.06
```

## 🔧 性能调优

### 低配置
```
IK Iterations: 5-8
Segment Count: 6-10
Skin: OFF
```

### 高配置
```
IK Iterations: 15-20
Segment Count: 15-20
Skin: ON
```

## 🐛 故障排除

| 问题 | 解决方案 |
|------|----------|
| 尾巴不动 | 检查 Enable Animation 是否勾选 |
| 运动不自然 | 增加 Smoothing (0.2-0.4) |
| 尾巴抖动 | 增加 Smoothing，减少 IK Iterations |
| 性能卡顿 | 减少 IK Iterations 和 Segment Count |

## 📝 代码控制

```typescript
// 获取控制器
const ik = tailRenderer.getIKController()

// 启用并设置预设
ik.setEnabled(true)
ik.setPreset('happy')

// 自定义参数
ik.updateConfig({
  customSpeed: 2.0,
  smoothing: 0.15
})
```

## 🎨 创意组合

### 兴奋摇摆
```
Amplitude X: 0.08
Frequency X: 2.5
Speed: 2.0
```

### 慵懒摆动
```
Amplitude X: 0.04
Frequency X: 0.4
Speed: 0.6
Smoothing: 0.4
```

### 好奇探索
```
Pattern: figure8
Amplitude X: 0.06
Amplitude Y: 0.05
Frequency X: 1.0
Frequency Y: 2.0
```

---

**提示**: 所有参数都可以实时调整，立即看到效果！

详细文档：`IK_ANIMATION_GUIDE.md`
