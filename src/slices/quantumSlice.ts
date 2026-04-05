import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CoherenceMetrics {
  T1: number
  T2: number
  T2Star: number
  coherenceTime: number
  decoherenceRate: number
  fidelity: number
  gateError: number
  statePurity: number
  rabiFrequency: number
}

export interface QuantumState {
  noiseModel: {
    T1: number
    T2: number
    temperature: number
    linewidth: number
    magneticField: number
    rfPower: number
    qFactor: number
    depolarizationRate: number
  }
  coherenceMetrics: CoherenceMetrics
  densityMatrix: {
    real: number[][]
    imag: number[][]
  }
  blochVector: { x: number; y: number; z: number }
  computing: boolean
  lastUpdateTime: number
}

const initialState: QuantumState = {
  noiseModel: {
    T1: 1e-3,
    T2: 0.5e-3,
    temperature: 0.02,
    linewidth: 1e6,
    magneticField: 10e-3,
    rfPower: 1.0,
    qFactor: 1e6,
    depolarizationRate: 100,
  },
  coherenceMetrics: {
    T1: 1e-3,
    T2: 0.5e-3,
    T2Star: 0.33e-3,
    coherenceTime: 0.5e-3,
    decoherenceRate: 3000,
    fidelity: 0.9999,
    gateError: 1e-4,
    statePurity: 0.999,
    rabiFrequency: 1e6,
  },
  densityMatrix: {
    real: [
      [0.7, 0.3],
      [0.3, 0.3],
    ],
    imag: [
      [0.0, -0.1],
      [0.1, 0.0],
    ],
  },
  blochVector: { x: 0.6, y: 0.2, z: 0.4 },
  computing: false,
  lastUpdateTime: 0,
}

export const quantumSlice = createSlice({
  name: 'quantum',
  initialState,
  reducers: {
    setNoiseParameter(
      state,
      action: PayloadAction<{ key: keyof QuantumState['noiseModel']; value: number }>,
    ) {
      state.noiseModel[action.payload.key] = action.payload.value
    },
    updateCoherenceMetrics(state, action: PayloadAction<CoherenceMetrics>) {
      state.coherenceMetrics = action.payload
    },
    updateDensityMatrix(
      state,
      action: PayloadAction<{ real: number[][]; imag: number[][] }>,
    ) {
      state.densityMatrix = action.payload
    },
    updateBlochVector(
      state,
      action: PayloadAction<{ x: number; y: number; z: number }>,
    ) {
      state.blochVector = action.payload
    },
    setComputing(state, action: PayloadAction<boolean>) {
      state.computing = action.payload
    },
    setLastUpdateTime(state, action: PayloadAction<number>) {
      state.lastUpdateTime = action.payload
    },
  },
})

export const {
  setNoiseParameter,
  updateCoherenceMetrics,
  updateDensityMatrix,
  updateBlochVector,
  setComputing,
  setLastUpdateTime,
} = quantumSlice.actions

export default quantumSlice.reducer
