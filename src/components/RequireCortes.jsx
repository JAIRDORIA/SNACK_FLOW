import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import api from '@/api/axios'

export default function RequireCorte({ children }) {
  const [cortesExisten, setCortesExisten] = useState(null) // null = cargando

  useEffect(() => {
    api.get('/cortes')
      .then(res => {
        const cortes = res.data?.datos || res.data?.items || res.data || []
        setCortesExisten(cortes.length > 0)
      })
      .catch(() => setCortesExisten(false))
  }, [])

  if (cortesExisten === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1B1D2E' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(79,70,229,0.3)', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: '#9ca3af' }}>Verificando cortes…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!cortesExisten) {
    return <Navigate to="/primer-corte" replace />
  }

  return children
}