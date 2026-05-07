/**
 * 尾巴参数定义
 * 
 * 用于控制机械尾巴的形状、运动和材质
 */

export interface TailParams {
  // ========== 形状参数 ==========
  segmentCount: number      // 链节数量
  linkLength: number        // 链节长度
  linkRadius: number        // 链节半径
  jointRadius: number       // 关节半径
  
  // ========== 运动参数 ==========
  curvature: number         // 整体弯曲度 (0-1)
  twist: number             // 整体扭转 (0-1)
  
  // ========== 材质参数 ==========
  metallic: number          // 金属度 (0-1)
  roughness: number         // 粗糙度 (0-1)
  linkColor: string         // 链节颜色
  jointColor: string        // 关节颜色
  
  // ========== 变换参数 ==========
  posX: number
  posY: number
  posZ: number
  rotX: number
  rotY: number
  rotZ: number
}

export const defaultTailParams: TailParams = {
  // 形状参数
  segmentCount: 8,
  linkLength: 0.08,
  linkRadius: 0.03,
  jointRadius: 0.02,
  
  // 运动参数
  curvature: 0.5,
  twist: 0.0,
  
  // 材质参数
  metallic: 0.8,
  roughness: 0.3,
  linkColor: '#4169E1',     // Royal Blue
  jointColor: '#FFD700',    // Gold
  
  // 变换参数（附着到机器狗）
  posX: 0.0,
  posY: 0.0,
  posZ: 0.0,
  rotX: 0.0,
  rotY: 0.0,
  rotZ: 0.0,
}

export const tailParamRanges: Record<keyof TailParams, [number, number] | null> = {
  // 形状参数
  segmentCount: [3, 15],
  linkLength: [0.04, 0.15],
  linkRadius: [0.02, 0.06],
  jointRadius: [0.01, 0.04],
  
  // 运动参数
  curvature: [0.0, 1.0],
  twist: [-1.0, 1.0],
  
  // 材质参数
  metallic: [0.0, 1.0],
  roughness: [0.0, 1.0],
  linkColor: null,
  jointColor: null,
  
  // 变换参数
  posX: [-0.5, 0.5],
  posY: [-0.5, 0.5],
  posZ: [-0.5, 0.5],
  rotX: [-Math.PI, Math.PI],
  rotY: [-Math.PI, Math.PI],
  rotZ: [-Math.PI, Math.PI],
}

export const mergeTailParams = (overrides: Partial<TailParams> = {}): TailParams => ({
  ...defaultTailParams,
  ...overrides,
})

export const clampTailParams = (params: TailParams): TailParams => {
  const next = { ...params }

  ;(Object.keys(tailParamRanges) as Array<keyof TailParams>).forEach((key) => {
    const range = tailParamRanges[key]
    if (!range) return
    const [min, max] = range
    next[key] = Math.min(max, Math.max(min, Number(next[key]))) as never
  })

  return next
}
