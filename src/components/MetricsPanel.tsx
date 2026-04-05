import React from 'react'
import { Box, Paper, Typography, LinearProgress, Divider, Chip } from '@mui/material'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { CoherenceCalculator } from '../quantum/CoherenceCalculator'

function MetricRow({
  label,
  value,
  unit,
  color = '#00d4ff',
  progress,
}: {
  label: string
  value: string
  unit?: string
  color?: string
  progress?: number
}) {
  return (
    <Box sx={{ mb: 1.2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
        <Typography variant="caption" sx={{ color: '#8888aa', fontSize: 10 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color, fontSize: 10, fontWeight: 600 }}>
          {value}{unit ? ` ${unit}` : ''}
        </Typography>
      </Box>
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={progress * 100}
          sx={{
            height: 3,
            borderRadius: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': { backgroundColor: color },
          }}
        />
      )}
    </Box>
  )
}

function BlochSphere({ x, y, z }: { x: number; y: number; z: number }) {
  const r = 40
  const cx = 50
  const cy = 50
  const px = cx + x * r
  const py = cy - z * r

  return (
    <svg
      width="100"
      height="100"
      style={{ display: 'block', margin: '0 auto' }}
      viewBox="0 0 100 100"
    >
      {/* Sphere outline */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
      {/* Equator ellipse */}
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.3} fill="none" stroke="rgba(0,212,255,0.2)" strokeWidth="0.5" />
      {/* Z-axis */}
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(0,212,255,0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
      {/* X-axis */}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(0,212,255,0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
      {/* Bloch vector */}
      <line x1={cx} y1={cy} x2={px} y2={py} stroke="#00ff88" strokeWidth="1.5" />
      <circle cx={px} cy={py} r={3} fill="#00ff88" />
      {/* Labels */}
      <text x={cx + 2} y={cy - r - 3} fill="#00d4ff" fontSize="7">|0⟩</text>
      <text x={cx + 2} y={cy + r + 9} fill="#00d4ff" fontSize="7">|1⟩</text>
    </svg>
  )
}

export default function MetricsPanel() {
  const quantum = useSelector((s: RootState) => s.quantum)
  const simulation = useSelector((s: RootState) => s.simulation)
  const { coherenceMetrics: m, blochVector, noiseModel } = quantum

  const purity = m.statePurity
  const fidelityOk = m.fidelity > 0.99

  return (
    <Paper
      elevation={3}
      sx={{
        height: '50%',
        overflowY: 'auto',
        borderRadius: 0,
        background: '#0d1225',
      }}
    >
      <Box sx={{ p: 1.5 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: '#00d4ff',
            mb: 1,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          📊 Quantum Metrics
        </Typography>

        {/* Bloch sphere */}
        <BlochSphere x={blochVector.x} y={blochVector.y} z={blochVector.z} />
        <Typography variant="caption" sx={{ color: '#556677', display: 'block', textAlign: 'center', mb: 1 }}>
          Bloch Sphere  |r|={Math.sqrt(blochVector.x**2 + blochVector.y**2 + blochVector.z**2).toFixed(3)}
        </Typography>

        <Divider sx={{ borderColor: 'rgba(0,212,255,0.1)', mb: 1 }} />

        {/* Status chip */}
        <Chip
          size="small"
          label={fidelityOk ? '● COHERENT' : '◌ DECOHERENT'}
          sx={{
            mb: 1.5,
            backgroundColor: fidelityOk ? 'rgba(0,255,136,0.15)' : 'rgba(255,170,0,0.15)',
            color: fidelityOk ? '#00ff88' : '#ffaa00',
            fontFamily: 'monospace',
            fontSize: 10,
            fontWeight: 600,
            width: '100%',
          }}
        />

        {/* Coherence times */}
        <MetricRow
          label="T₁ Relaxation"
          value={CoherenceCalculator.formatTime(m.T1)}
          color="#00d4ff"
          progress={Math.min(m.T1 / 0.01, 1)}
        />
        <MetricRow
          label="T₂ Coherence"
          value={CoherenceCalculator.formatTime(m.T2)}
          color="#00aaff"
          progress={Math.min(m.T2 / 0.005, 1)}
        />
        <MetricRow
          label="T₂* (inhomogeneous)"
          value={CoherenceCalculator.formatTime(m.T2Star)}
          color="#0088ff"
          progress={Math.min(m.T2Star / 0.002, 1)}
        />

        <Divider sx={{ borderColor: 'rgba(0,212,255,0.1)', my: 1 }} />

        {/* Gate fidelity */}
        <MetricRow
          label="Gate Fidelity"
          value={`${(m.fidelity * 100).toFixed(4)}%`}
          color={fidelityOk ? '#00ff88' : '#ffaa00'}
          progress={m.fidelity}
        />
        <MetricRow
          label="Gate Error"
          value={m.gateError.toExponential(3)}
          color={m.gateError < 1e-3 ? '#00ff88' : '#ff4444'}
        />
        <MetricRow
          label="State Purity"
          value={purity.toFixed(4)}
          color={purity > 0.99 ? '#00ff88' : '#ffaa00'}
          progress={purity}
        />

        <Divider sx={{ borderColor: 'rgba(0,212,255,0.1)', my: 1 }} />

        {/* Physics params */}
        <MetricRow
          label="Rabi Frequency"
          value={CoherenceCalculator.formatFrequency(m.rabiFrequency)}
          color="#aa44ff"
        />
        <MetricRow
          label="Decoherence Rate"
          value={`${m.decoherenceRate.toExponential(2)} Hz`}
          color="#ff6644"
        />
        <MetricRow
          label="Coherence Time"
          value={CoherenceCalculator.formatTime(m.coherenceTime)}
          color="#44ffaa"
        />

        <Divider sx={{ borderColor: 'rgba(0,212,255,0.1)', my: 1 }} />

        {/* Simulation info */}
        <MetricRow
          label="Sim FPS"
          value={simulation.fps.toFixed(1)}
          color="#888888"
        />
        <MetricRow
          label="Steps Computed"
          value={simulation.stepCount.toString()}
          color="#556677"
        />
        <MetricRow
          label="Temperature"
          value={`${noiseModel.temperature.toFixed(3)} K`}
          color="#4488cc"
        />
      </Box>
    </Paper>
  )
}
