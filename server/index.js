/**
 * QAULIUM MARK-IV Backend API Server
 *
 * Express + WebSocket server for:
 * - REST API for simulation control
 * - WebSocket for real-time metric streaming
 */

import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { quantumRouter } from './quantumAPI.js'
import { electronicsRouter } from './electronicsAPI.js'

const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer })

app.use(express.json())
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// Routes
app.use('/api/quantum', quantumRouter)
app.use('/api/electronics', electronicsRouter)

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// WebSocket — broadcast simulation metrics to all connected clients
const broadcastInterval = setInterval(() => {
  if (wss.clients.size === 0) return
  const msg = JSON.stringify({
    type: 'TICK',
    timestamp: Date.now(),
  })
  for (const client of wss.clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(msg)
    }
  }
}, 10)

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')
  ws.send(JSON.stringify({ type: 'CONNECTED', version: '1.0.0' }))

  ws.on('close', () => {
    console.log('WebSocket client disconnected')
  })
})

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`QAULIUM MARK-IV server running on http://localhost:${PORT}`)
})

process.on('SIGTERM', () => {
  clearInterval(broadcastInterval)
  httpServer.close()
})
