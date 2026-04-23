// Fur Shell Shader
// Based on Shell Texturing technique for realistic fur rendering

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
