import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { clampParams } from './params'
import type { AppleParams } from './types'

/* ═══════════════════════════════════════════════════
   Apple Renderer — Bezier lathe profile + CSG bite

   The apple is built from a profile curve defined by
   5 key points along latitude angle v (-π/2 to π/2).
   Two separate Bezier splines control z(v) and r(v).
   The profile is revolved to create a lathe body.

   The apple is always a shell (outer - inner).
   Bite is implemented via CSG boolean subtraction.
   Leaf is embedded at the top dimple rim, extending outward.
   ═══════════════════════════════════════════════════ */

export class AppleRenderer {
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly container: HTMLElement
  private readonly stage = new THREE.Group()
  private readonly appleGroup = new THREE.Group()
  private animationFrame = 0
  private readonly resizeObserver: ResizeObserver
  private readonly csgEvaluator = new Evaluator()

  // Camera animation state
  private cameraTargetPos = new THREE.Vector3(0, 0.8, 2.8)
  private cameraTargetLookAt = new THREE.Vector3(0, 0, 0)

  constructor(container: HTMLElement) {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#34495e')
    this.scene.fog = new THREE.Fog('#34495e', 4, 12)

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.01, 50)
    this.camera.position.set(0, 0.8, 2.8)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.localClippingEnabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enabled = true  // Explicitly enable controls
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.target.set(0, 0.0, 0)
    this.controls.minDistance = 0.5
    this.controls.maxDistance = 6
    
    // Enable all interaction modes
    this.controls.enableRotate = true
    this.controls.enableZoom = true
    this.controls.enablePan = true
    
    // Set rotation speed
    this.controls.rotateSpeed = 1.0
    this.controls.zoomSpeed = 1.0
    this.controls.panSpeed = 1.0

    this.scene.add(this.stage)
    this.stage.add(this.appleGroup)

    // floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3, 64),
      new THREE.MeshStandardMaterial({
        color: '#5a6c7d',
        roughness: 0.8,
        metalness: 0.1,
        transparent: true,
        opacity: 0.6,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.7
    this.stage.add(floor)

    // lights - enhanced for natural materials
    this.scene.add(new THREE.HemisphereLight('#fff8e7', '#5a4030', 1.5))
    const key = new THREE.DirectionalLight('#fffbf5', 3.0)
    key.position.set(2, 2.5, 2)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight('#ffd9c4', 1.5)
    rim.position.set(-2, 1, -2)
    this.scene.add(rim)
    const fill = new THREE.DirectionalLight('#b08868', 0.8)
    fill.position.set(0, -1.5, 1)
    this.scene.add(fill)
    // Strong ambient light to prevent black rendering
    this.scene.add(new THREE.AmbientLight('#ffffff', 0.6))

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.animate()
  }

  /* ── public ── */

  setInteractive(enabled: boolean) {
    this.controls.enabled = enabled
  }

  update(params: AppleParams) {
    this.rebuild(clampParams({ ...params }))
  }

  /** Set camera target position and look-at for animation */
  setCamera(pos: [number, number, number], lookAt: [number, number, number]) {
    this.cameraTargetPos.set(pos[0], pos[1], pos[2])
    this.cameraTargetLookAt.set(lookAt[0], lookAt[1], lookAt[2])
  }

  dispose() {
    cancelAnimationFrame(this.animationFrame)
    this.resizeObserver.disconnect()
    this.controls.dispose()
    this.renderer.dispose()
    this.clearGroup(this.appleGroup)
    this.container.removeChild(this.renderer.domElement)
  }

  /* ═══════════════════════════════════════════════════
     Bezier profile — ported from apple.html

     5 key points along latitude angle v (-π/2 to π/2):
       P1: bottom dimple center (v = -π/2)
       P2: bottom rim
       P3: belly (widest)
       P4: top rim
       P5: top dimple center (v = π/2)

     Separate Bezier splines for z(v) and r(v).
     Control points computed via tangent-line intersection.
     ═══════════════════════════════════════════════════ */

  private computeIntersect(
    x1: number, y1: number, x2: number, y2: number,
    nx1: number, ny1: number, nx2: number, ny2: number,
  ): [number, number] | null {
    const a1 = nx1, b1 = ny1, c1 = nx1 * x1 + ny1 * y1
    const a2 = nx2, b2 = ny2, c2 = nx2 * x2 + ny2 * y2
    const denom = a1 * b2 - a2 * b1
    if (Math.abs(denom) < 1e-10) return null
    return [(c1 * b2 - c2 * b1) / denom, (a1 * c2 - a2 * c1) / denom]
  }

  private calculateBezierControlPoints(
    points: [number, number][],
    mode: 'z' | 'r',
    cubicRatio: number,
  ): [number, number][][] {
    let nxs: number[], nys: number[]

    if (mode === 'z') {
      nxs = [-0.9, 0.0, 0.9, 0.0, -0.9]
      nys = [0.1, 0.1, 0, 0.1, 0.1]
    } else {
      const deltaV1 = points[2][0] - points[0][0]
      const deltaZ1 = points[2][1] - points[0][1]
      const deltaV2 = points[4][0] - points[2][0]
      const deltaZ2 = points[4][1] - points[2][1]
      const n1 = 1 / (deltaZ1 !== 0 ? deltaZ1 : 0.01)
      const n2 = 1 / (deltaZ2 !== 0 ? deltaZ2 : 0.01)
      const nv1 = -1 / (deltaV1 !== 0 ? deltaV1 : 0.01)
      const nv2 = -1 / (deltaV2 !== 0 ? deltaV2 : 0.01)
      nxs = [-0.9, nv1, 0.0, nv2, -0.9]
      nys = [0.1, n1, 1.0, n2, 0.1]
    }

    const controlPairs: [number, number][][] = []

    for (let seg = 0; seg < points.length - 1; seg++) {
      const p0 = points[seg]
      const p1 = points[seg + 1]
      const intersect = this.computeIntersect(
        p0[0], p0[1], p1[0], p1[1],
        nxs[seg], nys[seg], nxs[seg + 1], nys[seg + 1],
      )

      if (!intersect) {
        const cp: [number, number] = [(p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5]
        controlPairs.push([cp, [...cp]])
      } else {
        const [ix, iy] = intersect
        const cp1: [number, number] = [
          (ix - p0[0]) * cubicRatio + p0[0],
          (iy - p0[1]) * cubicRatio + p0[1],
        ]
        const cp2: [number, number] = [
          (ix - p1[0]) * cubicRatio + p1[0],
          (iy - p1[1]) * cubicRatio + p1[1],
        ]
        controlPairs.push([cp1, cp2])
      }
    }

    return controlPairs
  }

  private cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const mt = 1 - t
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
  }

  private buildBezierEvaluator(
    points: [number, number][],
    controlPairs: [number, number][][],
  ): (v: number) => number {
    const segments: {
      vStart: number; vEnd: number
      p0val: number; p1val: number; p2val: number; p3val: number
    }[] = []

    for (let i = 0; i < points.length - 1; i++) {
      segments.push({
        vStart: points[i][0],
        vEnd: points[i + 1][0],
        p0val: points[i][1],
        p1val: controlPairs[i][0][1],
        p2val: controlPairs[i][1][1],
        p3val: points[i + 1][1],
      })
    }

    return (v: number) => {
      if (v <= segments[0].vStart) return segments[0].p0val
      if (v >= segments[segments.length - 1].vEnd) return segments[segments.length - 1].p3val

      let seg = segments.find(s => v >= s.vStart - 1e-8 && v <= s.vEnd + 1e-8)
      if (!seg) seg = segments[0]

      const t = (v - seg.vStart) / (seg.vEnd - seg.vStart)
      return this.cubicBezier(seg.p0val, seg.p1val, seg.p2val, seg.p3val, t)
    }
  }

  private buildProfileEvaluator(p: AppleParams): (v: number) => { r: number; z: number } {
    const { height, width, bottomRadius, bottomDepth, maxWidthHeight, topRadius, topDepth, cubicRatio } = p

    const bottomZ = -height / 2
    const topZ = height
    const halfWidth = width / 2

    const v1 = -Math.PI / 2
    const z1 = bottomZ + bottomDepth
    const r1 = 0

    const v2 = Math.atan2(-height / 2, bottomRadius)
    const z2 = bottomZ
    const r2 = bottomRadius

    const v3 = Math.atan2(maxWidthHeight - height / 2, halfWidth)
    const z3 = maxWidthHeight - height / 2
    const r3 = halfWidth

    const v4 = Math.atan2(topZ - height / 2, halfWidth)
    const z4 = topZ + bottomZ // = height / 2
    const r4 = topRadius

    const v5 = Math.PI / 2
    const z5 = topZ - topDepth + bottomZ
    const r5 = 0

    const pointsZ: [number, number][] = [[v1, z1], [v2, z2], [v3, z3], [v4, z4], [v5, z5]]
    const pointsR: [number, number][] = [[v1, r1], [v2, r2], [v3, r3], [v4, r4], [v5, r5]]

    const controlZ = this.calculateBezierControlPoints(pointsZ, 'z', cubicRatio)
    const controlR = this.calculateBezierControlPoints(pointsR, 'r', cubicRatio)

    const evalZ = this.buildBezierEvaluator(pointsZ, controlZ)
    const evalR = this.buildBezierEvaluator(pointsR, controlR)

    return (v: number) => {
      const clampedV = Math.min(Math.max(v, -Math.PI / 2), Math.PI / 2)
      return { r: Math.max(0, evalR(clampedV)), z: evalZ(clampedV) }
    }
  }

  /* ═══════════════════════════════════════════════════
     Lathe geometry generation
     ═══════════════════════════════════════════════════ */

  private generateLatheGeometry(
    profileFunc: (v: number) => { r: number; z: number },
    radialSegments: number,
    heightSegments: number,
  ): THREE.BufferGeometry {
    const step = Math.PI / heightSegments
    const profiles: { r: number; z: number }[] = []
    for (let i = 0; i <= heightSegments; i++) {
      const v = -Math.PI / 2 + i * step
      profiles.push(profileFunc(v))
    }

    const vertices: number[] = []
    const indices: number[] = []
    const uvs: number[] = []

    for (let i = 0; i <= heightSegments; i++) {
      const { r, z } = profiles[i]
      for (let j = 0; j <= radialSegments; j++) {
        const theta = (j / radialSegments) * Math.PI * 2
        vertices.push(r * Math.cos(theta), z, r * Math.sin(theta))
        uvs.push(j / radialSegments, i / heightSegments)
      }
    }

    for (let i = 0; i < heightSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j
        const b = a + 1
        const c = (i + 1) * (radialSegments + 1) + j
        const d = c + 1
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }

  /* ═══════════════════════════════════════════════════
     Bite — compute 3D position from UV coordinates
     and subtract a sphere via CSG
     ═══════════════════════════════════════════════════ */

  private uvTo3D(
    profileFunc: (v: number) => { r: number; z: number },
    u: number, v: number,
  ): THREE.Vector3 {
    const vAngle = -Math.PI / 2 + v * Math.PI
    const { r, z } = profileFunc(vAngle)
    const theta = u * Math.PI * 2
    return new THREE.Vector3(r * Math.cos(theta), z, r * Math.sin(theta))
  }

  private computeBiteWorldRadius(
    profileFunc: (v: number) => { r: number; z: number },
    p: AppleParams,
  ): number {
    const vAngle = -Math.PI / 2 + p.biteV * Math.PI
    const { r } = profileFunc(vAngle)
    const circumference = 2 * Math.PI * r
    const vExtent = p.height * 1.2
    const uWorldSize = circumference * p.biteRadius
    const vWorldSize = vExtent * p.biteRadius
    return (uWorldSize + vWorldSize) / 2
  }

  /* ═══════════════════════════════════════════════════
     Leaf — positioned at top dimple rim, extending outward

     The leaf base is placed at the top dimple rim where
     radius = topRadius, then oriented to extend outward
     and upward from the apple surface.
     ═══════════════════════════════════════════════════ */

  private buildLeaf(p: AppleParams): THREE.Mesh {
    const len = p.leafLength
    const w = p.leafWidth

    // Leaf shape in XY plane: length along +Y, width along ±X
    // Base at origin (0,0), tip at (0, len)
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(w * 0.55, len * 0.2, w * 0.75, len * 0.55, 0, len)
    shape.bezierCurveTo(-w * 0.75, len * 0.55, -w * 0.55, len * 0.2, 0, 0)

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(w * 0.06, 0.001),
      bevelEnabled: false,
      curveSegments: 16,
    })
    // Do NOT center — we want base at origin, tip at +Y
    geo.computeVertexNormals()

    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: '#5e8d38',
        roughness: 0.65,
        side: THREE.DoubleSide,
      }),
    )

    // ── Position: base at top dimple tip ──
    // The dimple tip is the deepest point of the top dimple,
    // on the center axis (r=0), at y = height/2 - topDepth
    const dimpleTipY = p.height / 2 - p.topDepth
    mesh.position.set(0, dimpleTipY, 0)

    // ── Orientation ──
    // Leaf shape already has length along +Y (upward).
    // When leafAngle = π/2 → straight up → no rotation needed.
    // When leafAngle < π/2 → tilt away from vertical by (π/2 - leafAngle)
    // Rotate around Z axis to tilt the leaf in the X direction.
    const tiltFromVertical = Math.PI / 2 - p.leafAngle
    mesh.rotation.z = tiltFromVertical

    return mesh
  }

  /* ═══════════════════════════════════════════════════
     Check if leaf is inside bite region
     ═══════════════════════════════════════════════════ */

  private isLeafInBiteRegion(p: AppleParams): boolean {
    if (!p.biteEnabled) return false
    // Leaf is at the top dimple rim, approximately v ≈ 0.9
    const leafV = 0.9
    const dv = Math.abs(leafV - p.biteV)
    return dv < p.biteRadius * 1.2
  }

  /* ═══════════════════════════════════════════════════
     Rebuild all meshes
     ═══════════════════════════════════════════════════ */

  private rebuild(p: AppleParams) {
    this.clearGroup(this.appleGroup)

    const radial = Math.max(24, Math.floor(p.segments))
    const vertical = Math.max(24, Math.floor(p.segments * 0.8))

    const profileFunc = this.buildProfileEvaluator(p)

    // Generate outer shell geometry
    const outerGeo = this.generateLatheGeometry(profileFunc, radial, vertical)

    // Generate inner shell geometry (slightly smaller)
    const innerProfileFunc = this.buildProfileEvaluator({
      ...p,
      height: p.height - p.shellThickness * 2,
      width: p.width - p.shellThickness * 2,
      bottomRadius: Math.max(0.01, p.bottomRadius - p.shellThickness),
      topRadius: Math.max(0.01, p.topRadius - p.shellThickness),
      bottomDepth: Math.max(0, p.bottomDepth - p.shellThickness * 0.5),
      topDepth: Math.max(0, p.topDepth - p.shellThickness * 0.5),
    })
    const innerGeo = this.generateLatheGeometry(innerProfileFunc, radial, vertical)

    const outerMat = new THREE.MeshStandardMaterial({
      color: '#27ae60',
      roughness: 0.6,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
    const innerMat = new THREE.MeshStandardMaterial({
      color: '#f4d03f',
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })

    if (p.biteEnabled) {
      const biteCenter = this.uvTo3D(profileFunc, p.biteU, p.biteV)
      const biteWorldRadius = this.computeBiteWorldRadius(profileFunc, p)

      const sphereGeo = new THREE.SphereGeometry(biteWorldRadius, 32, 32)
      const sphereMat = new THREE.MeshStandardMaterial()
      const sphereBrush = new Brush(sphereGeo, sphereMat)
      sphereBrush.position.copy(biteCenter)
      sphereBrush.updateMatrixWorld(true)

      // Outer shell with bite
      const outerBrush = new Brush(outerGeo, outerMat)
      outerBrush.updateMatrixWorld(true)
      const outerResult = this.csgEvaluator.evaluate(outerBrush, sphereBrush, SUBTRACTION)
      outerResult.geometry.computeVertexNormals()
      this.appleGroup.add(new THREE.Mesh(outerResult.geometry, outerMat))

      // Inner shell with bite
      const innerBrush = new Brush(innerGeo, innerMat)
      innerBrush.updateMatrixWorld(true)
      const innerResult = this.csgEvaluator.evaluate(innerBrush, sphereBrush, SUBTRACTION)
      innerResult.geometry.computeVertexNormals()
      this.appleGroup.add(new THREE.Mesh(innerResult.geometry, innerMat))

      sphereGeo.dispose()
      sphereMat.dispose()
    } else {
      this.appleGroup.add(new THREE.Mesh(outerGeo, outerMat))
      this.appleGroup.add(new THREE.Mesh(innerGeo, innerMat))
    }

    // Leaf
    if (p.leafEnabled && !this.isLeafInBiteRegion(p)) {
      this.appleGroup.add(this.buildLeaf(p))
    }

    this.appleGroup.rotation.y = p.rotationY
  }

  /* ── animation ── */

  private animate = () => {
    this.animationFrame = requestAnimationFrame(this.animate)
    this.controls.update()

    // Disabled automatic camera transition - user has full control
    // Camera position is now controlled entirely by OrbitControls

    this.renderer.render(this.scene, this.camera)
  }

  /* ── resize ── */

  private resize() {
    const w = Math.max(320, this.container.clientWidth)
    const h = Math.max(360, this.container.clientHeight)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  /* ── cleanup ── */

  private clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const child = group.children.pop()
      if (!child) continue
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        const mat = child.material
        if (Array.isArray(mat)) mat.forEach(m => m.dispose())
        else mat.dispose()
      }
    }
  }
}
