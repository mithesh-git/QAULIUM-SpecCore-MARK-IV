/**
 * FPGA Controller Simulation
 *
 * Models an FPGA-based quantum control system with:
 * - Clock management
 * - Gate timing
 * - Temperature-dependent performance
 */

export interface FPGAConfig {
  clockFrequency: number
  gateCount: number
  temperature: number
  enabled: boolean
}

export interface FPGAStatus {
  clockFrequency: number
  utilisation: number
  temperature: number
  powerConsumption: number
  timingMargin: number
  errorRate: number
}

export class FPGAController {
  private config: FPGAConfig

  constructor(config: FPGAConfig) {
    this.config = { ...config }
  }

  update(config: FPGAConfig): void {
    this.config = { ...config }
  }

  getStatus(): FPGAStatus {
    const { clockFrequency, gateCount, temperature } = this.config

    // Thermal derating: 0.5% per °C above 25°C
    const thermalDerate = Math.max(0, (temperature - 25) * 0.005)
    const effectiveClock = clockFrequency * (1 - thermalDerate)

    // Utilisation based on gate count
    const maxGates = 500_000
    const utilisation = Math.min(gateCount / maxGates, 1.0)

    // Power: P ∝ f * C * V²
    const powerConsumption = (effectiveClock / 1e9) * utilisation * 5.0

    // Timing margin decreases with temperature and utilisation
    const timingMargin = Math.max(0, 1 - thermalDerate - utilisation * 0.3)

    // Error rate increases with temperature above 70°C
    const errorRate = temperature > 70 ? Math.pow(10, -(8 - (temperature - 70) * 0.1)) : 1e-8

    return {
      clockFrequency: effectiveClock,
      utilisation,
      temperature,
      powerConsumption,
      timingMargin,
      errorRate,
    }
  }

  /** Generate quantum gate timing pulse sequence */
  generatePulseSequence(
    gateType: 'X' | 'Y' | 'Z' | 'H' | 'CNOT',
    rabiFrequency: number,
  ): { timing: number[]; amplitude: number[] } {
    const clockPeriod = 1 / this.config.clockFrequency
    const pulseDuration = rabiFrequency > 0 ? Math.PI / (2 * rabiFrequency) : 1e-7
    const pulseSteps = Math.max(1, Math.round(pulseDuration / clockPeriod))

    const timing: number[] = []
    const amplitude: number[] = []

    for (let i = 0; i < pulseSteps; i++) {
      timing.push(i * clockPeriod)
      // DRAG pulse envelope: Gaussian with derivative correction
      const t = (i / pulseSteps - 0.5) * 2
      const envelope = Math.exp(-t * t * 2)
      const scale = gateType === 'CNOT' ? 2 : 1
      amplitude.push(envelope * scale)
    }

    return { timing, amplitude }
  }
}
