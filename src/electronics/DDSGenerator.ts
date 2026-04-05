/**
 * DDS Signal Generator Simulation
 *
 * Models a Direct Digital Synthesis signal generator with:
 * - Exact phase accumulator model
 * - Spurious-free dynamic range calculation
 * - Phase noise model
 */

export interface DDSConfig {
  frequency: number
  amplitude: number
  phase: number
  waveform: 'sine' | 'square' | 'triangle'
  enabled: boolean
}

export interface DDSOutput {
  frequency: number
  amplitude: number
  phase: number
  sfdr: number          // Spurious-free dynamic range [dBc]
  phaseNoise: number    // Phase noise [dBc/Hz at 1 kHz offset]
  powerSpectralDensity: number
  snr: number           // Signal-to-noise ratio [dB]
}

export class DDSGenerator {
  private readonly sysclk: number
  private readonly phaseAccBits: number
  private config: DDSConfig

  constructor(config: DDSConfig, sysclk = 1e9, phaseAccBits = 48) {
    this.config = { ...config }
    this.sysclk = sysclk
    this.phaseAccBits = phaseAccBits
  }

  update(config: DDSConfig): void {
    this.config = { ...config }
  }

  getOutput(): DDSOutput {
    const { frequency, amplitude, phase, enabled } = this.config

    if (!enabled) {
      return {
        frequency: 0,
        amplitude: 0,
        phase: 0,
        sfdr: 0,
        phaseNoise: -200,
        powerSpectralDensity: -Infinity,
        snr: 0,
      }
    }

    // Frequency tuning word
    const ftw = Math.round((frequency / this.sysclk) * Math.pow(2, this.phaseAccBits))
    const actualFrequency = (ftw / Math.pow(2, this.phaseAccBits)) * this.sysclk

    // SFDR model: -6 dB per output bit (typical DDS)
    const dacBits = 12
    const sfdr = 6 * dacBits - 20 * Math.log10(Math.PI) - 10

    // Phase noise: approximately -130 dBc/Hz at 1 kHz offset for 1 GHz clock
    const phaseNoise = -130 - 20 * Math.log10(this.sysclk / 1e9)

    // Signal power in dBm
    const powerDbm = 10 * Math.log10(amplitude * amplitude * 500) + 30

    // SNR from quantisation noise
    const snr = 6.02 * dacBits + 1.76

    return {
      frequency: actualFrequency,
      amplitude: enabled ? amplitude : 0,
      phase,
      sfdr,
      phaseNoise,
      powerSpectralDensity: powerDbm,
      snr,
    }
  }

  /**
   * Sample the output waveform at time t [seconds].
   */
  sample(t: number): number {
    if (!this.config.enabled) return 0
    const { frequency, amplitude, phase, waveform } = this.config
    const theta = 2 * Math.PI * frequency * t + phase

    switch (waveform) {
      case 'sine':
        return amplitude * Math.sin(theta)
      case 'square':
        return amplitude * Math.sign(Math.sin(theta))
      case 'triangle': {
        const normalized = ((theta / Math.PI) % 2 + 2) % 2
        return amplitude * (normalized < 1 ? normalized * 2 - 1 : 3 - normalized * 2)
      }
    }
  }

  /**
   * Generate N samples at given sample rate [Hz].
   */
  generateSamples(nSamples: number, sampleRate: number): Float32Array {
    const out = new Float32Array(nSamples)
    for (let i = 0; i < nSamples; i++) {
      out[i] = this.sample(i / sampleRate)
    }
    return out
  }
}
