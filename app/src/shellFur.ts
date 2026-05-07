import * as THREE from 'three'

/**
 * 毛发着色器材质
 * 
 * 基于 Shell Texturing 技术的真实毛发渲染
 * 使用多层半透明壳层和噪声纹理
 */

export const furVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
`

export const furFragmentShader = `
uniform float furLayer;        // 0.0 to 1.0, current layer
uniform float furLength;       // Total fur length
uniform float furDensity;      // 0.0 to 1.0
uniform vec3 furColor;         // Base fur color
uniform vec3 furColor2;        // Secondary fur color
uniform float furColorMix;     // Color blend ratio
uniform float furRoughness;    // Surface roughness

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

// Simple noise function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  // Generate fur pattern using noise
  vec2 furUV = vUv * 100.0; // Scale for fur detail
  float furPattern = noise(furUV);

  // Add multiple octaves for detail
  furPattern += noise(furUV * 2.0) * 0.5;
  furPattern += noise(furUV * 4.0) * 0.25;
  furPattern /= 1.75;

  // Fur density threshold - higher layers are more sparse
  float densityThreshold = furDensity * (1.0 - furLayer * 0.5);

  // Discard fragments based on fur pattern and density
  if (furPattern < densityThreshold) {
    discard;
  }

  // Fade out at edges (based on view angle)
  vec3 viewDir = normalize(vViewPosition);
  float edgeFade = abs(dot(vNormal, viewDir));
  edgeFade = pow(edgeFade, 0.5);

  // Mix two colors based on noise and furColorMix parameter
  float colorNoise = noise(furUV * 0.5);
  float colorBlend = mix(colorNoise, furColorMix, 0.5);
  vec3 blendedColor = mix(furColor, furColor2, colorBlend);

  // Darken fur at higher layers (depth effect)
  vec3 finalColor = blendedColor * (1.0 - furLayer * 0.3);

  // Add some variation
  finalColor *= 0.9 + furPattern * 0.2;

  // Alpha based on layer and edge fade
  float alpha = (1.0 - furLayer * 0.7) * edgeFade;
  alpha *= smoothstep(densityThreshold - 0.1, densityThreshold + 0.1, furPattern);

  gl_FragColor = vec4(finalColor, alpha);
}
`

/**
 * 创建毛发材质
 */
export function createFurMaterial(options: {
  furLayer: number
  furLength: number
  furDensity: number
  furColor: THREE.Color
  furColor2: THREE.Color
  furColorMix: number
  furRoughness: number
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: furVertexShader,
    fragmentShader: furFragmentShader,
    uniforms: {
      furLayer: { value: options.furLayer },
      furLength: { value: options.furLength },
      furDensity: { value: options.furDensity },
      furColor: { value: options.furColor },
      furColor2: { value: options.furColor2 },
      furColorMix: { value: options.furColorMix },
      furRoughness: { value: options.furRoughness },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
}

/**
 * 毛发壳层配置
 */
export interface ShellFurConfig {
  shellCount: number        // 壳层数量
  furLength: number         // 毛发长度
  furDensity: number        // 毛发密度 (0.0-1.0)
  furColor: THREE.Color     // 主要颜色
  furColor2: THREE.Color    // 次要颜色
  furColorMix: number       // 颜色混合比例 (0.0-1.0)
  furRoughness: number      // 表面粗糙度
}

export const defaultShellFurConfig: ShellFurConfig = {
  shellCount: 8,            // 8 层壳（性能平衡）
  furLength: 0.03,          // 3cm
  furDensity: 0.6,          // 60% 密度
  furColor: new THREE.Color(0xFFFFFF),      // 白色
  furColor2: new THREE.Color(0xF0F0F0),     // 浅灰
  furColorMix: 0.3,         // 30% 混合
  furRoughness: 0.9,        // 粗糙
}

/**
 * Shell Texturing 毛发渲染器
 */
export class ShellFurRenderer {
  private shellMeshes: THREE.Mesh[] = []
  private config: ShellFurConfig
  private baseGeometry: THREE.BufferGeometry

  constructor(baseGeometry: THREE.BufferGeometry, config: ShellFurConfig = defaultShellFurConfig) {
    this.baseGeometry = baseGeometry
    this.config = config
    this.createShells()
  }

  /**
   * 创建多层壳
   */
  private createShells(): void {
    this.shellMeshes = []

    for (let i = 0; i < this.config.shellCount; i++) {
      const furLayer = i / (this.config.shellCount - 1)  // 0.0 to 1.0
      
      const material = createFurMaterial({
        furLayer: furLayer,
        furLength: this.config.furLength,
        furDensity: this.config.furDensity,
        furColor: this.config.furColor,
        furColor2: this.config.furColor2,
        furColorMix: this.config.furColorMix,
        furRoughness: this.config.furRoughness,
      })

      // 创建偏移的几何体
      const offsetGeometry = this.baseGeometry.clone()
      const positions = offsetGeometry.attributes.position
      const normals = offsetGeometry.attributes.normal
      
      // 沿法线方向偏移顶点
      const offset = furLayer * this.config.furLength
      for (let j = 0; j < positions.count; j++) {
        const nx = normals.getX(j)
        const ny = normals.getY(j)
        const nz = normals.getZ(j)
        
        positions.setX(j, positions.getX(j) + nx * offset)
        positions.setY(j, positions.getY(j) + ny * offset)
        positions.setZ(j, positions.getZ(j) + nz * offset)
      }
      positions.needsUpdate = true

      const mesh = new THREE.Mesh(offsetGeometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      
      this.shellMeshes.push(mesh)
    }
  }

  /**
   * 获取所有壳层网格
   */
  getMeshes(): THREE.Mesh[] {
    return this.shellMeshes
  }

  /**
   * 更新动画（这个版本不需要时间更新）
   */
  update(_deltaTime: number): void {
    // 新的 Shader 不需要时间参数
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ShellFurConfig>): void {
    Object.assign(this.config, config)

    // 更新所有材质
    this.shellMeshes.forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial
      
      if (config.furDensity !== undefined) material.uniforms.furDensity.value = config.furDensity
      if (config.furColor) material.uniforms.furColor.value = config.furColor
      if (config.furColor2) material.uniforms.furColor2.value = config.furColor2
      if (config.furColorMix !== undefined) material.uniforms.furColorMix.value = config.furColorMix
      if (config.furRoughness !== undefined) material.uniforms.furRoughness.value = config.furRoughness
      if (config.furLength !== undefined) material.uniforms.furLength.value = config.furLength
    })
  }

  /**
   * 销毁资源
   */
  dispose(): void {
    this.shellMeshes.forEach(mesh => {
      if (mesh.geometry) {
        mesh.geometry.dispose()
      }
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    })
    this.shellMeshes = []
  }
}
