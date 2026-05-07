import * as THREE from 'three'

export function addOutlineToMesh(mesh: THREE.Mesh, scaleFactor = 1.05): THREE.Mesh {
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide,
  })
  const outline = new THREE.Mesh(mesh.geometry.clone(), outlineMaterial)
  outline.scale.setScalar(scaleFactor)
  outline.name = `${mesh.name || 'mesh'}-outline`
  mesh.add(outline)
  return outline
}

export function addOutlineToGroup(group: THREE.Group, scaleFactor = 1.05): void {
  const meshes: THREE.Mesh[] = []
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child)
    }
  })
  meshes.forEach((mesh) => addOutlineToMesh(mesh, scaleFactor))
}
