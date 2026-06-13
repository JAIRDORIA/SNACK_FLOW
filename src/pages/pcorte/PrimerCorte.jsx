import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/axios'

export default function PrimerCorte() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  
const handleCrearPrimerCorte = async () => {
  setLoading(true)
  setError('')
  try {
    await api.post('/cortes/iniciar')
    // Pequeña pausa para asegurar que el backend termine de crear los cortes
    setTimeout(() => {
      navigate('/') // Redirige al dashboard
    }, 800)
  } catch (err) {
    setError(err.response?.data?.mensaje || 'Error al crear el primer corte')
    setLoading(false)
  }
}
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1B1D2E',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: 32,
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>
          ¡Bienvenido a SnackFlow!
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          No hay un corte creado aún.<br />
          Para empezar a usar el sistema, crea el primer corte.
        </p>
        <button
          onClick={handleCrearPrimerCorte}
          disabled={loading}
          style={{
            width: '100%',
            border: 'none',
            borderRadius: 12,
            padding: '16px 0',
            fontSize: 15,
            fontWeight: 700,
            background: loading ? '#6366f1' : '#4f46e5',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            boxShadow: '0 8px 28px rgba(79,70,229,0.3)',
          }}
        >
          {loading ? 'Creando primer corte…' : 'Crear primer corte'}
        </button>
        {error && (
          <div style={{
            marginTop: 20,
            color: '#fca5a5',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 13
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}