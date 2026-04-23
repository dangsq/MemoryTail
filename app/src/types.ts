export type AppleParams = {
  // Core form — Bezier lathe profile
  height: number
  width: number
  maxWidthHeight: number
  bottomRadius: number
  bottomDepth: number
  topRadius: number
  topDepth: number
  cubicRatio: number

  // Shell
  shellThickness: number

  // Leaf
  leafEnabled: boolean
  leafLength: number
  leafWidth: number
  leafAngle: number // angle with ground plane, π/4 – π/2

  // Bite (CSG boolean subtraction)
  biteEnabled: boolean
  biteU: number // longitude 0–1 around circumference
  biteV: number // latitude 0=bottom, 1=top
  biteRadius: number // UV-space radius

  // Presentation
  segments: number
  rotationY: number
}

export type TailParams = {
  // === Memory Parameters (displayed with story) ===
  
  // "It reached my hand"
  tailLength: number        // 0.3 - 1.0m
  
  // "Crazy when I came home"
  wagAmplitude: number      // 0 - 1
  
  // "Relaxed circle when sleeping"
  relaxedCurve: number      // 0 - 1
  
  // "Its tail was strong"
  tailThickness: number     // 0.02 - 0.08m
  
  // "Getting thinner at the tip"
  taperRatio: number        // 0.3 - 1.0
  
  // === Technical Parameters ===
  
  // Joint visibility
  showJoints: boolean
  
  // Joint size
  jointSize: number         // 0.01 - 0.05m
  
  // Surface material
  metallic: number          // 0 - 1
  roughness: number         // 0 - 1
  
  // === Fur Parameters ===
  
  // Enable fur rendering
  furEnabled: boolean
  
  // Fur length
  furLength: number         // 0.0 - 0.05m
  
  // Fur density
  furDensity: number        // 0.0 - 1.0
  
  // Fur base color
  furColor: string          // hex color
  
  // Fur secondary color (for blending)
  furColor2: string         // hex color
  
  // Color blend ratio
  furColorMix: number       // 0.0 - 1.0
  
  // Presentation
  rotationY: number
}

export type StoryPage = {
  id: string
  label: string
  title: string
  text: string
  params?: Partial<AppleParams>
  tailParams?: Partial<TailParams>
  random?: boolean
  freeEdit?: boolean

  // Visual illustration (CSS gradient + shape or image URL)
  imageGradient?: string
  imageUrl?: string
  imageShape?: string

  // Camera override for this page
  cameraPosition?: [number, number, number]
  cameraTarget?: [number, number, number]
}
