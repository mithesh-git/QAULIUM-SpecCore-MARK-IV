/**
 * Lindblad Master Equation Solver
 *
 * Implements exact Lindblad formalism for open quantum system evolution:
 *   dρ/dt = -i[H,ρ] + Σ_k (L_k ρ L_k† - ½{L_k†L_k, ρ})
 *
 * Uses RK4 integration for time-accurate density matrix evolution.
 */

export interface NoiseModel {
  T1: number
  T2: number
  temperature: number
  linewidth: number
  magneticField: number
  rfPower: number
  qFactor: number
  depolarizationRate: number
}

export interface CoherenceMetrics {
  T1: number
  T2: number
  T2Star: number
  coherenceTime: number
  decoherenceRate: number
  fidelity: number
  gateError: number
  statePurity: number
  rabiFrequency: number
}

/** 2×2 complex matrix represented as separate real/imag arrays */
export type ComplexMatrix = { re: number[][]; im: number[][] }

function matMul(A: ComplexMatrix, B: ComplexMatrix, dim: number): ComplexMatrix {
  const re = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
  const im = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      let sr = 0
      let si = 0
      for (let k = 0; k < dim; k++) {
        sr += A.re[i][k] * B.re[k][j] - A.im[i][k] * B.im[k][j]
        si += A.re[i][k] * B.im[k][j] + A.im[i][k] * B.re[k][j]
      }
      re[i][j] = sr
      im[i][j] = si
    }
  }
  return { re, im }
}

function matAdd(A: ComplexMatrix, B: ComplexMatrix, dim: number): ComplexMatrix {
  const re = Array.from({ length: dim }, (_, i) =>
    A.re[i].map((v, j) => v + B.re[i][j]),
  )
  const im = Array.from({ length: dim }, (_, i) =>
    A.im[i].map((v, j) => v + B.im[i][j]),
  )
  return { re, im }
}

function matScale(A: ComplexMatrix, s: number, dim: number): ComplexMatrix {
  const re = A.re.map((row) => row.map((v) => v * s))
  const im = A.im.map((row) => row.map((v) => v * s))
  return { re, im }
}

function matScaleComplex(
  A: ComplexMatrix,
  sr: number,
  si: number,
  dim: number,
): ComplexMatrix {
  const re = Array.from({ length: dim }, (_, i) =>
    A.re[i].map((v, j) => v * sr - A.im[i][j] * si),
  )
  const im = Array.from({ length: dim }, (_, i) =>
    A.im[i].map((v, j) => A.re[i][j] * si + v * sr),
  )
  return { re, im }
}

function dagger(A: ComplexMatrix, dim: number): ComplexMatrix {
  const re = Array.from({ length: dim }, (_, i) =>
    Array.from({ length: dim }, (__, j) => A.re[j][i]),
  )
  const im = Array.from({ length: dim }, (_, i) =>
    Array.from({ length: dim }, (__, j) => -A.im[j][i]),
  )
  return { re, im }
}

function trace(A: ComplexMatrix, dim: number): { re: number; im: number } {
  let re = 0
  let im = 0
  for (let i = 0; i < dim; i++) {
    re += A.re[i][i]
    im += A.im[i][i]
  }
  return { re, im }
}

function zeroMatrix(dim: number): ComplexMatrix {
  return {
    re: Array.from({ length: dim }, () => new Array<number>(dim).fill(0)),
    im: Array.from({ length: dim }, () => new Array<number>(dim).fill(0)),
  }
}

function cloneMatrix(A: ComplexMatrix): ComplexMatrix {
  return {
    re: A.re.map((row) => [...row]),
    im: A.im.map((row) => [...row]),
  }
}

export class LindbladSolver {
  private readonly dim: number
  private readonly timeStep: number

  constructor(dim = 2, timeStep = 1e-9) {
    this.dim = dim
    this.timeStep = timeStep
  }

