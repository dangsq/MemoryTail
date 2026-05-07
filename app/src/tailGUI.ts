import GUI from 'lil-gui'
import type { CableDrivenTailRenderer } from './cableDrivenTail'
import { animationPresets } from './tailIKAnimation'

/**
 * Tail GUI 控制面板
 * 
 * 提供两种模式：
 * - 'shape': 只显示基础参数和半径参数（用于 design_shape 页面）
 * - 'animation': 只显示动画参数（用于 design_emotions 页面）
 */

export class TailGUI {
  private gui: GUI
  private tailRenderer: CableDrivenTailRenderer
  private folders: Map<string, GUI> = new Map()
  private mode: 'shape' | 'animation'

  constructor(
    tailRenderer: CableDrivenTailRenderer, 
    container?: HTMLElement,
    mode: 'shape' | 'animation' = 'shape'
  ) {
    this.tailRenderer = tailRenderer
    this.mode = mode
    this.gui = new GUI({ container })
    this.gui.title(mode === 'shape' ? 'Tail Shape Control' : 'Tail Animation Control')
    
    this.buildGUI()
  }

  private buildGUI(): void {
    if (this.mode === 'shape') {
      // Shape 模式：只显示基础参数和半径参数
      this.buildBasicControls()
      this.buildScaleControls()
    } else {
      // Animation 模式：只显示动画参数
      this.buildAnimationControls()
    }
  }

  private buildBasicControls(): void {
    const config = this.tailRenderer.getConfig()

    // ========== 基础参数 ==========
    const basicFolder = this.gui.addFolder('Basic Parameters')
    this.folders.set('basic', basicFolder)

    const basicParams = {
      segmentCount: config.segmentCount,
      skinEnabled: config.skinEnabled,
      furryEnabled: config.furryEnabled,
    }

    basicFolder.add(basicParams, 'segmentCount', 6, 30, 1)
      .name('Segment Count')
      .onChange((value: number) => {
        this.tailRenderer.rebuild({ segmentCount: value })
      })

    basicFolder.add(basicParams, 'skinEnabled')
      .name('Skin (Fur Cover)')
      .onChange((value: boolean) => {
        this.tailRenderer.rebuild({ skinEnabled: value })
      })

    basicFolder.add(basicParams, 'furryEnabled')
      .name('Enable Furry')
      .onChange((value: boolean) => {
        this.tailRenderer.rebuild({ furryEnabled: value })
      })

    basicFolder.open()
  }

  private buildScaleControls(): void {
    const scaleFolder = this.gui.addFolder('Disk Radius Multiplier')
    this.folders.set('scale', scaleFolder)

    const config = this.tailRenderer.getConfig()
    const scaleParams = {
      headScale: config.headScale,
      midScale: config.midScale,
      tailScale: config.tailScale,
    }

    scaleFolder.add(scaleParams, 'headScale', 1.0, 3.0, 0.1)
      .name('Head (× Base Radius)')
      .onChange((value: number) => {
        this.tailRenderer.rebuild({ headScale: value })
      })

    scaleFolder.add(scaleParams, 'midScale', 1.0, 3.0, 0.1)
      .name('Mid (× Base Radius)')
      .onChange((value: number) => {
        this.tailRenderer.rebuild({ midScale: value })
      })

    scaleFolder.add(scaleParams, 'tailScale', 1.0, 3.0, 0.1)
      .name('Tail (× Base Radius)')
      .onChange((value: number) => {
        this.tailRenderer.rebuild({ tailScale: value })
      })

    scaleFolder.open()
  }

  private buildAnimationControls(): void {
    const animFolder = this.gui.addFolder('🎭 IK Animation')
    this.folders.set('animation', animFolder)

    const ikController = this.tailRenderer.getIKController()
    if (!ikController) {
      // IK 控制器还未初始化，显示提示信息
      const loadingText = animFolder.add({ loading: 'Loading...' }, 'loading')
      loadingText.disable()
      
      // 延迟重试
      setTimeout(() => {
        this.rebuildAnimationControls()
      }, 1000)
      
      animFolder.open()
      return
    }

    const ikConfig = ikController.getConfig()

    // 直接使用 ikConfig 对象，而不是创建副本
    // 这样 GUI 的改变会直接反映到配置中
    const animParams = ikConfig

    animFolder.add(animParams, 'enabled')
      .name('Enable Animation')
      .onChange((value: boolean) => {
        ikController.setEnabled(value)
      })

    // 模式选择
    animFolder.add(animParams, 'mode', ['preset', 'mouse'])
      .name('Mode')
      .onChange((value: string) => {
        ikController.setMode(value as 'preset' | 'mouse')
        // 重建 GUI 以显示/隐藏相关控制
        this.rebuildAnimationControls()
      })

    // 根据模式显示不同的控制
    if (ikConfig.mode === 'preset') {
      // 预设模式：显示预设选择
      const presetNames = Object.keys(animationPresets)
      
      animFolder.add(animParams, 'currentPreset', presetNames)
        .name('Preset')
        .onChange((value: string) => {
          console.log('GUI: Preset changed to:', value)
          ikController.setPreset(value)
        })
    } else {
      // 鼠标模式：显示提示
      const mouseHint = animFolder.add({ hint: 'Move mouse to control tail' }, 'hint')
      mouseHint.disable()
    }

    animFolder.open()
  }

  private rebuildAnimationControls(): void {
    // 移除旧的动画文件夹
    if (this.folders.has('animation')) {
      const oldFolder = this.folders.get('animation')!
      oldFolder.destroy()
      this.folders.delete('animation')
    }
    
    // 重新构建
    this.buildAnimationControls()
  }

  /**
   * 显示/隐藏 GUI
   */
  setVisible(visible: boolean): void {
    if (visible) {
      this.gui.show()
    } else {
      this.gui.hide()
    }
  }

  /**
   * 销毁 GUI
   */
  dispose(): void {
    this.gui.destroy()
  }

  /**
   * 获取 GUI 实例
   */
  getGUI(): GUI {
    return this.gui
  }
}
