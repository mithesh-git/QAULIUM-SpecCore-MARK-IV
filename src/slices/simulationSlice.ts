import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SimulationState {
  running: boolean
  paused: boolean
  timeStep: number
  totalTime: number
  elapsedTime: number
  stepCount: number
  updateRate: number
  fps: number
}

const initialState: SimulationState = {
  running: false,
  paused: false,
  timeStep: 1e-9,
  totalTime: 1e-6,
  elapsedTime: 0,
  stepCount: 0,
  updateRate: 100,
  fps: 0,
}

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    startSimulation(state) {
      state.running = true
      state.paused = false
    },
    stopSimulation(state) {
      state.running = false
      state.paused = false
      state.elapsedTime = 0
      state.stepCount = 0
    },
    pauseSimulation(state) {
      state.paused = !state.paused
    },
    setTimeStep(state, action: PayloadAction<number>) {
      state.timeStep = action.payload
    },
    setTotalTime(state, action: PayloadAction<number>) {
      state.totalTime = action.payload
    },
    tick(state) {
      state.elapsedTime += state.timeStep
      state.stepCount++
    },
    setFPS(state, action: PayloadAction<number>) {
      state.fps = action.payload
    },
    setUpdateRate(state, action: PayloadAction<number>) {
      state.updateRate = action.payload
    },
  },
})

export const {
  startSimulation,
  stopSimulation,
  pauseSimulation,
  setTimeStep,
  setTotalTime,
  tick,
  setFPS,
  setUpdateRate,
} = simulationSlice.actions

export default simulationSlice.reducer
