/**
 * Power System Simulation
 *
 * Models the MARK-IV power supply with:
 * - Voltage regulation
 * - Current monitoring
 * - Thermal management
 */

export interface PowerConfig {
  voltage: number
  current: number
  temperature: number
  efficiency: number
}

export interface PowerStatus {
  voltage: number
  current: number
  power: number
  temperature: number
  efficiency: number
  heatDissipation: number
  thermalMargin: number
  regulationError: number
}

export class PowerSystem {
  private config: PowerConfig
  private readonly maxTemperature = 85  // °C

  constructor(config: PowerConfig) {
    this.config = { ...config }
  }

  update(config: PowerConfig): void {
    this.config = { ...config }
  }

  getStatus(): PowerStatus {
    const { voltage, current, temperature, efficiency } = this.config

    const power = voltage * current
    const heatDissipation = power * (1 - efficiency)

    // Temperature rise model: ΔT = R_thermal * P_loss
    const thermalResistance = 5  // °C/W
    const steadyStateTemp = temperature + thermalResistance * heatDissipation

    const thermalMargin = this.maxTemperature - steadyStateTemp

    // Regulation error: typically <0.1%
    const regulationError = 0.001 * (1 + (temperature - 25) / 100)

    return {
      voltage,
      current,
      power,
      temperature: steadyStateTemp,
      efficiency,
      heatDissipation,
      thermalMargin,
      regulationError,
    }
  }
}
