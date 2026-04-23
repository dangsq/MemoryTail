import * as THREE from 'three'
import type { TailParams } from './types'
import { furVertexShader, furFragmentShader } from './furShader'

const NUM_JOINTS = 8
const FUR_LAYERS = 10

export class TailRenderer {
  private scene: THREE.Scene
  private tailGroup: THREE.Group
  private tailMesh: THREE.Mesh | null = null
  private furLayers: THREE.Mesh[] = []
  private jointMeshes: THREE.Mesh[] = []
  private attachmentPoint: THREE.Vector3 = new THREE.Vector3(0, 0, 0)

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.tailGroup = new THREE.Group()
    this.scene.add(this.tailGroup)
  }

  setAttachmentPoint(point: THREE.Vector3) {
    this.attachmentPoint.copy(point)
    this.tailGroup.position.copy(point)
  }

  update(params: TailParams) {
    // Clear existing geometry
    this.clearTail()

    // Generate joint positions along a curve
    const jointPositions = this.generateJointPositions(params)

    // Create smooth curve through joints
    const curve = new THREE.CatmullRomCurve3(jointPositions)

    // Create tail tube with varying radius
    this.createTailTube(curve, params)
    
    // Create fur layers if enabled
    if (params.furEnabled) {
      this.createFurLayers(curve, params)
    }

    // Create joint spheres if enabled
    if (params.showJoints) {
      this.createJoints(jointPositions, params)
    }

    // Apply rotation
    this.tailGroup.rotation.y = params.rotationY
  }

  private generateJointPositions(params: TailParams): THREE.Vector3[] {
    const positions: THREE.Vector3[] = []

    // Create control points for the curve
    for (let i = 0; i <= NUM_JOINTS + 1; i++) {
      const t = i / (NUM_JOINTS + 1)
      const x = t * params.tailLength

      // Apply relaxed curve (vertical bending)
      const curveAmount = params.relaxedCurve * 0.5
      const y = -curveAmount * Math.sin(t * Math.PI)

      // Apply wag amplitude (horizontal swaying)
      const wagAmount = params.wagAmplitude * 0.3
      const z = wagAmount * Math.sin(t * Math.PI * 2)

      positions.push(new THREE.Vector3(x, y, z))
    }

    return positions
  }

  private createTailTube(curve: THREE.CatmullRomCurve3, params: TailParams) {
    // Custom tube geometry with varying radius
    const tubularSegments = 64
    const radialSegments = 16
    const closed = false

    // Create custom radius function
    class CustomTubeGeometry extends THREE.TubeGeometry {
      constructor(
        path: THREE.Curve<THREE.Vector3>,
        tubularSegments: number,
        radiusFunc: (t: number) => number,
        radialSegments: number,
        closed: boolean
      ) {
        // Call parent with initial radius
        super(path, tubularSegments, 1, radialSegments, closed)

        // Modify vertices based on custom radius function
        const positions = this.attributes.position
        const normals = this.attributes.normal

        for (let i = 0; i <= tubularSegments; i++) {
          const t = i / tubularSegments
          const radius = radiusFunc(t)

          for (let j = 0; j <= radialSegments; j++) {
            const index = i * (radialSegments + 1) + j

            // Get normal
            const nx = normals.getX(index)
            const ny = normals.getY(index)
            const nz = normals.getZ(index)

            // Scale position by radius
            const point = curve.getPointAt(t)
            const offset = new THREE.Vector3(nx, ny, nz).multiplyScalar(radius)
            
            positions.setXYZ(index, point.x + offset.x, point.y + offset.y, point.z + offset.z)
          }
        }

        positions.needsUpdate = true
        this.computeVertexNormals()
      }
    }

    // Radius function with taper and rounded tip
    const radiusFunc = (t: number): number => {
      const baseRadius = params.tailThickness
      const tipRadius = baseRadius * params.taperRatio

      // Linear taper
      let radius = baseRadius * (1 - t) + tipRadius * t

      // Round the tip (last 10%)
      if (t > 0.9) {
        const tipT = (t - 0.9) / 0.1
        const roundFactor = Math.sin(tipT * Math.PI / 2)
        radius *= (1 - roundFactor * 0.5)
      }

      return radius
    }

    const geometry = new CustomTubeGeometry(
      curve,
      tubularSegments,
      radiusFunc,
      radialSegments,
      closed
    )

    // Add end cap (rounded tip)
    this.addRoundedTip(curve, params)

    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: params.metallic,
      roughness: params.roughness,
      side: THREE.DoubleSide,
    })

    this.tailMesh = new THREE.Mesh(geometry, material)
    this.tailGroup.add(this.tailMesh)
  }

  private addRoundedTip(curve: THREE.CatmullRomCurve3, params: TailParams) {
    // Add a sphere at the tip for rounded end
    const tipPoint = curve.getPointAt(1.0)
    const tipRadius = params.tailThickness * params.taperRatio * 0.5

    const sphereGeometry = new THREE.SphereGeometry(tipRadius, 16, 16)
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: params.metallic,
      roughness: params.roughness,
    })

    const sphereMesh = new THREE.Mesh(sphereGeometry, material)
    sphereMesh.position.copy(tipPoint)

    this.tailGroup.add(sphereMesh)
    this.jointMeshes.push(sphereMesh) // Store for cleanup
    
    // Add fur layers to the tip sphere if fur is enabled
    if (params.furEnabled) {
      this.addTipFurLayers(tipPoint, tipRadius, params)
    }
  }
  
  private addTipFurLayers(tipPoint: THREE.Vector3, baseRadius: number, params: TailParams) {
    const furColorObj = new THREE.Color(params.furColor)
    const furColor2Obj = new THREE.Color(params.furColor2)
    
    // Create fur layers for the tip sphere
    for (let layer = 0; layer < FUR_LAYERS; layer++) {
      const layerT = layer / (FUR_LAYERS - 1)
      const furOffset = params.furLength * layerT
      const layerRadius = baseRadius + furOffset
      
      const sphereGeometry = new THREE.SphereGeometry(layerRadius, 16, 16)
      
      // Create fur shader material
      const material = new THREE.ShaderMaterial({
        uniforms: {
          furLayer: { value: layerT },
          furLength: { value: params.furLength },
          furDensity: { value: 1.0 - params.furDensity },
          furColor: { value: furColorObj },
          furColor2: { value: furColor2Obj },
          furColorMix: { value: params.furColorMix },
          furRoughness: { value: params.roughness },
        },
        vertexShader: furVertexShader,
        fragmentShader: furFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      
      const mesh = new THREE.Mesh(sphereGeometry, material)
      mesh.position.copy(tipPoint)
      
      this.tailGroup.add(mesh)
      this.furLayers.push(mesh)
    }
  }

  private createJoints(positions: THREE.Vector3[], params: TailParams) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: params.metallic,
      roughness: params.roughness,
    })

    // Skip first and last positions (they're endpoints)
    for (let i = 1; i < positions.length - 1; i++) {
      const geometry = new THREE.SphereGeometry(params.jointSize, 16, 16)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(positions[i])

      this.tailGroup.add(mesh)
      this.jointMeshes.push(mesh)
    }
  }

  private createFurLayers(curve: THREE.CatmullRomCurve3, params: TailParams) {
    const tubularSegments = 64
    const radialSegments = 16
    const closed = false

    // Parse fur colors
    const furColorObj = new THREE.Color(params.furColor)
    const furColor2Obj = new THREE.Color(params.furColor2)

    // Radius function
    const radiusFunc = (t: number): number => {
      const baseRadius = params.tailThickness
      const tipRadius = baseRadius * params.taperRatio
      let radius = baseRadius * (1 - t) + tipRadius * t
      if (t > 0.9) {
        const tipT = (t - 0.9) / 0.1
        const roundFactor = Math.sin(tipT * Math.PI / 2)
        radius *= (1 - roundFactor * 0.5)
      }
      return radius
    }

    // Create multiple fur layers
    for (let layer = 0; layer < FUR_LAYERS; layer++) {
      const layerT = layer / (FUR_LAYERS - 1)
      
      // Create geometry for this layer
      const layerRadiusFunc = (t: number): number => {
        const baseRadius = radiusFunc(t)
        const furOffset = params.furLength * layerT
        return baseRadius + furOffset
      }

      class CustomTubeGeometry extends THREE.TubeGeometry {
        constructor(
          path: THREE.Curve<THREE.Vector3>,
          tubularSegments: number,
          radiusFunc: (t: number) => number,
          radialSegments: number,
          closed: boolean
        ) {
          super(path, tubularSegments, 1, radialSegments, closed)

          const positions = this.attributes.position
          const normals = this.attributes.normal

          for (let i = 0; i <= tubularSegments; i++) {
            const t = i / tubularSegments
            const radius = radiusFunc(t)

            for (let j = 0; j <= radialSegments; j++) {
              const index = i * (radialSegments + 1) + j
              const nx = normals.getX(index)
              const ny = normals.getY(index)
              const nz = normals.getZ(index)
              const point = curve.getPointAt(t)
              const offset = new THREE.Vector3(nx, ny, nz).multiplyScalar(radius)
              positions.setXYZ(index, point.x + offset.x, point.y + offset.y, point.z + offset.z)
            }
          }

          positions.needsUpdate = true
          this.computeVertexNormals()
        }
      }

      const geometry = new CustomTubeGeometry(
        curve,
        tubularSegments,
        layerRadiusFunc,
        radialSegments,
        closed
      )

      // Create fur shader material
      const material = new THREE.ShaderMaterial({
        uniforms: {
          furLayer: { value: layerT },
          furLength: { value: params.furLength },
          furDensity: { value: 1.0 - params.furDensity },
          furColor: { value: furColorObj },
          furColor2: { value: furColor2Obj },
          furColorMix: { value: params.furColorMix },
          furRoughness: { value: params.roughness },
        },
        vertexShader: furVertexShader,
        fragmentShader: furFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      this.tailGroup.add(mesh)
      this.furLayers.push(mesh)
    }
  }

  private clearTail() {
    // Remove tail mesh
    if (this.tailMesh) {
      this.tailGroup.remove(this.tailMesh)
      this.tailMesh.geometry.dispose()
      if (Array.isArray(this.tailMesh.material)) {
        this.tailMesh.material.forEach((mat) => mat.dispose())
      } else {
        this.tailMesh.material.dispose()
      }
      this.tailMesh = null
    }

    // Remove fur layers
    this.furLayers.forEach((mesh) => {
      this.tailGroup.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    this.furLayers = []

    // Remove all joint meshes
    this.jointMeshes.forEach((mesh) => {
      this.tailGroup.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    this.jointMeshes = []
  }

  dispose() {
    this.clearTail()
    this.scene.remove(this.tailGroup)
  }
}
