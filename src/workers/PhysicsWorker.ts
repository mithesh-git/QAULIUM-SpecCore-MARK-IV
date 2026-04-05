/**
 * Physics Simulation Worker
 *
 * Runs RF field computation and field map generation off the main thread.
 */

import { RFCoils } from '../electronics/RFCoils'

let coils = new RFCoils({
  current: 0.1,
  frequency: 2.87e9,
  fieldStrength: 10e-3,
  uniformity: 0.98,
  gradientX: 0,
  gradientY: 0,
  gradientZ: 0,
})

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data as { type: string; payload: unknown }

  if (type === 'UPDATE_COILS') {
    coils = new RFCoils(payload as ConstructorParameters<typeof RFCoils>[0])
    self.postMessage({ type: 'COILS_UPDATED' })
  }

  if (type === 'GENERATE_FIELD_MAP') {
    const { extent, steps } = payload as { extent: number; steps: number }
    const fieldMap = coils.generateFieldMap(extent, steps)
    const uniformity = coils.uniformity(extent * 0.8)
    self.postMessage({ type: 'FIELD_MAP', payload: { fieldMap, uniformity } })
  }
}
