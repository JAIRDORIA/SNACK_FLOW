import { useState } from 'react'
import { usePrestamosStore } from '../store/Useprestamosstore'

export default function AbonarPrestamoModal({ prestamo, onClose, onSuccess }) {
  const { abonar } = usePrestamosStore()
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  const [monto, setMonto] = useState(String(prestamo.saldo_pendiente))
  const [medioPago, setMedioPago] = useState('efectivo')
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!prestamo) return null

  const montoNum = parseFloat(monto)

  const handleConfirmar = async (e) => {
    e.preventDefault()
    setError('')

    if (!montoNum || montoNum <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    if (montoNum > prestamo.saldo_pendiente) {
      setError(`El abono no puede superar el saldo pendiente ($${prestamo.saldo_pendiente.toLocaleString('es-CO')})`)
      return
    }
    if (!usuario?.id) {
      setError('No se pudo identificar el usuario actual')
      return
    }

    setGuardando(true)
    const resultado = await abonar(prestamo.id, {
      usuario_id: usuario.id,
      monto: montoNum,
      medio_pago: medioPago,
      observacion: observacion || null,
    })
    setGuardando(false)

    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    onSuccess?.()
    onClose()
  }

  const esPagoTotal = montoNum === prestamo.saldo_pendiente

  return (
    <div  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-2">Abonar a préstamo</h2>
        <p className="text-sm text-gray-900 mb-8">
          {prestamo.cliente_nombre}
          <br />
          <span className="text-xs text-red-800">
            Saldo pendiente: ${prestamo.saldo_pendiente.toLocaleString('es-CO')} de ${prestamo.monto.toLocaleString('es-CO')}
          </span>
        </p>

        <form onSubmit={handleConfirmar} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Monto a abonar</label>
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setMonto(String(prestamo.saldo_pendiente))}
              >
                Pagar todo
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={prestamo.saldo_pendiente}
              step="1"

              className="w-full border rounded text-sm py-1 px-3"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Medio de pago</label>
            <select

              className="w-full border rounded text-sm py-2 px-3"
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observación (opcional)</label>
            <input

              type="text"

              className="w-full border rounded text-sm py-2 px-3"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="text-sm rounded border py-2 px-4" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}

              className={`px-4 py-2 text-sm rounded text-white disabled:opacity-50 ${esPagoTotal ? 'bg-green-600' : 'bg-blue-600'}`}
            >
              {guardando ? 'Guardando...' : esPagoTotal ? 'Confirmar pago total' : 'Confirmar abono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}