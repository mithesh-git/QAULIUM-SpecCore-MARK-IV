/**
 * Electronics API Routes
 */

import { Router } from 'express'

export const electronicsRouter = Router()

electronicsRouter.get('/status', (_, res) => {
  res.json({
    fpga: { enabled: true, clockFrequency: 200e6 },
    dds: { enabled: true, frequency: 2.87e9 },
    rfCoil: { current: 0.1, fieldStrength: 10e-3 },
    power: { voltage: 12.0, current: 2.5 },
  })
})

electronicsRouter.post('/dds', (req, res) => {
  const { frequency, amplitude, phase } = req.body ?? {}
  if (typeof frequency !== 'number') {
    res.status(400).json({ error: 'frequency required' })
    return
  }
  res.json({ ok: true, frequency, amplitude: amplitude ?? 0.1, phase: phase ?? 0 })
})

electronicsRouter.post('/rf-coil', (req, res) => {
  const { current, gradientX, gradientY, gradientZ } = req.body ?? {}
  if (typeof current !== 'number') {
    res.status(400).json({ error: 'current required' })
    return
  }
  const fieldStrength = current * 0.1
  res.json({ ok: true, current, fieldStrength, gradientX, gradientY, gradientZ })
})
