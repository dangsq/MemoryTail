import * as THREE from 'three'

export class RobotDogRenderer {
  private scene: THREE.Scene
  private dogGroup: THREE.Group
  private bodyMeshes: THREE.Mesh[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.dogGroup = new THREE.Group()
    this.scene.add(this.dogGroup)
    
    this.createRobotDog()
  }

  private createRobotDog() {
    // Material for robot dog body
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.3,
    })

    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2,
    })

    // Main body (torso)
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.2)
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(-0.2, 0, 0)
    body.castShadow = true
    this.dogGroup.add(body)
    this.bodyMeshes.push(body)

    // Head
    const headGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.15)
    const head = new THREE.Mesh(headGeometry, bodyMaterial)
    head.position.set(0.15, 0.05, 0)
    head.castShadow = true
    this.dogGroup.add(head)
    this.bodyMeshes.push(head)

    // Neck connector
    const neckGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8)
    const neck = new THREE.Mesh(neckGeometry, jointMaterial)
    neck.rotation.z = Math.PI / 2
    neck.position.set(0.06, 0.02, 0)
    this.dogGroup.add(neck)
    this.bodyMeshes.push(neck)

    // Create 4 legs
    const legPositions = [
      { x: 0.05, z: 0.08 },   // Front left
      { x: 0.05, z: -0.08 },  // Front right
      { x: -0.35, z: 0.08 },  // Back left
      { x: -0.35, z: -0.08 }, // Back right
    ]

    legPositions.forEach((pos) => {
      // Upper leg
      const upperLegGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8)
      const upperLeg = new THREE.Mesh(upperLegGeometry, bodyMaterial)
      upperLeg.position.set(pos.x, -0.075, pos.z)
      upperLeg.castShadow = true
      this.dogGroup.add(upperLeg)
      this.bodyMeshes.push(upperLeg)

      // Knee joint
      const kneeGeometry = new THREE.SphereGeometry(0.03, 8, 8)
      const knee = new THREE.Mesh(kneeGeometry, jointMaterial)
      knee.position.set(pos.x, -0.15, pos.z)
      this.dogGroup.add(knee)
      this.bodyMeshes.push(knee)

      // Lower leg
      const lowerLegGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8)
      const lowerLeg = new THREE.Mesh(lowerLegGeometry, bodyMaterial)
      lowerLeg.position.set(pos.x, -0.225, pos.z)
      lowerLeg.castShadow = true
      this.dogGroup.add(lowerLeg)
      this.bodyMeshes.push(lowerLeg)

      // Foot
      const footGeometry = new THREE.SphereGeometry(0.025, 8, 8)
      const foot = new THREE.Mesh(footGeometry, jointMaterial)
      foot.position.set(pos.x, -0.3, pos.z)
      foot.castShadow = true
      this.dogGroup.add(foot)
      this.bodyMeshes.push(foot)
    })

    // Position the whole dog
    this.dogGroup.position.y = 0.3
  }

  getTailAttachmentPoint(): THREE.Vector3 {
    // Return the position where the tail should attach (back of body)
    return new THREE.Vector3(-0.4, 0.3, 0)
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
