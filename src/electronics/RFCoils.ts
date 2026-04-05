/**
 * RF Coil System
 *
 * Models a Helmholtz-pair RF coil system producing:
 * - Static uniform field B₀
 * - Linear gradient fields Gx, Gy, Gz
 * - Field uniformity metrics
 */

export interface CoilConfig {
  current: number      // [A]
  frequency: number    // [Hz]
  fieldStrength: number
  uniformity: number
  gradientX: number    // [T/m]
  gradientY: number
  gradientZ: number
}

export interface FieldPoint {
  x: number
  y: number
  z: number
  Bx: number
  By: number
  Bz: number
  magnitude: number
}

export class RFCoils {
  private readonly coilRadius: number     // [m]
  private readonly coilSeparation: number // [m]
  private readonly nTurns: number
  private config: CoilConfig

  constructor(config: CoilConfig, coilRadius = 0.15, coilSeparation = 0.15, nTurns = 100) {
    this.config = { ...config }
    this.coilRadius = coilRadius
    this.coilSeparation = coilSeparation
    this.nTurns = nTurns
  }

  update(config: CoilConfig): void {
    this.config = { ...config }
  }

  /**
   * Compute field at a 3D point using Biot–Savart law (on-axis approximation).
   */
  fieldAt(x: number, y: number, z: number): FieldPoint {
    const mu0 = 4 * Math.PI * 1e-7
    const I = this.config.current
    const R = this.coilRadius
    const N = this.nTurns
    const d = this.coilSeparation / 2

    // On-axis field from two coils (Helmholtz configuration)
    const z1 = z - d
    const z2 = z + d
    const denom1 = Math.pow(R * R + z1 * z1, 1.5)
    const denom2 = Math.pow(R * R + z2 * z2, 1.5)
    const Bz0 =
      (mu0 * N * I * R * R) / 2 * (1 / denom1 + 1 / denom2)

    // Add gradient fields
    const Bx = this.config.gradientX * x
    const By = this.config.gradientY * y
    const Bz = Bz0 + this.config.gradientZ * z

    const magnitude = Math.sqrt(Bx * Bx + By * By + Bz * Bz)

    return { x, y, z, Bx, By, Bz, magnitude }
  }

  /**
   * Generate a 3D field map over a grid.
   */
  generateFieldMap(
    extent: number,
    steps: number,
  ): FieldPoint[] {
    const points: FieldPoint[] = []
    const step = (2 * extent) / steps
    for (let ix = 0; ix <= steps; ix++) {
      for (let iy = 0; iy <= steps; iy++) {
        const x = -extent + ix * step
        const y = -extent + iy * step
        points.push(this.fieldAt(x, y, 0))
      }
    }
    return points
  }

  /**
   * Compute field uniformity (1 - ΔB/B₀) over a sphere of given radius.
   */
  uniformity(radius: number, samples = 20): number {
    const fields: number[] = []
    for (let i = 0; i < samples; i++) {
      const theta = (Math.PI * i) / (samples - 1)
      for (let j = 0; j < samples; j++) {
        const phi = (2 * Math.PI * j) / samples
        const x = radius * Math.sin(theta) * Math.cos(phi)
        const y = radius * Math.sin(theta) * Math.sin(phi)
        const z = radius * Math.cos(theta)
        fields.push(this.fieldAt(x, y, z).magnitude)
      }
    }
    const mean = fields.reduce((a, b) => a + b, 0) / fields.length
    const variance =
      fields.reduce((acc, f) => acc + (f - mean) ** 2, 0) / fields.length
    const stdDev = Math.sqrt(variance)
    return mean > 0 ? 1 - stdDev / mean : 0
  }
}
