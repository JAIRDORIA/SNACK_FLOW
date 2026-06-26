import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

export default function Toast({ mensaje, tipo = 'error', onClose, duracion = 5000 }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onClose) onClose()
    }, duracion)
    return () => clearTimeout(timer)
  }, [duracion, onClose])

  if (!visible) return null

  const config = {
    error: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: AlertCircle },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle }
  }

  const estilo = config[tipo] || config.error
  const Icono = estilo.icon

  return (
    <div  style={{padding:"16px"}} className={`fixed top-5 right-5 z-50 ${estilo.bg} ${estilo.border} border rounded-xl p-4 flex items-center gap-3 shadow-lg animate-bounce`}>
      <Icono size={20} className={estilo.text} />
      <span className={`text-sm ${estilo.text} font-medium`}>{mensaje}</span>
      <button onClick={() => { setVisible(false); if (onClose) onClose() }} style={{marginLeft:"8px"}} className={`ml-2 ${estilo.text} hover:opacity-70`}>
        <X size={16} />
      </button>
    </div>
  )
}