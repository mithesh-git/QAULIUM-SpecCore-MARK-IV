/**
 * Hamiltonian Engine
 *
 * Builds Hamiltonians for:
 * - NV-center spin in external magnetic field
 * - Coupled photonic resonators (coupled mode theory)
 * - Kerr nonlinear resonator
 * - YIG ferromagnetic resonance
 */

export interface MagneticParams {
  B0: number  // static field strength [T]
  Bx: number  // x-gradient component [T]
  By: number  // y-gradient component [T]
  Bz: number  // z-gradient component [T]
}

export interface PhotonicParams {
  couplingStrength: number   // κ [Hz]
  resonatorFreq: number      // ω₀ [Hz]
  kerr: number               // χ nonlinearity [Hz]
  photonCount: number        // mean photon number
}

/** 2×2 complex Hamiltonian */
export type Hamiltonian = { re: number[][]; im: number[][] }

export class HamiltonianEngine {
  private static readonly HBAR = 1.0545718e-34  // J·s
  private static readonly GAMMA_E = 2 * Math.PI * 28.025e9  // rad/(s·T)

  /**
   * NV-centre Hamiltonian in a static field B0 along z-axis (spin-1/2).
   * H = ½ ħ γ_e B₀ σ_z + driving terms
   */
  static nvCenterHamiltonian(
    mag: MagneticParams,
    drivingFreq: number,
    drivingAmplitude: number,
  ): Hamiltonian {
    const omega0 = this.GAMMA_E * mag.B0
    const delta = omega0 - 2 * Math.PI * drivingFreq
    const omegaR = this.GAMMA_E * drivingAmplitude * 0.5

    return {
      re: [
        [delta / 2, omegaR / 2],
        [omegaR / 2, -delta / 2],
      ],
      im: [[0, 0], [0, 0]],
    }
  }

  /**
   * Coupled photonic resonator Hamiltonian.
   * H = ω₀(a†a + b†b) + κ(a†b + ab†)
   * Represented in two-mode Fock basis |10⟩,|01⟩
   */
  static coupledResonatorHamiltonian(params: PhotonicParams): Hamiltonian {
    const omega = 2 * Math.PI * params.resonatorFreq
    const kappa = 2 * Math.PI * params.couplingStrength

    return {
      re: [
        [omega, kappa],
        [kappa, omega],
      ],
      im: [[0, 0], [0, 0]],
    }
  }

  /**
   * Kerr nonlinear resonator.
   * H = ω₀ a†a + ½ χ (a†a)²
   * In Fock basis {|0⟩, |1⟩, |2⟩}
   */
  static kerrHamiltonian(
    resonatorFreq: number,
    kerr: number,
    dim = 3,
  ): { re: number[][]; im: number[][] } {
    const omega = 2 * Math.PI * resonatorFreq
    const chi = 2 * Math.PI * kerr
    const re = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
    const im = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
    for (let n = 0; n < dim; n++) {
      re[n][n] = omega * n + 0.5 * chi * n * n
    }
    return { re, im }
  }

  /**
   * YIG ferromagnetic resonance Hamiltonian.
   * H = γ_YIG * B₀ * Sz + anisotropy
   */
  static yigHamiltonian(mag: MagneticParams, anisotropyField: number): Hamiltonian {
    const gammaYIG = 2 * Math.PI * 28.0e9  // rad/(s·T), similar to NV
    const omega = gammaYIG * (mag.B0 + anisotropyField)

    return {
      re: [
        [omega / 2, 0],
        [0, -omega / 2],
      ],
      im: [[0, 0], [0, 0]],
    }
  }

  /**
   * Compute time evolution operator U(t) = exp(-iHt) via truncated expansion.
   * Uses 10-term Taylor series; accurate for ||Ht|| ≪ 1.
   */
  static evolutionOperator(H: Hamiltonian, t: number): Hamiltonian {
    const dim = H.re.length
    // U = Σ (-it)^n / n! * H^n
    let Ur: number[][] = Array.from({ length: dim }, (_, i) =>
      Array.from({ length: dim }, (__, j) => (i === j ? 1 : 0)),
    )
    let Ui: number[][] = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))

    let HnRe = Ur.map((r) => [...r])
    let HnIm = Ui.map((r) => [...r])

    let factInv = 1
    for (let n = 1; n <= 10; n++) {
      factInv /= n
      // H^n = H^{n-1} · H
      const newHnRe = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
      const newHnIm = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          for (let k = 0; k < dim; k++) {
            newHnRe[i][j] += HnRe[i][k] * H.re[k][j] - HnIm[i][k] * H.im[k][j]
            newHnIm[i][j] += HnRe[i][k] * H.im[k][j] + HnIm[i][k] * H.re[k][j]
          }
        }
      }
      HnRe = newHnRe
      HnIm = newHnIm

      // (-it)^n = (-i)^n * t^n
      // (-i)^n cycles: n=1→-i, n=2→-1, n=3→i, n=4→1
      const tn = Math.pow(t, n) * factInv
      const phase = n % 4
      let cr = 0
      let ci = 0
      if (phase === 0) { cr = tn; ci = 0 }
      else if (phase === 1) { cr = 0; ci = -tn }
      else if (phase === 2) { cr = -tn; ci = 0 }
      else { cr = 0; ci = tn }

      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          Ur[i][j] += cr * HnRe[i][j] - ci * HnIm[i][j]
          Ui[i][j] += cr * HnIm[i][j] + ci * HnRe[i][j]
        }
      }
    }

    return { re: Ur, im: Ui }
  }

  /**
   * Compute spin expectation values ⟨σ_x⟩, ⟨σ_y⟩, ⟨σ_z⟩ from density matrix.
   */
  static spinExpectations(rho: {
    real: number[][]
    imag: number[][]
  }): { x: number; y: number; z: number } {
    const r = rho.real
    const im = rho.imag
    return {
      x: 2 * r[0][1],
      y: 2 * im[1][0],
      z: r[0][0] - r[1][1],
    }
  }
}
