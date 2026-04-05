/**
 * Quantum Computation Worker
 *
 * Runs Lindblad solver off the main thread.
 * Messages in:  { type: 'EVOLVE', payload: { rho, noiseModel, steps } }
 * Messages out: { type: 'RESULT', payload: CoherenceMetrics & { densityMatrix, blochVector } }
 */

import { LindbladSolver } from '../quantum/LindbladSolver'
import { CoherenceCalculator } from '../quantum/CoherenceCalculator'

let solver = new LindbladSolver(2, 1e-9)

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data as {
    type: string
    payload: {
      rho: { real: number[][]; imag: number[][] }
      noiseModel: Parameters<typeof solver.computeCoherenceMetrics>[0]
      steps: number
      timeStep?: number
    }
  }

  if (type === 'EVOLVE') {
    if (payload.timeStep) {
      solver = new LindbladSolver(2, payload.timeStep)
    }

    const evolved = solver.evolve(payload.rho, payload.noiseModel, payload.steps)
    const metrics = CoherenceCalculator.compute(payload.noiseModel)
    const bloch = solver.blochVector(evolved)
    const purity = solver.computeStatePurity(evolved)

    self.postMessage({
      type: 'RESULT',
      payload: {
        densityMatrix: evolved,
        blochVector: bloch,
        coherenceMetrics: { ...metrics, statePurity: purity },
      },
    })
  }

  if (type === 'COMPUTE_METRICS') {
    const metrics = CoherenceCalculator.compute(payload.noiseModel)
    self.postMessage({ type: 'METRICS', payload: metrics })
  }
}
