import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useInactivityTimer(timeout = 5 * 60 * 1000, activo = true) {
  const navigate = useNavigate()
  const timerRef = useRef(null)

  useEffect(() => {
    // Si el temporizador está desactivado (ej. rol 'cocina'), no registrar
    // listeners ni crear timeouts. Al pasar activo a false, el cleanup de la
    // ejecución anterior ya limpió todo.
    if (!activo) return

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart']

    const logout = () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('usuario')
      navigate('/login')
    }

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(logout, timeout)
    }

    events.forEach(event => window.addEventListener(event, resetTimer))
    resetTimer() // iniciar el temporizador al montar

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeout, activo, navigate])

  return null
}