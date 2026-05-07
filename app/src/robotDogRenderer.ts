import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class RobotDogRenderer {
  private scene: THREE.Scene
  private dogGroup: THREE.Group
  private bodyMeshes: THREE.Mesh[] = []
  private modelLoaded = false

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.dogGroup = new THREE.Group()
    this.scene.add(this.dogGroup)
    
    this.loadModel()
  }

  private loadModel() {
    const loader = new GLTFLoader()
    
    loader.load(
      '/MemoryTail/models/robot_dog_unitree_go2.glb',
      (gltf) => {
        console.log('Robot dog model loaded successfully')
        
        // Add the model to the group
        const model = gltf.scene
        
        // Enable shadows
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
            this.bodyMeshes.push(child)
          }
        })
        
        // Adjust model scale and position if needed
        model.scale.set(1, 1, 1)
        model.position.set(0, 0, 0)
        
        this.dogGroup.add(model)
        this.modelLoaded = true
        
        console.log('Model added to scene')
      },
      (progress) => {
        console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(2)}%`)
      },
      (error) => {
        console.error('Error loading robot dog model:', error)
        // Fallback to procedural model
        this.createProceduralRobotDog()
      }
    )
  }

  private createProceduralRobotDog() {
    // Material for robot dog body
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.4,
    })

    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.2,
    })

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x1a4a7a,
      emissiveIntensity: 0.3,
    })

    // Main body (torso) - more rectangular like real robot dogs
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.12, 0.25)
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(-0.15, 0, 0)
    body.castShadow = true
    this.dogGroup.add(body)
    this.bodyMeshes.push(body)

    // Top panel (like sensor housing)
    const topPanelGeometry = new THREE.BoxGeometry(0.3, 0.03, 0.2)
    const topPanel = new THREE.Mesh(topPanelGeometry, accentMaterial)
    topPanel.position.set(-0.1, 0.075, 0)
    topPanel.castShadow = true
    this.dogGroup.add(topPanel)
    this.bodyMeshes.push(topPanel)

    // Head - more angular
    const headGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.18)
    const head = new THREE.Mesh(headGeometry, bodyMaterial)
    head.position.set(0.2, 0.02, 0)
    head.castShadow = true
    this.dogGroup.add(head)
    this.bodyMeshes.push(head)

    // Camera/sensor on head
    const sensorGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16)
    const sensor = new THREE.Mesh(sensorGeometry, accentMaterial)
    sensor.rotation.z = Math.PI / 2
    sensor.position.set(0.27, 0.02, 0)
    this.dogGroup.add(sensor)
    this.bodyMeshes.push(sensor)

    // Neck connector
    const neckGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 12)
    const neck = new THREE.Mesh(neckGeometry, jointMaterial)
    neck.rotation.z = Math.PI / 2
    neck.position.set(0.1, 0.01, 0)
    this.dogGroup.add(neck)
    this.bodyMeshes.push(neck)

    // Create 4 legs - more realistic proportions
    const legPositions = [
      { x: 0.12, z: 0.11 },   // Front left
      { x: 0.12, z: -0.11 },  // Front right
      { x: -0.38, z: 0.11 },  // Back left
      { x: -0.38, z: -0.11 }, // Back right
    ]

    legPositions.forEach((pos) => {
      // Hip/shoulder joint
      const hipGeometry = new THREE.SphereGeometry(0.04, 12, 12)
      const hip = new THREE.Mesh(hipGeometry, jointMaterial)
      hip.position.set(pos.x, -0.06, pos.z)
      this.dogGroup.add(hip)
      this.bodyMeshes.push(hip)

      // Upper leg (thigh)
      const upperLegGeometry = new THREE.CylinderGeometry(0.028, 0.028, 0.18, 12)
      const upperLeg = new THREE.Mesh(upperLegGeometry, bodyMaterial)
      upperLeg.position.set(pos.x, -0.15, pos.z)
      upperLeg.castShadow = true
      this.dogGroup.add(upperLeg)
      this.bodyMeshes.push(upperLeg)

      // Knee joint - more prominent
      const kneeGeometry = new THREE.SphereGeometry(0.035, 12, 12)
      const knee = new THREE.Mesh(kneeGeometry, jointMaterial)
      knee.position.set(pos.x, -0.24, pos.z)
      this.dogGroup.add(knee)
      this.bodyMeshes.push(knee)

      // Lower leg (shin) - slightly angled
      const lowerLegGeometry = new THREE.CylinderGeometry(0.022, 0.022, 0.18, 12)
      const lowerLeg = new THREE.Mesh(lowerLegGeometry, bodyMaterial)
      lowerLeg.position.set(pos.x, -0.33, pos.z)
      lowerLeg.castShadow = true
      this.dogGroup.add(lowerLeg)
      this.bodyMeshes.push(lowerLeg)

      // Foot - more detailed
      const footGeometry = new THREE.CylinderGeometry(0.03, 0.025, 0.04, 12)
      const foot = new THREE.Mesh(footGeometry, jointMaterial)
      foot.position.set(pos.x, -0.44, pos.z)
      foot.castShadow = true
      this.dogGroup.add(foot)
      this.bodyMeshes.push(foot)

      // Foot pad
      const padGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 12)
      const pad = new THREE.Mesh(padGeometry, accentMaterial)
      pad.position.set(pos.x, -0.46, pos.z)
      this.dogGroup.add(pad)
      this.bodyMeshes.push(pad)
    })

    // Tail attachment port (glowing)
    const portGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16)
    const port = new THREE.Mesh(portGeometry, accentMaterial)
    port.rotation.z = Math.PI / 2
    port.position.set(-0.4, 0, 0)
    this.dogGroup.add(port)
    this.bodyMeshes.push(port)

    // Position the whole dog
    this.dogGroup.position.y = 0.46
  }

  getTailAttachmentPoint(): THREE.Vector3 {
    if (this.modelLoaded && this.dogGroup.children.length > 0) {
      // For loaded model, calculate the back-top position
      const box = new THREE.Box3().setFromObject(this.dogGroup)
      return new THREE.Vector3(box.min.x - 0.05, box.max.y - 0.05, 0)
    }
    
    // Fallback for procedural model
    return new THREE.Vector3(-0.4, 0.46, 0)
  }

  show() {
    this.dogGroup.visible = true
  }

  hide() {
    this.dogGroup.visible = false
  }

  update() {
    // Future: add animations here
  }

  dispose() {
    this.bodyMeshes.forEach((mesh) => {
      this.dogGroup.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    this.bodyMeshes = []
    this.scene.remove(this.dogGroup)
  }
}
