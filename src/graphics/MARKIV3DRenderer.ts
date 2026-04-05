/**
 * MARK-IV 3D Renderer
 *
 * Renders the full MARK-IV 300 mm tower with:
 * - Main tower chassis
 * - 5 mm × 5 mm photonic chip with 8 micro-ring resonators
 * - 8×8 Mach–Zehnder interferometer mesh
 * - YIG thin film substrate
 * - RF coils
 */

import * as THREE from 'three'

export interface RenderConfig {
  showMZIMesh: boolean
  showYIGFilm: boolean
  showCoordinates: boolean
  animationSpeed: number
}

export class MARKIV3DRenderer {
  private scene: THREE.Scene
  private tower: THREE.Group
  private photonicChip: THREE.Group
  private mziMesh: THREE.Group
  private yigFilm: THREE.Mesh | null = null
  private rfCoils: THREE.Group
  private coordinateAxes: THREE.AxesHelper | null = null
  private rings: THREE.Mesh[] = []
  private mziNodes: THREE.Mesh[] = []
  private time = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.tower = new THREE.Group()
    this.photonicChip = new THREE.Group()
    this.mziMesh = new THREE.Group()
    this.rfCoils = new THREE.Group()
    this.buildScene()
  }

  private buildScene(): void {
    this.buildTower()
    this.buildPhotonicChip()
    this.buildMZIMesh()
    this.buildYIGFilm()
    this.buildRFCoils()
    this.buildCoordinateAxes()
    this.buildGridFloor()

    this.scene.add(this.tower)
    this.scene.add(this.photonicChip)
    this.scene.add(this.mziMesh)
    this.scene.add(this.rfCoils)
  }

  private buildTower(): void {
    // Main chassis cylinder (300 mm = 3 units)
    const bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 3.0, 32)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 1.0,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0
    body.castShadow = true
    body.receiveShadow = true
    this.tower.add(body)

    // Top cap
    const topGeo = new THREE.CylinderGeometry(0.62, 0.6, 0.1, 32)
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x003355,
      emissiveIntensity: 0.3,
    })
    const top = new THREE.Mesh(topGeo, capMat)
    top.position.y = 1.55
    this.tower.add(top)

    // Base plate
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 32)
    const base = new THREE.Mesh(baseGeo, capMat)
    base.position.y = -1.54
    this.tower.add(base)

    // Cooling fins
    for (let i = 0; i < 8; i++) {
      const finGeo = new THREE.BoxGeometry(0.05, 2.4, 0.3)
      const finMat = new THREE.MeshStandardMaterial({
        color: 0x334455,
        metalness: 0.8,
        roughness: 0.3,
      })
      const fin = new THREE.Mesh(finGeo, finMat)
      const angle = (i / 8) * Math.PI * 2
      fin.position.set(0.75 * Math.cos(angle), 0, 0.75 * Math.sin(angle))
      fin.rotation.y = angle
      this.tower.add(fin)
    }

    // Indicator LEDs
    for (let i = 0; i < 4; i++) {
      const ledGeo = new THREE.SphereGeometry(0.02, 8, 8)
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 2,
      })
      const led = new THREE.Mesh(ledGeo, ledMat)
      led.position.set(0.62, 0.5 + i * 0.3, 0)
      this.tower.add(led)

      // LED glow point light
      const glow = new THREE.PointLight(0x00ff88, 0.2, 0.5)
      glow.position.copy(led.position)
      this.tower.add(glow)
    }

    this.tower.position.set(0, 0, 0)
  }

  private buildPhotonicChip(): void {
    // Photonic chip substrate (5 mm × 5 mm = 0.5 × 0.5 units)
    const subGeo = new THREE.BoxGeometry(0.5, 0.02, 0.5)
    const subMat = new THREE.MeshStandardMaterial({
      color: 0x002244,
      metalness: 0.1,
      roughness: 0.5,
      transparent: true,
      opacity: 0.9,
    })
    const substrate = new THREE.Mesh(subGeo, subMat)
    this.photonicChip.add(substrate)

    // 8 micro-ring resonators
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const r = 0.18
      const ringGeo = new THREE.TorusGeometry(0.035, 0.005, 8, 32)
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        emissive: 0x002244,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.2,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.set(r * Math.cos(angle), 0.015, r * Math.sin(angle))
      this.rings.push(ring)
      this.photonicChip.add(ring)
    }

    // Waveguides connecting rings (thin cylinders)
    const wgMat = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x000033,
      emissiveIntensity: 0.3,
    })
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2
      const a1 = ((i + 1) / 8) * Math.PI * 2
      const r = 0.18
      const x0 = r * Math.cos(a0)
      const z0 = r * Math.sin(a0)
      const x1 = r * Math.cos(a1)
      const z1 = r * Math.sin(a1)
      const dx = x1 - x0
      const dz = z1 - z0
      const length = Math.sqrt(dx * dx + dz * dz)
      const wgGeo = new THREE.CylinderGeometry(0.002, 0.002, length, 4)
      const wg = new THREE.Mesh(wgGeo, wgMat)
      wg.position.set((x0 + x1) / 2, 0.015, (z0 + z1) / 2)
      wg.rotation.z = Math.PI / 2
      wg.rotation.y = Math.atan2(dz, dx)
      this.photonicChip.add(wg)
    }

    this.photonicChip.position.set(0, 1.65, 0)
  }

  private buildMZIMesh(): void {
    const size = 8
    const spacing = 0.08
    const offset = -(size - 1) * spacing / 2

    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0x330033,
      emissiveIntensity: 0.5,
    })
    const linkMat = new THREE.MeshStandardMaterial({
      color: 0xaa00aa,
      transparent: true,
      opacity: 0.6,
    })

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = offset + i * spacing
        const z = offset + j * spacing

        const nodeGeo = new THREE.SphereGeometry(0.012, 8, 8)
        const node = new THREE.Mesh(nodeGeo, nodeMat)
        node.position.set(x, 0.03, z)
        this.mziNodes.push(node)
        this.mziMesh.add(node)

        // Horizontal links
        if (i < size - 1) {
          const linkGeo = new THREE.CylinderGeometry(0.003, 0.003, spacing, 4)
          const link = new THREE.Mesh(linkGeo, linkMat)
          link.position.set(x + spacing / 2, 0.03, z)
          link.rotation.z = Math.PI / 2
          this.mziMesh.add(link)
        }

        // Vertical links
        if (j < size - 1) {
          const linkGeo = new THREE.CylinderGeometry(0.003, 0.003, spacing, 4)
          const link = new THREE.Mesh(linkGeo, linkMat)
          link.position.set(x, 0.03, z + spacing / 2)
          link.rotation.x = Math.PI / 2
          this.mziMesh.add(link)
        }
      }
    }

    this.mziMesh.position.set(0, 1.65, 0)
  }

  private buildYIGFilm(): void {
    const geo = new THREE.BoxGeometry(0.4, 0.003, 0.4)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.7,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0x221100,
      emissiveIntensity: 0.4,
    })
    this.yigFilm = new THREE.Mesh(geo, mat)
    this.yigFilm.position.set(0, 1.62, 0)
    this.scene.add(this.yigFilm)
  }

  private buildRFCoils(): void {
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0xcc8800,
      metalness: 0.9,
      roughness: 0.2,
    })

    for (let ring = 0; ring < 2; ring++) {
      const coilGeo = new THREE.TorusGeometry(1.0, 0.025, 8, 64)
      const coil = new THREE.Mesh(coilGeo, coilMat)
      coil.position.y = ring === 0 ? -0.5 : 0.5
      coil.rotation.x = Math.PI / 2
      this.rfCoils.add(coil)
    }
  }

  private buildCoordinateAxes(): void {
    this.coordinateAxes = new THREE.AxesHelper(2)
    this.coordinateAxes.position.set(-2.5, -1.8, -2.5)
    this.scene.add(this.coordinateAxes)
  }

  private buildGridFloor(): void {
    const grid = new THREE.GridHelper(10, 20, 0x003355, 0x001122)
    grid.position.y = -2.0
    this.scene.add(grid)
  }

  update(
    dt: number,
    config: RenderConfig,
    coherence: number,
    rfPower: number,
  ): void {
    this.time += dt

    // Animate micro-ring resonators
    const speed = config.animationSpeed
    for (let i = 0; i < this.rings.length; i++) {
      const mat = this.rings[i].material as THREE.MeshStandardMaterial
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 5 * speed + i * Math.PI / 4)
      mat.emissiveIntensity = 0.3 + coherence * 0.8 * pulse
    }

    // Animate MZI nodes
    for (let i = 0; i < this.mziNodes.length; i++) {
      const mat = this.mziNodes[i].material as THREE.MeshStandardMaterial
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 8 * speed + i * 0.3)
      mat.emissiveIntensity = 0.3 + rfPower * 0.5 * pulse
    }

    // Animate YIG film
    if (this.yigFilm) {
      this.yigFilm.visible = config.showYIGFilm
      const mat = this.yigFilm.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.2 + 0.4 * Math.sin(this.time * 3 * speed)
    }

    // Toggle MZI mesh visibility
    this.mziMesh.visible = config.showMZIMesh

    // Toggle coordinate axes
    if (this.coordinateAxes) {
      this.coordinateAxes.visible = config.showCoordinates
    }

    // Slow tower rotation
    this.tower.rotation.y += 0.002 * speed
  }

  dispose(): void {
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }
}
