import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { startSimulation, stopSimulation, pauseSimulation } from '../slices/simulationSlice'

export default function Header() {
  const dispatch = useDispatch()
  const simulation = useSelector((s: RootState) => s.simulation)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 0.75,
        background: 'linear-gradient(90deg, #0a0e27 0%, #0d1535 100%)',
        borderBottom: '1px solid rgba(0,212,255,0.3)',
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: '#00d4ff',
            fontWeight: 700,
            letterSpacing: 2,
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          ⚛ QAULIUM SPECTRAL-CORE MARK-IV
        </Typography>
        <Chip
          size="small"
          label="v1.0.0"
          sx={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontSize: 9, height: 18 }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          size="small"
          label={simulation.fps.toFixed(0) + ' FPS'}
          sx={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', fontSize: 9, height: 18 }}
        />
        <Chip
          size="small"
          label={simulation.running ? (simulation.paused ? 'PAUSED' : 'RUNNING') : 'STOPPED'}
          sx={{
            background: simulation.running && !simulation.paused
              ? 'rgba(0,255,136,0.15)'
              : 'rgba(255,170,0,0.15)',
            color: simulation.running && !simulation.paused ? '#00ff88' : '#ffaa00',
            fontSize: 9,
            height: 18,
            cursor: 'pointer',
          }}
          onClick={() => {
            if (!simulation.running) dispatch(startSimulation())
            else dispatch(pauseSimulation())
          }}
        />
        <Chip
          size="small"
          label="■ STOP"
          sx={{
            background: 'rgba(255,68,68,0.1)',
            color: '#ff4444',
            fontSize: 9,
            height: 18,
            cursor: 'pointer',
          }}
          onClick={() => dispatch(stopSimulation())}
        />
      </Box>
    </Box>
  )
}
