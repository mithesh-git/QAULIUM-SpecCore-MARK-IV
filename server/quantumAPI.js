/**
 * Quantum API Routes
 */

import { Router } from 'express'

export const quantumRouter = Router()

quantumRouter.get('/status', (_, res) => {
  res.json({
    status: 'operational',
    hilbertDim: 2,
    formalism: 'Lindblad',
  })
})

quantumRouter.post('/compute-metrics', (req, res) => {
  const noise = req.body
  if (!noise || typeof noise.T1 !== 'number') {
    res.status(400).json({ error: 'Invalid noise model' })
    return
  }

  const T1 = Math.max(noise.T1, 1e-12)
  const T2 = Math.min(Math.max(noise.T2 ?? T1 / 2, 1e-12), 2 * T1)
  const T2Star = 1 / (1 / T2 + (noise.linewidth ?? 0))
  const decoherenceRate = 1 / T1 + 1 / T2

  res.json({
    T1,
    T2,
    T2Star,
    coherenceTime: Math.min(T1, T2),
    decoherenceRate,
    fidelity: Math.exp(-1e-6 * decoherenceRate),
    gateError: 1 - Math.exp(-1e-6 * decoherenceRate),
    statePurity: 0.99,
  })
})
