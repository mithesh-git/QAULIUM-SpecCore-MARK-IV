import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import {
  setDDSFrequency,
  setDDSAmplitude,
  setRFCurrent,
  setGradientX,
  setGradientY,
  setGradientZ,
} from '../slices/electronicSlice'
import { setNoiseParameter } from '../slices/quantumSlice'
import {
  toggleMagneticField,
  toggleRFField,
  togglePhotonPaths,
  toggleMZIMesh,
  toggleYIGFilm,
  setFieldHeatmapIntensity,
  setPhotonPathCount,
  setAnimationSpeed,
} from '../slices/visualizationSlice'

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  scale = 1,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
  scale?: number
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#aaaacc' }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: '#00d4ff' }}>
          {(value * scale).toExponential(2)} {unit}
        </Typography>
      </Box>
      <Slider
        size="small"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_, v) => onChange(v as number)}
        sx={{ py: 0.5 }}
      />
    </Box>
  )
}

export default function ControlPanel() {
  const dispatch = useDispatch()
  const electronics = useSelector((s: RootState) => s.electronics)
  const quantum = useSelector((s: RootState) => s.quantum)
  const visualization = useSelector((s: RootState) => s.visualization)

  return (
    <Paper
      elevation={3}
      sx={{
        height: '50%',
        overflowY: 'auto',
        borderRadius: 0,
        background: '#0d1225',
        borderRight: 'none',
        borderBottom: '1px solid rgba(0,212,255,0.2)',
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
          ⚙ Control Panel
        </Typography>

        {/* DDS / RF Section */}
        <Accordion
          defaultExpanded
          disableGutters
          sx={{ background: 'transparent', boxShadow: 'none', '&::before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00d4ff', fontSize: 16 }} />} sx={{ px: 0, minHeight: 28 }}>
            <Typography variant="caption" sx={{ color: '#00aaff', fontWeight: 600 }}>
              RF / DDS
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0 }}>
            <SliderRow
              label="DDS Frequency"
              value={electronics.dds.frequency}
              min={1e9}
              max={6e9}
              step={10e6}
              unit="GHz"
              scale={1e-9}
              onChange={(v) => dispatch(setDDSFrequency(v))}
            />
            <SliderRow
              label="DDS Amplitude"
              value={electronics.dds.amplitude}
              min={0}
              max={1}
              step={0.01}
              unit="V"
              onChange={(v) => dispatch(setDDSAmplitude(v))}
            />
            <SliderRow
              label="RF Coil Current"
              value={electronics.rfCoil.current}
              min={0}
              max={2}
              step={0.01}
              unit="A"
              onChange={(v) => dispatch(setRFCurrent(v))}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ borderColor: 'rgba(0,212,255,0.15)', my: 1 }} />

        {/* Gradient Fields */}
        <Accordion
          disableGutters
          sx={{ background: 'transparent', boxShadow: 'none', '&::before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00d4ff', fontSize: 16 }} />} sx={{ px: 0, minHeight: 28 }}>
            <Typography variant="caption" sx={{ color: '#00aaff', fontWeight: 600 }}>
              Gradient Fields
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0 }}>
            <SliderRow
              label="Gradient Gx"
              value={electronics.rfCoil.gradientX}
              min={-1}
              max={1}
              step={0.01}
              unit="T/m"
              onChange={(v) => dispatch(setGradientX(v))}
            />
            <SliderRow
              label="Gradient Gy"
              value={electronics.rfCoil.gradientY}
              min={-1}
              max={1}
              step={0.01}
              unit="T/m"
              onChange={(v) => dispatch(setGradientY(v))}
            />
            <SliderRow
              label="Gradient Gz"
              value={electronics.rfCoil.gradientZ}
              min={-1}
              max={1}
              step={0.01}
              unit="T/m"
              onChange={(v) => dispatch(setGradientZ(v))}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ borderColor: 'rgba(0,212,255,0.15)', my: 1 }} />

        {/* Quantum Noise */}
        <Accordion
          disableGutters
          sx={{ background: 'transparent', boxShadow: 'none', '&::before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00d4ff', fontSize: 16 }} />} sx={{ px: 0, minHeight: 28 }}>
            <Typography variant="caption" sx={{ color: '#00aaff', fontWeight: 600 }}>
              Quantum Noise
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0 }}>
            <SliderRow
              label="T1 Relaxation"
              value={quantum.noiseModel.T1}
              min={1e-6}
              max={10e-3}
              step={1e-6}
              unit="ms"
              scale={1e3}
              onChange={(v) => dispatch(setNoiseParameter({ key: 'T1', value: v }))}
            />
            <SliderRow
              label="T2 Coherence"
              value={quantum.noiseModel.T2}
              min={1e-6}
              max={5e-3}
              step={1e-6}
              unit="ms"
              scale={1e3}
              onChange={(v) => dispatch(setNoiseParameter({ key: 'T2', value: v }))}
            />
            <SliderRow
              label="Temperature"
              value={quantum.noiseModel.temperature}
              min={0.001}
              max={0.1}
              step={0.001}
              unit="K"
              onChange={(v) => dispatch(setNoiseParameter({ key: 'temperature', value: v }))}
            />
            <SliderRow
              label="RF Power"
              value={quantum.noiseModel.rfPower}
              min={0.01}
              max={10}
              step={0.01}
              unit="W"
              onChange={(v) => dispatch(setNoiseParameter({ key: 'rfPower', value: v }))}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ borderColor: 'rgba(0,212,255,0.15)', my: 1 }} />

        {/* Visualisation Toggles */}
        <Accordion
          disableGutters
          sx={{ background: 'transparent', boxShadow: 'none', '&::before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00d4ff', fontSize: 16 }} />} sx={{ px: 0, minHeight: 28 }}>
            <Typography variant="caption" sx={{ color: '#00aaff', fontWeight: 600 }}>
              Visualisation
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0 }}>
            {([
              { label: 'Magnetic Field', value: visualization.showMagneticField, action: toggleMagneticField },
              { label: 'RF Field Arrows', value: visualization.showRFField, action: toggleRFField },
              { label: 'Photon Paths', value: visualization.showPhotonPaths, action: togglePhotonPaths },
              { label: 'MZI Mesh', value: visualization.showMZIMesh, action: toggleMZIMesh },
              { label: 'YIG Film', value: visualization.showYIGFilm, action: toggleYIGFilm },
            ] as { label: string; value: boolean; action: () => { type: string } }[]).map(({ label, value, action }) => (
              <FormControlLabel
                key={label}
                control={
                  <Switch
                    size="small"
                    checked={value}
                    onChange={() => dispatch(action())}
                    sx={{ '& .MuiSwitch-thumb': { color: '#00d4ff' } }}
                  />
                }
                label={<Typography variant="caption" sx={{ color: '#aaaacc' }}>{label}</Typography>}
                sx={{ display: 'flex', ml: 0, mb: 0.5 }}
              />
            ))}
            <SliderRow
              label="Field Intensity"
              value={visualization.fieldHeatmapIntensity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => dispatch(setFieldHeatmapIntensity(v))}
            />
            <SliderRow
              label="Photon Count"
              value={visualization.photonPathCount}
              min={1}
              max={16}
              step={1}
              onChange={(v) => dispatch(setPhotonPathCount(v))}
            />
            <SliderRow
              label="Animation Speed"
              value={visualization.animationSpeed}
              min={0}
              max={3}
              step={0.1}
              unit="×"
              onChange={(v) => dispatch(setAnimationSpeed(v))}
            />
          </AccordionDetails>
        </Accordion>
      </Box>
    </Paper>
  )
}
