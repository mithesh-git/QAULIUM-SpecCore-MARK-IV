import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ElectronicsState {
  fpga: {
    clockFrequency: number
    enabled: boolean
    gateCount: number
    temperature: number
  }
  dds: {
    frequency: number
    amplitude: number
    phase: number
    waveform: 'sine' | 'square' | 'triangle'
    enabled: boolean
  }
  adc: {
    samplingRate: number
    resolution: number
    inputVoltage: number
  }
  dac: {
    outputVoltage: number
    resolution: number
    updateRate: number
  }
  rfCoil: {
    current: number
    frequency: number
    fieldStrength: number
    uniformity: number
    gradientX: number
    gradientY: number
    gradientZ: number
  }
  power: {
    voltage: number
    current: number
    temperature: number
    efficiency: number
  }
}

const initialState: ElectronicsState = {
  fpga: {
    clockFrequency: 200e6,
    enabled: true,
    gateCount: 65536,
    temperature: 25.0,
  },
  dds: {
    frequency: 2.87e9,
    amplitude: 0.1,
    phase: 0,
    waveform: 'sine',
    enabled: true,
  },
  adc: {
    samplingRate: 1e9,
    resolution: 12,
    inputVoltage: 0.5,
  },
  dac: {
    outputVoltage: 1.0,
    resolution: 16,
    updateRate: 500e6,
  },
  rfCoil: {
    current: 0.1,
    frequency: 2.87e9,
    fieldStrength: 10e-3,
    uniformity: 0.98,
    gradientX: 0,
    gradientY: 0,
    gradientZ: 0,
  },
  power: {
    voltage: 12.0,
    current: 2.5,
    temperature: 35.0,
    efficiency: 0.92,
  },
}

export const electronicSlice = createSlice({
  name: 'electronics',
  initialState,
  reducers: {
    setDDSFrequency(state, action: PayloadAction<number>) {
      state.dds.frequency = action.payload
    },
    setDDSAmplitude(state, action: PayloadAction<number>) {
      state.dds.amplitude = action.payload
    },
    setDDSPhase(state, action: PayloadAction<number>) {
      state.dds.phase = action.payload
    },
    setDDSEnabled(state, action: PayloadAction<boolean>) {
      state.dds.enabled = action.payload
    },
    setRFCurrent(state, action: PayloadAction<number>) {
      state.rfCoil.current = action.payload
      state.rfCoil.fieldStrength = action.payload * 0.1
    },
    setRFFrequency(state, action: PayloadAction<number>) {
      state.rfCoil.frequency = action.payload
    },
    setGradientX(state, action: PayloadAction<number>) {
      state.rfCoil.gradientX = action.payload
    },
    setGradientY(state, action: PayloadAction<number>) {
      state.rfCoil.gradientY = action.payload
    },
    setGradientZ(state, action: PayloadAction<number>) {
      state.rfCoil.gradientZ = action.payload
    },
    setFPGAClock(state, action: PayloadAction<number>) {
      state.fpga.clockFrequency = action.payload
    },
    setPowerVoltage(state, action: PayloadAction<number>) {
      state.power.voltage = action.payload
    },
    updatePowerTemperature(state, action: PayloadAction<number>) {
      state.power.temperature = action.payload
    },
    updateFPGATemperature(state, action: PayloadAction<number>) {
      state.fpga.temperature = action.payload
    },
  },
})

export const {
  setDDSFrequency,
  setDDSAmplitude,
  setDDSPhase,
  setDDSEnabled,
  setRFCurrent,
  setRFFrequency,
  setGradientX,
  setGradientY,
  setGradientZ,
  setFPGAClock,
  setPowerVoltage,
  updatePowerTemperature,
  updateFPGATemperature,
} = electronicSlice.actions

export default electronicSlice.reducer
