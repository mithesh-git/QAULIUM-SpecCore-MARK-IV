/**
 * Three.js Scene Manager
 *
 * Manages the WebGL renderer, scene graph, camera, and animation loop
 * for the MARK-IV 3D visualisation.
 */

import * as THREE from 'three'

export interface SceneConfig {
  antialias: boolean
  shadowMap: boolean
  pixelRatio: number
}

export class ThreeSceneManager {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  private animationId: number | null = null
  private onRenderCallbacks: Array<(dt: number) => void> = []
  private clock: THREE.Clock

  constructor(canvas: HTMLCanvasElement, config: SceneConfig) {
    this.clock = new THREE.Clock()

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: config.antialias,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    })
    this.renderer.setPixelRatio(config.pixelRatio)
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    this.renderer.shadowMap.enabled = config.shadowMap
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0e27)
    this.scene.fog = new THREE.FogExp2(0x0a0e27, 0.08)

    this.camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.01,
      100,
    )
    this.camera.position.set(5, 4, 5)
    this.camera.lookAt(0, 0, 0)

    this.setupLighting()
    this.setupOrbitControls()
  }

  private setupLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x111133, 0.8)
    this.scene.add(ambient)

    // Key light (cyan tint to match UI)
    const key = new THREE.DirectionalLight(0x00d4ff, 1.5)
    key.position.set(5, 8, 3)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    this.scene.add(key)

    // Fill light
    const fill = new THREE.DirectionalLight(0xff00ff, 0.4)
    fill.position.set(-5, 2, -3)
    this.scene.add(fill)

    // Rim light
    const rim = new THREE.PointLight(0x00ff88, 0.6, 20)
    rim.position.set(0, 5, -5)
    this.scene.add(rim)
  }

  private setupOrbitControls(): void {
    // Minimal orbit controls implemented directly
    let isDragging = false
    let prevX = 0
    let prevY = 0
    let theta = Math.PI / 4
    let phi = Math.PI / 4
    let radius = 8

    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true
      prevX = e.clientX
      prevY = e.clientY
    })

    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      const dx = e.clientX - prevX
      const dy = e.clientY - prevY
      theta -= dx * 0.01
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + dy * 0.01))
      prevX = e.clientX
      prevY = e.clientY
      this.updateCameraFromSpherical(theta, phi, radius)
    })

    canvas.addEventListener('mouseup', () => { isDragging = false })
    canvas.addEventListener('mouseleave', () => { isDragging = false })

    canvas.addEventListener('wheel', (e) => {
      radius = Math.max(2, Math.min(20, radius + e.deltaY * 0.01))
      this.updateCameraFromSpherical(theta, phi, radius)
    })

    // Touch support
    let lastTouchDist = 0
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true
        prevX = e.touches[0].clientX
        prevY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
      }
    })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - prevX
        const dy = e.touches[0].clientY - prevY
        theta -= dx * 0.01
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + dy * 0.01))
        prevX = e.touches[0].clientX
        prevY = e.touches[0].clientY
        this.updateCameraFromSpherical(theta, phi, radius)
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        radius *= lastTouchDist / dist
        radius = Math.max(2, Math.min(20, radius))
        lastTouchDist = dist
        this.updateCameraFromSpherical(theta, phi, radius)
      }
    }, { passive: false })

    canvas.addEventListener('touchend', () => { isDragging = false })
  }

  private updateCameraFromSpherical(theta: number, phi: number, r: number): void {
    this.camera.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    )
    this.camera.lookAt(0, 0, 0)
  }

  onRender(cb: (dt: number) => void): void {
    this.onRenderCallbacks.push(cb)
  }

  start(): void {
    if (this.animationId !== null) return
    const loop = () => {
      this.animationId = requestAnimationFrame(loop)
      const dt = this.clock.getDelta()
      for (const cb of this.onRenderCallbacks) cb(dt)
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  dispose(): void {
    this.stop()
    this.renderer.dispose()
  }
}
