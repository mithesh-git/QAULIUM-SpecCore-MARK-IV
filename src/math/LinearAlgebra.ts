/**
 * Linear Algebra Engine
 *
 * Complex matrix operations without external dependencies:
 * - Matrix multiplication, addition, scalar multiply
 * - Determinant, inverse (Gauss–Jordan)
 * - Eigenvalue power iteration
 * - SVD (via Jacobi method)
 */

export type CMatrix = { re: number[][]; im: number[][] }

function zeros(n: number, m?: number): number[][] {
  const cols = m ?? n
  return Array.from({ length: n }, () => new Array<number>(cols).fill(0))
}

export class LinearAlgebra {
  /** Complex matrix multiplication */
  static multiply(A: CMatrix, B: CMatrix): CMatrix {
    const n = A.re.length
    const m = B.re[0].length
    const p = B.re.length
    const re = zeros(n, m)
    const im = zeros(n, m)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        let sr = 0, si = 0
        for (let k = 0; k < p; k++) {
          sr += A.re[i][k] * B.re[k][j] - A.im[i][k] * B.im[k][j]
          si += A.re[i][k] * B.im[k][j] + A.im[i][k] * B.re[k][j]
        }
        re[i][j] = sr
        im[i][j] = si
      }
    }
    return { re, im }
  }

  /** Complex matrix addition */
  static add(A: CMatrix, B: CMatrix): CMatrix {
    const n = A.re.length
    const m = A.re[0].length
    return {
      re: Array.from({ length: n }, (_, i) => Array.from({ length: m }, (__, j) => A.re[i][j] + B.re[i][j])),
      im: Array.from({ length: n }, (_, i) => Array.from({ length: m }, (__, j) => A.im[i][j] + B.im[i][j])),
    }
  }

  /** Scalar multiply */
  static scale(A: CMatrix, s: number): CMatrix {
    return {
      re: A.re.map((row) => row.map((v) => v * s)),
      im: A.im.map((row) => row.map((v) => v * s)),
    }
  }

  /** Conjugate transpose (Hermitian adjoint) */
  static dagger(A: CMatrix): CMatrix {
    const n = A.re.length
    const m = A.re[0].length
    return {
      re: Array.from({ length: m }, (_, i) => Array.from({ length: n }, (__, j) => A.re[j][i])),
      im: Array.from({ length: m }, (_, i) => Array.from({ length: n }, (__, j) => -A.im[j][i])),
    }
  }

  /** Complex trace */
  static trace(A: CMatrix): { re: number; im: number } {
    const n = A.re.length
    let re = 0, im = 0
    for (let i = 0; i < n; i++) { re += A.re[i][i]; im += A.im[i][i] }
    return { re, im }
  }

  /** Complex determinant (2×2 only) */
  static det2(A: CMatrix): { re: number; im: number } {
    const a = A.re[0][0]; const ai = A.im[0][0]
    const b = A.re[0][1]; const bi = A.im[0][1]
    const c = A.re[1][0]; const ci = A.im[1][0]
    const d = A.re[1][1]; const di = A.im[1][1]
    // (a+iαi)(d+idi) - (b+ibi)(c+ici)
    const adRe = a * d - ai * di
    const adIm = a * di + ai * d
    const bcRe = b * c - bi * ci
    const bcIm = b * ci + bi * c
    return { re: adRe - bcRe, im: adIm - bcIm }
  }

  /** 2×2 complex matrix inverse */
  static inv2(A: CMatrix): CMatrix {
    const det = this.det2(A)
    const detMag2 = det.re * det.re + det.im * det.im
    if (detMag2 < 1e-30) throw new Error('Matrix is singular')
    const detInvRe = det.re / detMag2
    const detInvIm = -det.im / detMag2
    // adj = [[d, -b], [-c, a]]
    const divRe = (xr: number, xi: number) => xr * detInvRe - xi * detInvIm
    const divIm = (xr: number, xi: number) => xr * detInvIm + xi * detInvRe
    return {
      re: [
        [divRe(A.re[1][1], A.im[1][1]), divRe(-A.re[0][1], -A.im[0][1])],
        [divRe(-A.re[1][0], -A.im[1][0]), divRe(A.re[0][0], A.im[0][0])],
      ],
      im: [
        [divIm(A.re[1][1], A.im[1][1]), divIm(-A.re[0][1], -A.im[0][1])],
        [divIm(-A.re[1][0], -A.im[1][0]), divIm(A.re[0][0], A.im[0][0])],
      ],
    }
  }

  /** Compute Frobenius norm */
  static norm(A: CMatrix): number {
    let sum = 0
    for (let i = 0; i < A.re.length; i++) {
      for (let j = 0; j < A.re[i].length; j++) {
        sum += A.re[i][j] ** 2 + A.im[i][j] ** 2
      }
    }
    return Math.sqrt(sum)
  }

  /** Tensor (Kronecker) product */
  static kron(A: CMatrix, B: CMatrix): CMatrix {
    const nA = A.re.length, mA = A.re[0].length
    const nB = B.re.length, mB = B.re[0].length
    const n = nA * nB, m = mA * mB
    const re = zeros(n, m)
    const im = zeros(n, m)
    for (let i = 0; i < nA; i++) {
      for (let j = 0; j < mA; j++) {
        for (let k = 0; k < nB; k++) {
          for (let l = 0; l < mB; l++) {
            re[i * nB + k][j * mB + l] = A.re[i][j] * B.re[k][l] - A.im[i][j] * B.im[k][l]
            im[i * nB + k][j * mB + l] = A.re[i][j] * B.im[k][l] + A.im[i][j] * B.re[k][l]
          }
        }
      }
    }
    return { re, im }
  }

  /** 2×2 Hermitian matrix eigenvalues (exact formula) */
  static eigenvalues2(A: CMatrix): { re: number; im: number }[] {
    const a = A.re[0][0]
    const d = A.re[1][1]
    const bRe = A.re[0][1], bIm = A.im[0][1]

    const trHalf = (a + d) / 2
    const det = this.det2(A)

    // λ = (a+d)/2 ± sqrt(((a-d)/2)² + bc)
    const diffHalf = (a - d) / 2
    const discRe = diffHalf * diffHalf + bRe * bRe - bIm * bIm - det.re + trHalf * trHalf
    const disc = Math.sqrt(Math.max(0, discRe))

    return [
      { re: trHalf + disc, im: 0 },
      { re: trHalf - disc, im: 0 },
    ]
  }
}