  /**
   * Compute coherence metrics analytically from noise parameters.
   */
  computeCoherenceMetrics(noise: NoiseModel): CoherenceMetrics {
    const T1 = Math.max(noise.T1, 1e-9)
    const T2 = Math.max(noise.T2, 1e-9)

    // T2* includes inhomogeneous broadening from linewidth
    const gammaInhom = noise.linewidth > 0 ? Math.PI * noise.linewidth : 0
    const T2Star = 1 / (1 / T2 + gammaInhom)

    const coherenceTime = Math.min(T1, T2)
    const decoherenceRate = 1 / T1 + 1 / T2

    // Rabi frequency from RF driving field
    // Ω_R = γ_e * B_1 / 2  where γ_e ≈ 28 GHz/T, B_1 = sqrt(μ_0 * P / (2 * Q * f))
    const gyromagneticRatio = 28e9 // Hz/T
    const mu0 = 4 * Math.PI * 1e-7
    const f = noise.linewidth > 0 ? noise.linewidth : 2.87e9
    const B1 =
      noise.qFactor > 0
        ? Math.sqrt((mu0 * noise.rfPower) / (2 * noise.qFactor * f))
        : Math.sqrt(mu0 * noise.rfPower * 1e-6)
    const rabiFrequency = gyromagneticRatio * B1 * 2 * Math.PI

    // Gate fidelity from Linblad dissipation over gate time
    const gateTime = rabiFrequency > 0 ? Math.PI / (2 * rabiFrequency) : 1e-6
    const fidelity = Math.exp(-gateTime * decoherenceRate)
    const gateError = 1 - fidelity

    return {
      T1,
      T2,
      T2Star,
      coherenceTime,
      decoherenceRate,
      fidelity,
      gateError,
      statePurity: this.estimateStatePurity(fidelity),
      rabiFrequency,
    }
  }

  /**
   * Evolve density matrix using Lindblad master equation via RK4.
   * Returns the evolved density matrix as serialisable {real, imag} arrays.
   */
  evolve(
    rhoIn: { real: number[][]; imag: number[][] },
    noise: NoiseModel,
    steps = 1,
  ): { real: number[][]; imag: number[][] } {
    const H = this.buildHamiltonian(noise)
    const Ls = this.buildLindbladOperators(noise)

    let rho: ComplexMatrix = {
      re: rhoIn.real.map((row) => [...row]),
      im: rhoIn.imag.map((row) => [...row]),
    }

    for (let s = 0; s < steps; s++) {
      rho = this.rk4Step(rho, H, Ls)
    }

    rho = this.normalise(rho)

    return { real: rho.re, imag: rho.im }
  }

  /** Compute Bloch vector from density matrix */
  blochVector(rho: { real: number[][]; imag: number[][] }): {
    x: number
    y: number
    z: number
  } {
    const r = rho.real
    const im = rho.imag
    const x = 2 * r[0][1]
    const y = 2 * im[1][0]
    const z = r[0][0] - r[1][1]
    return { x, y, z }
  }

  private buildHamiltonian(noise: NoiseModel): ComplexMatrix {
    // H = ½ ω₀ σ_z + ½ Ω_R σ_x  (rotating frame, resonance condition)
    const omega0 = 2 * Math.PI * 2.87e9 * noise.magneticField * 100
    const omegaR = Math.sqrt(Math.max(noise.rfPower, 0)) * 1e6

    const H: ComplexMatrix = {
      re: [
        [omega0 / 2, omegaR / 2],
        [omegaR / 2, -omega0 / 2],
      ],
      im: [
        [0, 0],
        [0, 0],
      ],
    }
    return H
  }

  private buildLindbladOperators(noise: NoiseModel): ComplexMatrix[] {
    const ops: ComplexMatrix[] = []

    // Amplitude damping (T1)
    if (noise.T1 > 0) {
      const gamma1 = Math.sqrt(1 / noise.T1)
      ops.push({
        re: [
          [0, 0],
          [gamma1, 0],
        ],
        im: [
          [0, 0],
          [0, 0],
        ],
      })
    }

    // Pure dephasing (T2)
    if (noise.T2 > 0 && noise.T1 > 0) {
      const gammaDeph = Math.sqrt(Math.max(0, 1 / noise.T2 - 1 / (2 * noise.T1)))
      ops.push({
        re: [
          [gammaDeph, 0],
          [0, -gammaDeph],
        ],
        im: [
          [0, 0],
          [0, 0],
        ],
      })
    }

    // Depolarisation
    if (noise.depolarizationRate > 0) {
      const d = Math.sqrt(noise.depolarizationRate / 3)
      // σ_x
      ops.push({ re: [[0, d], [d, 0]], im: [[0, 0], [0, 0]] })
      // σ_y
      ops.push({ re: [[0, 0], [0, 0]], im: [[0, -d], [d, 0]] })
      // σ_z
      ops.push({ re: [[d, 0], [0, -d]], im: [[0, 0], [0, 0]] })
    }

    return ops
  }

