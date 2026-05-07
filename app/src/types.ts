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

export type StoryPage = {
  id: string
  label: string
  title: string
  text: string
  freeEdit?: boolean

  // Visual illustration (image URL)
  imageUrl?: string

  // Camera override for this page
  cameraPosition?: [number, number, number]
  cameraTarget?: [number, number, number]
}
