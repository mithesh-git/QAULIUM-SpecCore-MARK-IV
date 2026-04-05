# QAULIUM Spectral-Core MARK-IV

A research-grade, full-stack quantum-photonic simulation platform for the QAULIUM MARK-IV system — a 300 mm tower containing quantum photonic cores, classical control electronics, and power systems.

## Features

- **Quantum Engine** — Exact Lindblad master-equation solver with RK4 integration, T1/T2 relaxation, and dynamic coherence metrics
- **3D Visualisation** — Three.js WebGL rendering of the MARK-IV tower, 5 mm × 5 mm photonic chip, 8×8 MZI mesh, YIG thin film, RF coil system, and magnetic field heatmaps
- **Electronics Simulation** — FPGA controller, DDS signal generators, RF coil system, ADC/DAC chain, and power system
- **Mathematical Engine** — RK45 ODE solver, Lindblad derivation, linear algebra over ℂ, tensor products
- **React UI** — Material-UI dark theme, Redux state management, real-time parameter sliders, Bloch sphere display
- **Multi-threading** — Web Workers for quantum and physics computation off the main thread
- **Backend API** — Express + WebSocket server for real-time metric streaming

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Three.js, Redux Toolkit, Material-UI |
| Computation | Custom Lindblad solver, RK45 integrator, Biot–Savart field model |
| Build | Vite, TypeScript strict mode |
| Backend | Node.js, Express, WebSocket |

## Quick Start

```bash
npm install
npm run dev        # Frontend dev server on http://localhost:5173
npm run server     # Backend API on http://localhost:3001 (optional)
npm run build      # Production build
npm run typecheck  # TypeScript type check
```

## Architecture

```
User Input → Electronics Config → Physics Simulation
         → Quantum Evolution (Lindblad RK4) → Coherence Metrics
         → 3D Visualisation (Three.js) → Display
```

## System Pipeline

```
ControlPanel (sliders) ──► Redux Store ──► useQuantumWorker
                                       ──► ThreeViewport (3D)
                                       ──► MetricsPanel (coherence)
                                       ──► DataViz (fidelity trace)
```