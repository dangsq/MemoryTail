import GUI from 'lil-gui'
import type { CableDrivenTailRenderer } from './cableDrivenTail'

/**
 * 尾巴控制 GUI
 * 
 * 提供用户界面来控制线驱动尾巴的参数
 */

export class TailGUI {
  private gui: GUI
  private tailRenderer: CableDrivenTailRenderer
  private folders: Map<string, GUI> = new Map()

  constructor(tailRenderer: CableDrivenTailRenderer, container?: HTMLElement) {
    this.tailRenderer = tailRenderer
    this.gui = new GUI({ container })
    this.gui.title('Tail Control')
    
    this.buildGUI()
  }

  private buildGUI(): void {
    const config = this.tailRenderer.getConfig()

    // ========== 基础参数 ==========
    const basicFolder = this.gui.addFolder('Basic Parameters')
    this.folders.set('basic', basicFolder)

    const basicParams = {
      segmentCount: config.segmentCount,
      maxJointAngle: config.maxJointAngle,
    }

    basicFolder.add(basicParams, 'segmentCount', 3, 12, 1)
      .name('Segment Count')
      .onChange((value: number) => {
        this.tailRenderer.rebuild({ segmentCount: value })
        this.rebuildCableHoleControls()
      })

    basicFolder.add(basicParams, 'maxJointAngle', 10, 60, 1)
      .name('Max Joint Angle (°)')
      .onChange((value: number) => {
        this.tailRenderer.rebuild({ maxJointAngle: value })
      })

    basicFolder.open()

    // ========== 线孔控制 ==========
    this.buildCableHoleControls()

    // ========== 预设 ==========
    this.buildPresets()
  }

  private buildPresets(): void {
    const presetFolder = this.gui.addFolder('Presets')
    this.folders.set('presets', presetFolder)

    const presetParams = {
      loadPreset: 'straight',
      resetAll: () => this.resetAllCables(),
    }

    presetFolder.add(presetParams, 'loadPreset', ['straight', 'curved', 'spiral'])
      .name('Load Preset')
      .onChange((value: string) => {
        this.loadPreset(value as 'straight' | 'curved' | 'spiral')
      })

    presetFolder.add(presetParams, 'resetAll').name('Reset All Cables')

    presetFolder.open()
  }

  private buildCableHoleControls(): void {
    // 移除旧的文件夹
    if (this.folders.has('cables')) {
      const oldFolder = this.folders.get('cables')!
      oldFolder.destroy()
      this.folders.delete('cables')
    }

    const cableFolder = this.gui.addFolder('Cable Holes (12 holes)')
    this.folders.set('cables', cableFolder)

    const config = this.tailRenderer.getConfig()

    // 为每个线孔创建控制
    config.cableHoles.forEach((hole, index) => {
      const holeFolder = cableFolder.addFolder(`Hole ${index} (${hole.angle}°)`)
      
      const holeParams = {
        enabled: hole.enabled,
        tension: hole.tension,
      }

      holeFolder.add(holeParams, 'enabled')
        .name('Enabled')
        .onChange((value: boolean) => {
          this.tailRenderer.toggleCableHole(index, value)
        })

      holeFolder.add(holeParams, 'tension', 0, 1, 0.01)
        .name('Tension')
        .onChange((value: number) => {
          this.tailRenderer.setCableTension(index, value)
        })

      // 默认折叠
      if (!hole.enabled) {
        holeFolder.close()
      }
    })

    cableFolder.open()
  }

  private rebuildCableHoleControls(): void {
    this.buildCableHoleControls()
  }

  private loadPreset(preset: 'straight' | 'curved' | 'spiral'): void {
    const config = this.tailRenderer.getConfig()
    
    switch (preset) {
      case 'straight':
        config.cableHoles.forEach(hole => {
          hole.enabled = false
          hole.tension = 0
        })
        break

      case 'curved':
        config.cableHoles.forEach((hole, i) => {
          hole.enabled = i === 0
          hole.tension = i === 0 ? 0.5 : 0
        })
        break

      case 'spiral':
        config.cableHoles.forEach((hole, i) => {
          const isActive = i === 0 || i === 3 || i === 6 || i === 9
          hole.enabled = isActive
          hole.tension = isActive ? 0.3 : 0
        })
        break
    }

    this.tailRenderer.updateCableHoles(config.cableHoles)
    this.rebuildCableHoleControls()
  }

  private resetAllCables(): void {
    const config = this.tailRenderer.getConfig()
    config.cableHoles.forEach(hole => {
      hole.enabled = false
      hole.tension = 0
    })
    this.tailRenderer.updateCableHoles(config.cableHoles)
    this.rebuildCableHoleControls()
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
