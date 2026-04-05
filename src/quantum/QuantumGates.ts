/**
 * Quantum Gate Library
 *
 * Provides exact unitary matrices for standard quantum gates as
 * { re, im } complex matrices.
 */

export type Gate = { re: number[][]; im: number[][] }

function mul2(A: Gate, B: Gate): Gate {
  const re: number[][] = [[0, 0], [0, 0]]
  const im: number[][] = [[0, 0], [0, 0]]
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      let sr = 0
      let si = 0
      for (let k = 0; k < 2; k++) {
        sr += A.re[i][k] * B.re[k][j] - A.im[i][k] * B.im[k][j]
        si += A.re[i][k] * B.im[k][j] + A.im[i][k] * B.re[k][j]
      }
      re[i][j] = sr
      im[i][j] = si
    }
  }
  return { re, im }
}

export class QuantumGates {
  /** Pauli-X (NOT) gate */
  static X(): Gate {
    return { re: [[0, 1], [1, 0]], im: [[0, 0], [0, 0]] }
  }

  /** Pauli-Y gate */
  static Y(): Gate {
    return { re: [[0, 0], [0, 0]], im: [[0, -1], [1, 0]] }
  }

  /** Pauli-Z gate */
  static Z(): Gate {
    return { re: [[1, 0], [0, -1]], im: [[0, 0], [0, 0]] }
  }

  /** Hadamard gate */
  static H(): Gate {
    const s = 1 / Math.SQRT2
    return { re: [[s, s], [s, -s]], im: [[0, 0], [0, 0]] }
  }

  /** Phase gate S = diag(1, i) */
  static S(): Gate {
    return { re: [[1, 0], [0, 0]], im: [[0, 0], [0, 1]] }
  }

  /** T gate = diag(1, e^{iπ/4}) */
  static T(): Gate {
    const c = Math.cos(Math.PI / 4)
    const s = Math.sin(Math.PI / 4)
    return { re: [[1, 0], [0, c]], im: [[0, 0], [0, s]] }
  }

  /** Rotation about X-axis by angle θ */
  static Rx(theta: number): Gate {
    const c = Math.cos(theta / 2)
    const s = Math.sin(theta / 2)
    return { re: [[c, 0], [0, c]], im: [[0, -s], [-s, 0]] }
  }

  /** Rotation about Y-axis by angle θ */
  static Ry(theta: number): Gate {
    const c = Math.cos(theta / 2)
    const s = Math.sin(theta / 2)
    return { re: [[c, -s], [s, c]], im: [[0, 0], [0, 0]] }
  }

  /** Rotation about Z-axis by angle θ */
  static Rz(theta: number): Gate {
    const c = Math.cos(theta / 2)
    const s = Math.sin(theta / 2)
    return { re: [[c, 0], [0, c]], im: [[-s, 0], [0, s]] }
  }

  /** CNOT gate (4×4) */
  static CNOT(): { re: number[][]; im: number[][] } {
    const z4 = Array.from({ length: 4 }, () => new Array<number>(4).fill(0))
    const re = z4.map((r) => [...r])
    re[0][0] = 1
    re[1][1] = 1
    re[2][3] = 1
    re[3][2] = 1
    return { re, im: z4 }
  }

  /** CZ gate (4×4) */
  static CZ(): { re: number[][]; im: number[][] } {
    const z4 = Array.from({ length: 4 }, () => new Array<number>(4).fill(0))
    const re = z4.map((r) => [...r])
    re[0][0] = 1
    re[1][1] = 1
    re[2][2] = 1
    re[3][3] = -1
    return { re, im: z4 }
  }

  /** Compose two single-qubit gates: A · B */
  static compose(A: Gate, B: Gate): Gate {
    return mul2(A, B)
  }

  /** Tensor product of two 2×2 gates into a 4×4 gate */
  static tensorProduct(
    A: Gate,
    B: Gate,
  ): { re: number[][]; im: number[][] } {
    const dim = 4
    const re = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
    const im = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 2; k++) {
          for (let l = 0; l < 2; l++) {
            const ri = i * 2 + k
            const ci = j * 2 + l
            re[ri][ci] = A.re[i][j] * B.re[k][l] - A.im[i][j] * B.im[k][l]
            im[ri][ci] = A.re[i][j] * B.im[k][l] + A.im[i][j] * B.re[k][l]
          }
        }
      }
    }
    return { re, im }
  }

  /** Apply a 2×2 gate to a state vector [α, β] */
  static applyToState(
    gate: Gate,
    state: { re: number[]; im: number[] },
  ): { re: number[]; im: number[] } {
    const outRe = [0, 0]
    const outIm = [0, 0]
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        outRe[i] += gate.re[i][j] * state.re[j] - gate.im[i][j] * state.im[j]
        outIm[i] += gate.re[i][j] * state.im[j] + gate.im[i][j] * state.re[j]
      }
    }
    return { re: outRe, im: outIm }
  }
}
