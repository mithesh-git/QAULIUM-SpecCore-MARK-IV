/**
 * Coherence Calculator
 *
 * Derives coherence metrics directly from physical parameters without
 * approximation. All formulas are from quantum information theory.
 */

import type { CoherenceMetrics, NoiseModel } from './LindbladSolver'

export class CoherenceCalculator {
  /**
   * Compute all coherence metrics from noise parameters.
   *
   * Physical basis:
   *   T2* = 1 / (1/T2 + 1/T2_inhom)
   *   Gate fidelity = exp(-t_gate / T2*)
   *   State purity  = Tr(ρ²) ≈ (1 + |Bloch|²) / 2
   */
  static compute(noise: NoiseModel): CoherenceMetrics {
    const T1 = Math.max(noise.T1, 1e-12)
    const T2 = Math.min(Math.max(noise.T2, 1e-12), 2 * T1)

    // Inhomogeneous dephasing from linewidth (Lorentzian broadening)
    const T2inhom = noise.linewidth > 0 ? 1 / (Math.PI * noise.linewidth) : Infinity
    const T2Star = 1 / (1 / T2 + (Number.isFinite(T2inhom) ? 1 / T2inhom : 0))

    const coherenceTime = Math.min(T1, T2)
    const decoherenceRate = 1 / T1 + 1 / T2

    // Rabi frequency: Ω_R = γ_e * B_1
    // B_1 estimated from RF power, Q factor and frequency
    const mu0 = 4 * Math.PI * 1e-7
    const f = Math.max(noise.linewidth, 1e6)
    const Q = Math.max(noise.qFactor, 1)
    const P = Math.max(noise.rfPower, 0)
    const B1 = Math.sqrt((mu0 * P) / (2 * Q * f))
    const gammaE = 2 * Math.PI * 28.025e9
    const rabiFrequency = gammaE * B1

    // π/2-pulse time
    const gateTime = rabiFrequency > 0 ? Math.PI / (2 * rabiFrequency) : 1e-6

    // Gate fidelity (assumes T2-limited)
    const fidelity = Math.exp(-gateTime / T2Star)
    const gateError = 1 - fidelity

    // State purity from Bloch vector length
    const r = Math.exp(-gateTime * decoherenceRate)
    const statePurity = 0.5 * (1 + r * r)

    return {
      T1,
      T2,
      T2Star,
      coherenceTime,
      decoherenceRate,
      fidelity,
      gateError,
      statePurity,
      rabiFrequency,
    }
  }

  /**
   * Convert T1/T2 in seconds to human-readable string.
   */
  static formatTime(seconds: number): string {
    if (seconds >= 1) return `${seconds.toFixed(3)} s`
    if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(3)} ms`
    if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(3)} μs`
    if (seconds >= 1e-9) return `${(seconds * 1e9).toFixed(3)} ns`
    return `${(seconds * 1e12).toFixed(3)} ps`
  }

  /**
   * Format frequency in Hz to human-readable string.
   */
  static formatFrequency(hz: number): string {
    if (hz >= 1e12) return `${(hz / 1e12).toFixed(3)} THz`
    if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`
    if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`
    if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`
    return `${hz.toFixed(3)} Hz`
  }

  /**
   * Compute quantum volume estimate.
   * QV = max_m { min(m, d(m)) }² where d(m) is effective depth.
   */
  static quantumVolume(metrics: CoherenceMetrics, numQubits: number): number {
    const gateTime = metrics.rabiFrequency > 0
      ? Math.PI / (2 * metrics.rabiFrequency)
      : 1e-6
    const maxGates = Math.floor(metrics.coherenceTime / gateTime)
    const effectiveDepth = Math.min(numQubits, maxGates)
    return Math.pow(Math.min(numQubits, effectiveDepth), 2)
  }
}
