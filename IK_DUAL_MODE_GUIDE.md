# 🎮 IK 动画系统 - 双模式版本

## ✨ 新功能：两种控制模式

### 1. **鼠标跟随模式** 🖱️
尾巴尖端实时跟随鼠标位置

### 2. **预设情绪模式** 🎭
8 种预设情绪动画（idle, happy, excited, alert, relaxed, curious, playful, nervous）

---

## 🚀 快速开始

```bash
cd app && npm run dev
```

访问：http://localhost:5175/MemoryTail/

---

## 🎮 使用方法

### 鼠标跟随模式

1. 导航到最后一页（3D 交互页面）
2. 在 GUI 中找到 **🎭 IK Animation**
3. 勾选 **Enable Animation**
4. 将 **Mode** 设置为 **mouse**
5. 移动鼠标，尾巴会跟随！

**效果**：
- 鼠标左移 → 尾巴向左
- 鼠标右移 → 尾巴向右
- 鼠标上移 → 尾巴向上
- 鼠标下移 → 尾巴向下

### 预设情绪模式

1. 导航到最后一页
2. 在 GUI 中找到 **🎭 IK Animation**
3. 勾选 **Enable Animation**
4. 将 **Mode** 设置为 **preset**
5. 从 **Preset** 下拉菜单选择情绪（如 happy）
6. 调整 **Speed** 控制速度

**8 种情绪**：
- **idle** - 待机轻摇
- **happy** - 开心快摇
- **excited** - 兴奋圆周
- **alert** - 警觉竖起
- **relaxed** - 放松摇摆
- **curious** - 好奇8字
- **playful** - 玩耍螺旋
- **nervous** - 紧张抖动

---

## 🎛️ GUI 控制面板

### 通用控制

```
🎭 IK Animation
  ├─ Enable Animation ✓     // 开关动画
  ├─ Mode                    // 选择模式
  │   ├─ preset             // 预设情绪模式
  │   └─ mouse              // 鼠标跟随模式
  ├─ Smoothing              // 平滑度 (0.01-0.5)
  └─ IK Iterations          // 精度 (1-20)
```

### 预设模式专属

```
  ├─ Preset                 // 选择情绪
  └─ Speed                  // 动画速度 (0.1-3.0)
```

### 鼠标模式专属

```
  └─ Move mouse to control tail  // 提示信息
```

---

## 🎯 两种模式对比

| 特性 | 鼠标跟随模式 | 预设情绪模式 |
|------|-------------|-------------|
| **控制方式** | 鼠标移动 | 自动播放 |
| **交互性** | 高 | 低 |
| **可预测性** | 低 | 高 |
| **适用场景** | 互动展示、游戏 | 演示、情感表达 |
| **精确度** | 完全跟随 | 程序化运动 |
| **自然度** | 取决于鼠标移动 | 非常自然 |

---

## 💡 使用场景

### 鼠标跟随模式

**适合**：
- 互动展示
- 用户参与体验
- 游戏化应用
- 实时控制演示

**示例**：
```
用户移动鼠标 → 尾巴实时跟随
像真实的狗狗追逐目标
```

### 预设情绪模式

**适合**：
- 情感表达
- 自动演示
- 背景动画
- 状态指示

**示例**：
```
机器狗状态：开心 → 播放 happy 动画
机器狗状态：警觉 → 播放 alert 动画
```

---

## 🔧 参数调优

### 鼠标跟随模式

**更灵敏**：
```
Smoothing: 0.05-0.1
IK Iterations: 15-20
```

**更平滑**：
```
Smoothing: 0.3-0.5
IK Iterations: 8-10
```

### 预设情绪模式

**更快速**：
```
Speed: 2.0-3.0
Smoothing: 0.1-0.15
```

**更缓慢**：
```
Speed: 0.5-0.8
Smoothing: 0.3-0.5
```

---

## 🎨 技术细节

### 鼠标跟随实现

1. **鼠标坐标转换**
   ```
   屏幕坐标 → NDC坐标 (-1 到 +1)
   ```

2. **射线投射**
   ```
   使用 Raycaster 将 2D 鼠标投射到 3D 空间
   ```

3. **平面相交**
   ```
   创建虚拟平面接收射线
   计算交点作为目标位置
   ```

4. **范围限制**
   ```
   X: -0.3 到 +0.3 米
   Y: -0.3 到 +0.3 米
   Z: -0.3 到 0 米（向下）
   ```

5. **IK 求解**
   ```
   使用 CCD 算法让尾巴尖端到达目标
   ```

### 预设情绪实现

1. **时间驱动**
   ```
   time += deltaTime * speed
   ```

2. **运动模式**
   ```
   sine / circle / figure8 / pendulum / spiral
   ```

3. **偏移计算**
   ```
   offset = amplitude * pattern(time * frequency)
   ```

4. **目标位置**
   ```
   target = naturalPosition + offset
   ```

5. **IK 求解**
   ```
   使用 CCD 算法让尾巴到达目标
   ```

---

## 🐛 故障排除

### 鼠标模式问题

**问题：尾巴不跟随鼠标**
- 检查 Mode 是否设置为 "mouse"
- 检查 Enable Animation 是否勾选
- 确保鼠标在 Canvas 区域内

**问题：跟随太慢/太快**
- 调整 Smoothing（越小越快）
- 调整 IK Iterations（越多越精确）

**问题：尾巴抖动**
- 增加 Smoothing（0.3-0.5）
- 减少 IK Iterations（5-8）

### 预设模式问题

**问题：动画不播放**
- 检查 Mode 是否设置为 "preset"
- 检查 Enable Animation 是否勾选
- 检查 Speed 是否为 0

**问题：运动幅度太小**
- 选择幅度更大的预设（happy, excited, playful）
- Speed 设置为 2.0 以上

---

## 🎉 完成功能

✅ **鼠标跟随模式** - 实时交互
✅ **预设情绪模式** - 8 种情绪
✅ **模式切换** - 一键切换
✅ **平滑过渡** - 自然流畅
✅ **范围限制** - 防止过度运动
✅ **GUI 集成** - 简洁易用

---

## 📊 性能建议

### 鼠标模式
```
IK Iterations: 10-15
Smoothing: 0.15-0.2
Segment Count: 10-12
```

### 预设模式
```
IK Iterations: 8-12
Smoothing: 0.15-0.2
Segment Count: 10-15
Speed: 1.0-2.0
```

---

## 🎮 立即体验

```bash
cd app && npm run dev
```

### 体验鼠标跟随
1. 打开浏览器
2. 导航到最后一页
3. Enable Animation ✓
4. Mode → mouse
5. 移动鼠标，看尾巴追逐！

### 体验预设情绪
1. Mode → preset
2. Preset → happy
3. Speed → 2.0
4. 看尾巴欢快摇摆！

---

**两种模式，双倍乐趣！** 🐕✨
