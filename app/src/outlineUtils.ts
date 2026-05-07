import * as THREE from 'three'

export function addOutlineToMesh(mesh: THREE.Mesh, scaleFactor = 1.05, color: THREE.ColorRepresentation = 0x4A3020): THREE.Mesh {
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
  })
  const outline = new THREE.Mesh(mesh.geometry.clone(), outlineMaterial)
  outline.scale.setScalar(scaleFactor)
  outline.name = `${mesh.name || 'mesh'}-outline`
  mesh.add(outline)
  return outline
}

export function addOutlineToGroup(group: THREE.Group, scaleFactor = 1.05, color: THREE.ColorRepresentation = 0x4A3020): void {
  const meshes: THREE.Mesh[] = []
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child)
    }
  })
  meshes.forEach((mesh) => addOutlineToMesh(mesh, scaleFactor, color))
}
