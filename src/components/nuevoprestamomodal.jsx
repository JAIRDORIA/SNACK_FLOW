import { useState, useEffect } from 'react'
import { usePrestamosStore } from '../store/Useprestamosstore'
import { getClientes } from '@/api/clientes_api'

export default function NuevoPrestamoModal({ isOpen, onClose, onSuccess }) {
  const { nuevoPrestamo } = usePrestamosStore()
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  const [clientes, setClientes] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [monto, setMonto] = useState('')
  const [medioPago, setMedioPago] = useState('efectivo')
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Al cerrar el modal, limpia la lista y el formulario
  useEffect(() => {
    if (!isOpen) {
      setClientes([])
    }
  }, [isOpen])

  // Busqueda de clientes en el backend, con debounce (ya no trae 200 fijos)
  useEffect(() => {
    if (!isOpen || !busquedaCliente || clienteSeleccionado) {
      setClientes([])
      return
    }
    const timer = setTimeout(() => {
      getClientes(1, 20, busquedaCliente)
        .then((res) => setClientes(res.data.items || res.data.datos || []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaCliente, isOpen, clienteSeleccionado])

  if (!isOpen) return null

  // el backend ya filtra con q, no hace falta filtrar de nuevo en el frontend
  const clientesFiltrados = clientes

  const resetForm = () => {
    setClienteSeleccionado(null)
    setBusquedaCliente('')
    setMonto('')
    setMedioPago('efectivo')
    setObservacion('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!clienteSeleccionado) {
      setError('Selecciona un cliente')
      return
    }
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    if (!usuario?.id) {
      setError('No se pudo identificar el usuario actual')
      return
    }

    setGuardando(true)
    const resultado = await nuevoPrestamo({
      cliente_id: clienteSeleccionado.ID_Cliente,
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

    resetForm()
    onSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Nuevo préstamo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <input
              type="text"
              placeholder="Buscar cliente..."

              className="w-full border rounded text-sm py-2 px-3"
              value={clienteSeleccionado ? clienteSeleccionado.Cli_Nombre : busquedaCliente}
              onChange={(e) => {
                setClienteSeleccionado(null)
                setBusquedaCliente(e.target.value)
              }}
            />
            {busquedaCliente && !clienteSeleccionado && (
              <div className="border rounded max-h-40 overflow-y-auto mt-1">
                {clientesFiltrados.map((c) => (
                  <div
                    key={c.ID_Cliente}

                    className="text-sm hover:bg-gray-100 cursor-pointer py-2 px-3"
                    onClick={() => {
                      setClienteSeleccionado(c)
                      setBusquedaCliente('')
                    }}
                  >
                    {c.Cli_Nombre}
                  </div>
                ))}
                {clientesFiltrados.length === 0 && (
                  <div className="text-sm text-gray-400 py-2 px-3">No se encontraron clientes</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Monto</label>
            <input
              type="number"
              min="1"
              step="1"

              className="w-full border rounded text-sm py-2 px-3"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Medio de pago (con el que se presta)</label>
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
            <textarea

              className="w-full border rounded text-sm py-2 px-3"
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"

              className="text-sm rounded border py-2 px-4"
              onClick={() => { resetForm(); onClose() }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}

              className="text-sm rounded bg-blue-600 text-white disabled:opacity-50 py-2 px-4"
            >
              {guardando ? 'Guardando...' : 'Guardar préstamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}