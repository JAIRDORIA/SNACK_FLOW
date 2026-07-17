import { useState } from 'react'
import { usePrestamosStore } from '../store/Useprestamosstore'


export default function PagarPrestamoModal({ prestamo, onClose, onSuccess }) {
  const { marcarPagado } = usePrestamosStore()
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  const [medioPago, setMedioPago] = useState('efectivo')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!prestamo) return null

  const handleConfirmar = async () => {
    setGuardando(true)
    setError('')
    const resultado = await marcarPagado(prestamo.id, usuario.id, medioPago)
    setGuardando(false)

    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    onSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-2">Pagar préstamo</h2>
        <p className="text-sm text-gray-600 mb-4">
          {prestamo.cliente_nombre} — ${prestamo.monto.toLocaleString('es-CO')}
          <br />
          <span className="text-xs text-gray-400">
            Prestado en {prestamo.medio_pago}
          </span>
        </p>

        <label className="block text-sm font-medium mb-1">
          ¿Con qué medio de pago está pagando el cliente ahora?
        </label>
        <select
          className="w-full border rounded px-3 py-2 text-sm mb-4"
          value={medioPago}
          onChange={(e) => setMedioPago(e.target.value)}
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded border"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando}
            className="px-4 py-2 text-sm rounded bg-green-600 text-white disabled:opacity-50"
            onClick={handleConfirmar}
          >
            {guardando ? 'Guardando...' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}