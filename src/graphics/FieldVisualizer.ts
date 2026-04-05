/**
 * Field Visualiser
 *
 * Renders magnetic field heatmaps, streamlines, and RF field vectors
 * using Three.js instanced geometry for performance.
 */

import * as THREE from 'three'
import type { FieldPoint } from '../electronics/RFCoils'

export class FieldVisualizer {
  private scene: THREE.Scene
  private fieldArrows: THREE.Group
  private heatmapMesh: THREE.Mesh | null = null
  private photonPaths: THREE.Group

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.fieldArrows = new THREE.Group()
    this.photonPaths = new THREE.Group()
    this.scene.add(this.fieldArrows)
    this.scene.add(this.photonPaths)
  }

  /** Update the magnetic field arrow visualisation */
  updateFieldArrows(
    fieldPoints: FieldPoint[],
    visible: boolean,
    intensity: number,
  ): void {
    this.fieldArrows.visible = visible
    if (!visible) return

    // Clear old arrows
    while (this.fieldArrows.children.length > 0) {
      const child = this.fieldArrows.children[0]
      if (child instanceof THREE.ArrowHelper) {
        child.dispose?.()
      }
      this.fieldArrows.remove(child)
    }

    // Sub-sample for performance
    const step = Math.max(1, Math.floor(fieldPoints.length / 64))
    const maxMag = Math.max(...fieldPoints.map((p) => p.magnitude), 1e-20)

    for (let i = 0; i < fieldPoints.length; i += step) {
      const p = fieldPoints[i]
      const mag = p.magnitude / maxMag
      if (mag < 0.01) continue

      const dir = new THREE.Vector3(p.Bx, p.Bz, p.By).normalize()
      const origin = new THREE.Vector3(p.x * 3, -1.5, p.y * 3)
      const length = mag * 0.3 * intensity
      const color = new THREE.Color().setHSL(0.6 - mag * 0.5, 1, 0.5)

      const arrow = new THREE.ArrowHelper(dir, origin, length, color.getHex(), length * 0.3, length * 0.15)
      this.fieldArrows.add(arrow)
    }
  }

  /** Update magnetic field heatmap */
  updateHeatmap(
    fieldPoints: FieldPoint[],
    visible: boolean,
    intensity: number,
    gridSize: number,
  ): void {
    // Remove old heatmap
    if (this.heatmapMesh) {
      this.scene.remove(this.heatmapMesh)
      this.heatmapMesh.geometry.dispose()
      ;(this.heatmapMesh.material as THREE.Material).dispose()
      this.heatmapMesh = null
    }
    if (!visible) return

    const size = gridSize + 1
    const geo = new THREE.PlaneGeometry(6, 6, gridSize, gridSize)
    const positions = geo.attributes['position']
    const colors = new Float32Array(positions.count * 3)

    const magnitudes = fieldPoints.map((p) => p.magnitude)
    const maxMag = Math.max(...magnitudes, 1e-20)

    for (let i = 0; i < positions.count; i++) {
      const t = i < fieldPoints.length ? (fieldPoints[i].magnitude / maxMag) * intensity : 0
      const c = new THREE.Color().setHSL(0.66 - t * 0.66, 1, 0.3 + t * 0.5)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    })

    this.heatmapMesh = new THREE.Mesh(geo, mat)
    this.heatmapMesh.rotation.x = -Math.PI / 2
    this.heatmapMesh.position.y = -1.9
    this.scene.add(this.heatmapMesh)
  }

  /** Update photon propagation paths */
  updatePhotonPaths(
    pathCount: number,
    visible: boolean,
    time: number,
  ): void {
    this.photonPaths.visible = visible
    if (!visible) return

    // Clear old paths
    while (this.photonPaths.children.length > 0) {
      const child = this.photonPaths.children[0] as THREE.Line
      child.geometry.dispose()
      ;(child.material as THREE.Material).dispose()
      this.photonPaths.remove(child)
    }

    for (let p = 0; p < pathCount; p++) {
      const phase = (p / pathCount) * Math.PI * 2 + time * 2
      const points: THREE.Vector3[] = []

      // Helical photon path
      for (let i = 0; i <= 40; i++) {
        const t = i / 40
        const angle = phase + t * Math.PI * 4
        const r = 0.15 + 0.05 * Math.sin(t * Math.PI * 8)
        points.push(new THREE.Vector3(
          r * Math.cos(angle),
          -0.3 + t * 0.6,
          r * Math.sin(angle),
        ))
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const hue = p / pathCount
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.7),
        transparent: true,
        opacity: 0.8,
      })
      this.photonPaths.add(new THREE.Line(geo, mat))
    }

    this.photonPaths.position.set(0, 1.65, 0)
  }

  dispose(): void {
    if (this.heatmapMesh) {
      this.heatmapMesh.geometry.dispose()
      ;(this.heatmapMesh.material as THREE.Material).dispose()
    }
    this.scene.remove(this.fieldArrows)
    this.scene.remove(this.photonPaths)
  }
}
