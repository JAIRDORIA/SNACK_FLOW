import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useInactivityTimer(timeout = 5 * 60 * 1000) {
  const navigate = useNavigate()
  const timerRef = useRef(null)

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(logout, timeout)
  }

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart']

    events.forEach(event => window.addEventListener(event, resetTimer))
    resetTimer() // iniciar el temporizador al montar

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeout])

  return null
}