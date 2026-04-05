import React, { useEffect, useRef, useCallback } from 'react'
import { Box } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import ThreeViewport from '../components/ThreeViewport'
import ControlPanel from '../components/ControlPanel'
import MetricsPanel from '../components/MetricsPanel'
import DataViz from '../components/DataViz'
import Header from '../components/Header'
import {
  startSimulation,
  stopSimulation,
  tick,
  setFPS,
} from '../slices/simulationSlice'
import { updateCoherenceMetrics } from '../slices/quantumSlice'
import { CoherenceCalculator } from '../quantum/CoherenceCalculator'
import { useQuantumWorker } from '../workers/useQuantumWorker'

export default function Dashboard() {
  const dispatch = useDispatch()
  const simulation = useSelector((s: RootState) => s.simulation)
  const quantum = useSelector((s: RootState) => s.quantum)
  const { evolve } = useQuantumWorker()

  const fpsRef = useRef({ lastTime: performance.now(), frames: 0 })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Compute coherence metrics whenever noise model changes
  useEffect(() => {
    const metrics = CoherenceCalculator.compute(quantum.noiseModel)
    dispatch(updateCoherenceMetrics(metrics))
  }, [quantum.noiseModel, dispatch])

  // Start simulation on mount
  useEffect(() => {
    dispatch(startSimulation())
    return () => { dispatch(stopSimulation()) }
  }, [dispatch])

  // Main simulation loop at ~100 Hz
  useEffect(() => {
    if (!simulation.running || simulation.paused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      evolve(5)
      dispatch(tick())

      // FPS tracking
      const now = performance.now()
      fpsRef.current.frames++
      if (now - fpsRef.current.lastTime >= 1000) {
        dispatch(setFPS(fpsRef.current.frames))
        fpsRef.current.frames = 0
        fpsRef.current.lastTime = now
      }
    }, 10) // 100 Hz

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [simulation.running, simulation.paused, evolve, dispatch])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 3D Viewport — main area */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ThreeViewport />
        </Box>

        {/* Right sidebar: controls + metrics */}
        <Box
          sx={{
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid rgba(0,212,255,0.25)',
            overflow: 'hidden',
          }}
        >
          <ControlPanel />
          <MetricsPanel />
        </Box>
      </Box>

      {/* Bottom data visualisation strip */}
      <Box sx={{ borderTop: '1px solid rgba(0,212,255,0.2)' }}>
        <DataViz />
      </Box>
    </Box>
  )
}
