import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '@/api/axios'

const FORM_VACIO = {
  nombres: '',
  apellidos: '',
  identificacion: '',
  telefono: '',
  direccion: '',
  email: '',
}

/**
 * Modal reutilizable para registrar un cliente.
 *
 * Se usa desde el módulo de clientes (CustomersManager) y desde el modal de
 * nueva venta (botón "+" al lado del campo Cliente), para no obligar al usuario
 * a salir de la venta cuando el cliente todavía no existe.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onCreated: (payload) => void | Promise  // se llama tras crear con el nombre/identificación
 *  - onError?: (mensaje: string) => void     // si no se pasa, el error se muestra dentro del modal
 */
export default function CrearClienteModal({ open, onClose, onCreated, onError }) {
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Limpiar el formulario cada vez que se abre
  useEffect(() => {
    if (open) {
      setForm(FORM_VACIO)
      setError('')
      setGuardando(false)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (guardando) return

    const nombreCompleto = `${form.nombres.trim()} ${form.apellidos.trim()}`.trim()
    const identificacion = form.identificacion.trim()

    setGuardando(true)
    setError('')

    try {
      await api.post('/clientes/', {
        nombre: nombreCompleto,
        identificacion,
        telefono: form.telefono,
        direccion: form.direccion,
        email: form.email,
      })

      // Datos del cliente recién creado (mismo shape que usa el buscador:
      // ID_Cliente / Cli_Nombre / Cli_identificacion).
      const clienteCreado = {
        Cli_Nombre: nombreCompleto,
        Cli_identificacion: identificacion || 'S/N',
      }

      setForm(FORM_VACIO)
      onCreated?.(clienteCreado)
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'Error al guardar cliente'
      if (onError) onError(mensaje)
      else setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 py-4 px-6">
          <h3 className="text-lg font-bold text-gray-800">Registrar Cliente</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={18} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Nombres</label>
            <input
              type="text"
              value={form.nombres}
              onChange={(e) => {
                const valor = e.target.value.replace(/[0-9]/g, '').slice(0, 30)
                setForm((f) => ({ ...f, nombres: valor }))
              }}
              placeholder="Ej: Juan Carlos"
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Apellidos</label>
            <input
              type="text"
              value={form.apellidos}
              onChange={(e) => {
                const valor = e.target.value.replace(/[0-9]/g, '').slice(0, 30)
                setForm((f) => ({ ...f, apellidos: valor }))
              }}
              placeholder="Ej: Pérez García"
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Identificación</label>
            <input
              type="text"
              value={form.identificacion}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^0-9]/g, '').slice(0, 20)
                setForm((f) => ({ ...f, identificacion: valor }))
              }}
              placeholder="Ej: 1234567890"
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^0-9+]/g, '').slice(0, 15)
                setForm((f) => ({ ...f, telefono: valor }))
              }}
              placeholder="3001234567"
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              placeholder="Calle 123"
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm py-2.5 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
