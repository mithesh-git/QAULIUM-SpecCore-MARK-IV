import { configureStore } from '@reduxjs/toolkit'
import simulationReducer from './slices/simulationSlice'
import electronicReducer from './slices/electronicSlice'
import quantumReducer from './slices/quantumSlice'
import visualizationReducer from './slices/visualizationSlice'

export const store = configureStore({
  reducer: {
    simulation: simulationReducer,
    electronics: electronicReducer,
    quantum: quantumReducer,
    visualization: visualizationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
