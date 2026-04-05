import React, { useEffect, useRef, useCallback } from 'react'
import { Box } from '@mui/material'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { ThreeSceneManager } from '../graphics/ThreeSceneManager'
import { MARKIV3DRenderer } from '../graphics/MARKIV3DRenderer'
import { FieldVisualizer } from '../graphics/FieldVisualizer'
import { RFCoils } from '../electronics/RFCoils'

export default function ThreeViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<ThreeSceneManager | null>(null)
  const rendererRef = useRef<MARKIV3DRenderer | null>(null)
  const fieldVizRef = useRef<FieldVisualizer | null>(null)
  const timeRef = useRef(0)

  const visualization = useSelector((s: RootState) => s.visualization)
  const quantum = useSelector((s: RootState) => s.quantum)
  const electronics = useSelector((s: RootState) => s.electronics)

  const vizRef = useRef(visualization)
  const qRef = useRef(quantum)
  const elRef = useRef(electronics)

  useEffect(() => { vizRef.current = visualization }, [visualization])
  useEffect(() => { qRef.current = quantum }, [quantum])
  useEffect(() => { elRef.current = electronics }, [electronics])

  const initScene = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || sceneRef.current) return

    sceneRef.current = new ThreeSceneManager(canvas, {
      antialias: true,
      shadowMap: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    })

    rendererRef.current = new MARKIV3DRenderer(sceneRef.current.scene)
    fieldVizRef.current = new FieldVisualizer(sceneRef.current.scene)

    // Register per-frame update
    sceneRef.current.onRender((dt) => {
      timeRef.current += dt
      const viz = vizRef.current
      const q = qRef.current
      const el = elRef.current

      // Update MARK-IV renderer
      rendererRef.current?.update(
        dt,
        {
          showMZIMesh: viz.showMZIMesh,
          showYIGFilm: viz.showYIGFilm,
          showCoordinates: viz.showCoordinates,
          animationSpeed: viz.animationSpeed,
        },
        q.coherenceMetrics.fidelity,
        el.dds.amplitude,
      )

      // Update photon paths
      fieldVizRef.current?.updatePhotonPaths(
        viz.photonPathCount,
        viz.showPhotonPaths,
        timeRef.current,
      )
    })

    // Initial field map
    updateFieldMap()

    sceneRef.current.start()
  }, [])

  const updateFieldMap = () => {
    const el = elRef.current
    const viz = vizRef.current
    const coils = new RFCoils({
      current: el.rfCoil.current,
      frequency: el.rfCoil.frequency,
      fieldStrength: el.rfCoil.fieldStrength,
      uniformity: el.rfCoil.uniformity,
      gradientX: el.rfCoil.gradientX,
      gradientY: el.rfCoil.gradientY,
      gradientZ: el.rfCoil.gradientZ,
    })
    const fieldPoints = coils.generateFieldMap(1.0, 10)
    fieldVizRef.current?.updateFieldArrows(
      fieldPoints,
      viz.showRFField,
      viz.fieldHeatmapIntensity,
    )
    fieldVizRef.current?.updateHeatmap(
      fieldPoints,
      viz.showMagneticField,
      viz.fieldHeatmapIntensity,
      10,
    )
  }

  // Initialise on mount
  useEffect(() => {
    initScene()
    return () => {
      sceneRef.current?.dispose()
      sceneRef.current = null
      rendererRef.current?.dispose()
      fieldVizRef.current?.dispose()
    }
  }, [initScene])

  // Resize handler
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      const canvas = canvasRef.current
      if (!canvas || !sceneRef.current) return
      sceneRef.current.resize(canvas.clientWidth, canvas.clientHeight)
    })
    if (canvasRef.current) obs.observe(canvasRef.current)
    return () => obs.disconnect()
  }, [])

  // Re-generate field map when RF params change
  useEffect(() => {
    updateFieldMap()
  }, [
    electronics.rfCoil.current,
    electronics.rfCoil.gradientX,
    electronics.rfCoil.gradientY,
    electronics.rfCoil.gradientZ,
    visualization.showMagneticField,
    visualization.showRFField,
    visualization.fieldHeatmapIntensity,
  ])

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {/* HUD overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          color: '#00d4ff',
          fontFamily: 'monospace',
          fontSize: 11,
          pointerEvents: 'none',
          background: 'rgba(10,14,39,0.7)',
          padding: '6px 10px',
          borderRadius: 1,
          border: '1px solid rgba(0,212,255,0.3)',
        }}
      >
        QAULIUM MARK-IV | 3D Viewport
        <br />
        Drag to rotate · Scroll to zoom
      </Box>
      {/* Coherence badge */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          color: quantum.coherenceMetrics.fidelity > 0.99 ? '#00ff88' : '#ffaa00',
          fontFamily: 'monospace',
          fontSize: 11,
          pointerEvents: 'none',
          background: 'rgba(10,14,39,0.8)',
          padding: '4px 8px',
          borderRadius: 1,
          border: '1px solid rgba(0,255,136,0.3)',
        }}
      >
        Fidelity: {(quantum.coherenceMetrics.fidelity * 100).toFixed(4)}%
      </Box>
    </Box>
  )
}
