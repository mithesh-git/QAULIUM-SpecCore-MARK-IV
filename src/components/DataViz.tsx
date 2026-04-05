import React, { useEffect, useRef } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

/**
 * Data Visualisation panel — SVG-based coherence time-series chart.
 */
export default function DataViz() {
  const quantum = useSelector((s: RootState) => s.quantum)
  const historyRef = useRef<number[]>([])
  const maxPoints = 120

  useEffect(() => {
    historyRef.current.push(quantum.coherenceMetrics.fidelity)
    if (historyRef.current.length > maxPoints) {
      historyRef.current.shift()
    }
  }, [quantum.coherenceMetrics.fidelity])

  const history = historyRef.current
  const w = 300
  const h = 60
  const pad = 4

  const toX = (i: number) => pad + (i / (maxPoints - 1)) * (w - 2 * pad)
  const toY = (v: number) => h - pad - (v * (h - 2 * pad))

  const points = history.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 0,
        background: '#0d1225',
        borderTop: '1px solid rgba(0,212,255,0.2)',
        px: 1.5,
        py: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: '#00d4ff', fontWeight: 600, letterSpacing: 1 }}>
        FIDELITY TRACE
      </Typography>
      <svg width={w} height={h} style={{ display: 'block', marginTop: 4 }}>
        <rect width={w} height={h} fill="rgba(0,0,20,0.5)" rx={2} />
        {/* 0.99 threshold line */}
        <line x1={pad} y1={toY(0.99)} x2={w - pad} y2={toY(0.99)} stroke="rgba(255,170,0,0.4)" strokeWidth={0.5} strokeDasharray="3,3" />
        {history.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#00d4ff"
            strokeWidth={1.5}
          />
        )}
        <text x={pad + 2} y={toY(0.99) - 2} fill="rgba(255,170,0,0.7)" fontSize={6}>99%</text>
        <text x={w - 30} y={h - 2} fill="#556677" fontSize={6}>t →</text>
      </svg>
    </Paper>
  )
}
