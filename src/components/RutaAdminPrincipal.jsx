import { Navigate } from 'react-router-dom'

export default function RutaAdminPrincipal({ children }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  
  if (usuario?.id !== 1) {
    return <Navigate to="/" replace />
  }
  
  return children
}