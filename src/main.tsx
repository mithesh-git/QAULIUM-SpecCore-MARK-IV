import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App'
import { store } from './store'
import './index.css'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00d4ff' },
    secondary: { main: '#ff00ff' },
    background: {
      default: '#0a0e27',
      paper: '#141829',
    },
    success: { main: '#00ff88' },
    warning: { main: '#ffaa00' },
    error: { main: '#ff4444' },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Courier New", monospace',
    fontSize: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(0, 212, 255, 0.2)',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#00d4ff',
        },
      },
    },
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
)
