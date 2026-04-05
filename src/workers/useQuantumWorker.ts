import React, { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { updateCoherenceMetrics, updateDensityMatrix, updateBlochVector } from '../slices/quantumSlice'
import type { CoherenceMetrics } from '../slices/quantumSlice'

/**
 * Hook that manages the quantum worker for off-thread computation.
 */
export function useQuantumWorker() {
  const dispatch = useDispatch()
  const workerRef = useRef<Worker | null>(null)
  const quantum = useSelector((s: RootState) => s.quantum)
  const simulation = useSelector((s: RootState) => s.simulation)

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/QuantumWorker.ts', import.meta.url),
      { type: 'module' },
    )

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data as { type: string; payload: unknown }
      if (type === 'RESULT') {
        const p = payload as {
          densityMatrix: { real: number[][]; imag: number[][] }
          blochVector: { x: number; y: number; z: number }
          coherenceMetrics: CoherenceMetrics
        }
        dispatch(updateDensityMatrix(p.densityMatrix))
        dispatch(updateBlochVector(p.blochVector))
        dispatch(updateCoherenceMetrics(p.coherenceMetrics))
      }
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [dispatch])

  const evolve = useCallback(
    (steps = 10) => {
      if (!simulation.running || simulation.paused) return
      workerRef.current?.postMessage({
        type: 'EVOLVE',
        payload: {
          rho: quantum.densityMatrix,
          noiseModel: quantum.noiseModel,
          steps,
          timeStep: simulation.timeStep,
        },
      })
    },
    [quantum, simulation],
  )

  return { evolve }
}