  private lindbladDerivative(
    rho: ComplexMatrix,
    H: ComplexMatrix,
    Ls: ComplexMatrix[],
  ): ComplexMatrix {
    const dim = this.dim

    // Coherent part: -i[H, ρ] = -i(Hρ - ρH)
    const Hrho = matMul(H, rho, dim)
    const rhoH = matMul(rho, H, dim)
    const comm: ComplexMatrix = {
      re: Array.from({ length: dim }, (_, i) =>
        Array.from({ length: dim }, (__, j) => Hrho.re[i][j] - rhoH.re[i][j]),
      ),
      im: Array.from({ length: dim }, (_, i) =>
        Array.from({ length: dim }, (__, j) => Hrho.im[i][j] - rhoH.im[i][j]),
      ),
    }
    // multiply by -i: (a + ib)*(-i) = b - ia
    const coherent = matScaleComplex(comm, 0, -1, dim)

    // Dissipative part
    let diss = zeroMatrix(dim)
    for (const L of Ls) {
      const Ld = dagger(L, dim)
      // L ρ L†
      const LrhoLd = matMul(matMul(L, rho, dim), Ld, dim)
      // ½ {L†L, ρ}
      const LdL = matMul(Ld, L, dim)
      const anti1 = matMul(LdL, rho, dim)
      const anti2 = matMul(rho, LdL, dim)
      const antiComm: ComplexMatrix = {
        re: Array.from({ length: dim }, (_, i) =>
          Array.from({ length: dim }, (__, j) => anti1.re[i][j] + anti2.re[i][j]),
        ),
        im: Array.from({ length: dim }, (_, i) =>
          Array.from({ length: dim }, (__, j) => anti1.im[i][j] + anti2.im[i][j]),
        ),
      }
      const halfAnti = matScale(antiComm, 0.5, dim)
      const term: ComplexMatrix = {
        re: Array.from({ length: dim }, (_, i) =>
          Array.from({ length: dim }, (__, j) => LrhoLd.re[i][j] - halfAnti.re[i][j]),
        ),
        im: Array.from({ length: dim }, (_, i) =>
          Array.from({ length: dim }, (__, j) => LrhoLd.im[i][j] - halfAnti.im[i][j]),
        ),
      }
      diss = matAdd(diss, term, dim)
    }

    return matAdd(coherent, diss, dim)
  }

  private rk4Step(
    rho: ComplexMatrix,
    H: ComplexMatrix,
    Ls: ComplexMatrix[],
  ): ComplexMatrix {
    const h = this.timeStep
    const dim = this.dim

    const k1 = this.lindbladDerivative(rho, H, Ls)
    const rho2 = matAdd(rho, matScale(k1, h / 2, dim), dim)
    const k2 = this.lindbladDerivative(rho2, H, Ls)
    const rho3 = matAdd(rho, matScale(k2, h / 2, dim), dim)
    const k3 = this.lindbladDerivative(rho3, H, Ls)
    const rho4 = matAdd(rho, matScale(k3, h, dim), dim)
    const k4 = this.lindbladDerivative(rho4, H, Ls)

    const dRho: ComplexMatrix = {
      re: Array.from({ length: dim }, (_, i) =>
        Array.from(
          { length: dim },
          (__, j) =>
            (h / 6) *
            (k1.re[i][j] + 2 * k2.re[i][j] + 2 * k3.re[i][j] + k4.re[i][j]),
        ),
      ),
      im: Array.from({ length: dim }, (_, i) =>
        Array.from(
          { length: dim },
          (__, j) =>
            (h / 6) *
            (k1.im[i][j] + 2 * k2.im[i][j] + 2 * k3.im[i][j] + k4.im[i][j]),
        ),
      ),
    }

    return matAdd(rho, dRho, dim)
  }

  /** Enforce trace-1 and Hermitian symmetry */
  private normalise(rho: ComplexMatrix): ComplexMatrix {
    const dim = this.dim
    // Hermitianise: ρ ← (ρ + ρ†)/2
    const rd = dagger(rho, dim)
    const herm: ComplexMatrix = {
      re: Array.from({ length: dim }, (_, i) =>
        Array.from({ length: dim }, (__, j) => (rho.re[i][j] + rd.re[i][j]) / 2),
      ),
      im: Array.from({ length: dim }, (_, i) =>
        Array.from({ length: dim }, (__, j) => (rho.im[i][j] + rd.im[i][j]) / 2),
      ),
    }
    // Renormalise trace
    const tr = trace(herm, dim).re
    if (Math.abs(tr) > 1e-15) {
      return matScale(herm, 1 / tr, dim)
    }
    return herm
  }

  private estimateStatePurity(fidelity: number): number {
    return 0.5 + 0.5 * fidelity
  }

  /** Compute Tr(ρ²) for purity */
  computeStatePurity(rho: { real: number[][]; imag: number[][] }): number {
    const r: ComplexMatrix = { re: rho.real, im: rho.imag }
    const rho2 = matMul(r, r, this.dim)
    return Math.abs(trace(rho2, this.dim).re)
  }
}
