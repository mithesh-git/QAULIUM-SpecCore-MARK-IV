import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface VisualizationState {
  showMagneticField: boolean
  showRFField: boolean
  showPhotonPaths: boolean
  showMZIMesh: boolean
  showYIGFilm: boolean
  showCoordinates: boolean
  cameraPosition: { x: number; y: number; z: number }
  cameraTarget: { x: number; y: number; z: number }
  fieldHeatmapIntensity: number
  photonPathCount: number
  renderQuality: 'low' | 'medium' | 'high'
  selectedComponent: string | null
  animationSpeed: number
}

const initialState: VisualizationState = {
  showMagneticField: true,
  showRFField: true,
  showPhotonPaths: true,
  showMZIMesh: true,
  showYIGFilm: true,
  showCoordinates: true,
  cameraPosition: { x: 5, y: 5, z: 5 },
  cameraTarget: { x: 0, y: 0, z: 0 },
  fieldHeatmapIntensity: 0.8,
  photonPathCount: 8,
  renderQuality: 'high',
  selectedComponent: null,
  animationSpeed: 1.0,
}

export const visualizationSlice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    toggleMagneticField(state) {
      state.showMagneticField = !state.showMagneticField
    },
    toggleRFField(state) {
      state.showRFField = !state.showRFField
    },
    togglePhotonPaths(state) {
      state.showPhotonPaths = !state.showPhotonPaths
    },
    toggleMZIMesh(state) {
      state.showMZIMesh = !state.showMZIMesh
    },
    toggleYIGFilm(state) {
      state.showYIGFilm = !state.showYIGFilm
    },
    setCameraPosition(state, action: PayloadAction<{ x: number; y: number; z: number }>) {
      state.cameraPosition = action.payload
    },
    setFieldHeatmapIntensity(state, action: PayloadAction<number>) {
      state.fieldHeatmapIntensity = action.payload
    },
    setPhotonPathCount(state, action: PayloadAction<number>) {
      state.photonPathCount = action.payload
    },
    setRenderQuality(state, action: PayloadAction<'low' | 'medium' | 'high'>) {
      state.renderQuality = action.payload
    },
    selectComponent(state, action: PayloadAction<string | null>) {
      state.selectedComponent = action.payload
    },
    setAnimationSpeed(state, action: PayloadAction<number>) {
      state.animationSpeed = action.payload
    },
  },
})

export const {
  toggleMagneticField,
  toggleRFField,
  togglePhotonPaths,
  toggleMZIMesh,
  toggleYIGFilm,
  setCameraPosition,
  setFieldHeatmapIntensity,
  setPhotonPathCount,
  setRenderQuality,
  selectComponent,
  setAnimationSpeed,
} = visualizationSlice.actions

export default visualizationSlice.reducer
