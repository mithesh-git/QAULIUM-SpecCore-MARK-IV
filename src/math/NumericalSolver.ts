/**
 * Numerical Solver
 *
 * Implements:
 * - RK45 adaptive ODE solver (Dormand–Prince)
 * - Bisection root finder
 * - Golden-section optimiser
 */

export type ODEFunc = (t: number, y: number[]) => number[]

export interface RK45Result {
  t: number[]
  y: number[][]
  steps: number
  error: number
}

export class NumericalSolver {
  /**
   * Dormand–Prince RK45 adaptive integrator.
   */
  static rk45(
    f: ODEFunc,
    t0: number,
    tf: number,
    y0: number[],
    rtol = 1e-6,
    atol = 1e-9,
    maxSteps = 100_000,
  ): RK45Result {
    // Butcher tableau (Dormand–Prince)
    const a21 = 1 / 5
    const a31 = 3 / 40, a32 = 9 / 40
    const a41 = 44 / 45, a42 = -56 / 15, a43 = 32 / 9
    const a51 = 19372 / 6561, a52 = -25360 / 2187, a53 = 64448 / 6561, a54 = -212 / 729
    const a61 = 9017 / 3168, a62 = -355 / 33, a63 = 46732 / 5247, a64 = 49 / 176, a65 = -5103 / 18656

    const b1 = 35 / 384, b3 = 500 / 1113, b4 = 125 / 192, b5 = -2187 / 6784, b6 = 11 / 84
    const e1 = 71 / 57600, e3 = -71 / 16695, e4 = 71 / 1920, e5 = -17253 / 339200, e6 = 22 / 525, e7 = -1 / 40

    const n = y0.length
    let t = t0
    let y = [...y0]
    let h = (tf - t0) / 100
    const tArr: number[] = [t0]
    const yArr: number[][] = [[...y0]]
    let steps = 0
    let totalError = 0

    const add = (a: number[], b: number[], s: number): number[] =>
      a.map((v, i) => v + s * b[i])

    while (t < tf && steps < maxSteps) {
      if (t + h > tf) h = tf - t

      const k1 = f(t, y)
      const k2 = f(t + h / 5, add(y, k1, h * a21))
      const k3 = f(t + 3 * h / 10, add(add(y, k1, h * a31), k2, h * a32))
      const k4 = f(t + 4 * h / 5, add(add(add(y, k1, h * a41), k2, h * a42), k3, h * a43))
      const k5 = f(t + 8 * h / 9, add(add(add(add(y, k1, h * a51), k2, h * a52), k3, h * a53), k4, h * a54))
      const k6 = f(t + h, add(add(add(add(add(y, k1, h * a61), k2, h * a62), k3, h * a63), k4, h * a64), k5, h * a65))

      // 5th order solution
      const y5 = y.map((v, i) =>
        v + h * (b1 * k1[i] + b3 * k3[i] + b4 * k4[i] + b5 * k5[i] + b6 * k6[i]),
      )

      // Error estimate (4th vs 5th order)
      const k7 = f(t + h, y5)
      const err = Math.sqrt(
        y.reduce((sum, _, i) => {
          const sc = atol + rtol * Math.max(Math.abs(y[i]), Math.abs(y5[i]))
          const e = h * (e1 * k1[i] + e3 * k3[i] + e4 * k4[i] + e5 * k5[i] + e6 * k6[i] + e7 * k7[i])
          return sum + (e / sc) ** 2
        }, 0) / n,
      )

      if (err <= 1.0 || h <= 1e-15) {
        t += h
        y = y5
        tArr.push(t)
        yArr.push([...y])
        totalError += err
        steps++
      }

      // Step size control
      const factor = err > 0 ? 0.9 * Math.pow(1 / err, 0.2) : 5
      h *= Math.min(10, Math.max(0.1, factor))
    }

    return { t: tArr, y: yArr, steps, error: totalError / Math.max(steps, 1) }
  }

  /**
   * Bisection root finder: find x ∈ [a, b] such that f(x) = 0.
   */
  static bisection(
    f: (x: number) => number,
    a: number,
    b: number,
    tol = 1e-10,
    maxIter = 1000,
  ): number {
    let fa = f(a)
    for (let i = 0; i < maxIter; i++) {
      const mid = (a + b) / 2
      if (b - a < tol) return mid
      const fm = f(mid)
      if (Math.sign(fm) === Math.sign(fa)) {
        a = mid
        fa = fm
      } else {
        b = mid
      }
    }
    return (a + b) / 2
  }

  /**
   * Golden-section search: find x ∈ [a, b] minimising f(x).
   */
  static goldenSection(
    f: (x: number) => number,
    a: number,
    b: number,
    tol = 1e-8,
  ): number {
    const phi = (Math.sqrt(5) - 1) / 2
    let x1 = b - phi * (b - a)
    let x2 = a + phi * (b - a)
    let f1 = f(x1)
    let f2 = f(x2)

    while (b - a > tol) {
      if (f1 < f2) {
        b = x2
        x2 = x1
        f2 = f1
        x1 = b - phi * (b - a)
        f1 = f(x1)
      } else {
        a = x1
        x1 = x2
        f1 = f2
        x2 = a + phi * (b - a)
        f2 = f(x2)
      }
    }

    return (a + b) / 2
  }
}
