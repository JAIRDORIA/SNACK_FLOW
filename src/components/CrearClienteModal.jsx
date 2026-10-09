import { useState, useEffect } from 'react'
import { X, UserPlus, AlertCircle, Loader2, Check } from 'lucide-react'
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
 *
 * Diseño (ui-ux-pro-max): etiquetas visibles siempre, campo obligatorio marcado,
 * validación con mensaje junto al campo afectado, ayudas bajo el campo y foco
 * visible en todos los controles. El botón de guardar permanece deshabilitado
 * hasta que los campos mínimos son válidos (evita el error tardío).
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

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !guardando) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, guardando, onClose])

  if (!open) return null

  const nombreCompleto = `${form.nombres.trim()} ${form.apellidos.trim()}`.trim()
  const identificacion = form.identificacion.trim()

  // Mínimos para habilitar el envío: nombre y apellido.
  const puedeGuardar = form.nombres.trim().length > 0 && form.apellidos.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (guardando) return

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

  const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  // Clase compartida de los inputs (foco visible + borde de error consistente).
  const claseInput =
    'w-full mt-1.5 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none text-slate-700 bg-white transition-all focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 placeholder:text-slate-400 disabled:bg-slate-50'

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={() => !guardando && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-crear-cliente"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
              <UserPlus size={18} color="#818cf8" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="titulo-crear-cliente"
                className="text-base font-bold text-slate-800 m-0"
              >
                Registrar cliente
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Solo nombres y apellidos son obligatorios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto">
          {/* Nombres + Apellidos en dos columnas en pantallas medianas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cliente-nombres"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Nombres <span className="text-rose-500">*</span>
              </label>
              <input
                id="cliente-nombres"
                type="text"
                value={form.nombres}
                onChange={(e) =>
                  setCampo('nombres', e.target.value.replace(/[0-9]/g, '').slice(0, 30))
                }
                placeholder="Ej: Juan Carlos"
                className={claseInput}
                autoFocus
                required
              />
            </div>

            <div>
              <label
                htmlFor="cliente-apellidos"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Apellidos <span className="text-rose-500">*</span>
              </label>
              <input
                id="cliente-apellidos"
                type="text"
                value={form.apellidos}
                onChange={(e) =>
                  setCampo('apellidos', e.target.value.replace(/[0-9]/g, '').slice(0, 30))
                }
                placeholder="Ej: Pérez García"
                className={claseInput}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cliente-identificacion"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Identificación
              </label>
              <input
                id="cliente-identificacion"
                type="text"
                inputMode="numeric"
                value={form.identificacion}
                onChange={(e) =>
                  setCampo('identificacion', e.target.value.replace(/[^0-9]/g, '').slice(0, 20))
                }
                placeholder="Ej: 1234567890"
                className={claseInput}
              />
            </div>

            <div>
              <label
                htmlFor="cliente-telefono"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Teléfono
              </label>
              <input
                id="cliente-telefono"
                type="tel"
                inputMode="tel"
                value={form.telefono}
                onChange={(e) =>
                  setCampo('telefono', e.target.value.replace(/[^0-9+]/g, '').slice(0, 15))
                }
                placeholder="3001234567"
                className={claseInput}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="cliente-direccion"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Dirección
            </label>
            <input
              id="cliente-direccion"
              type="text"
              value={form.direccion}
              onChange={(e) => setCampo('direccion', e.target.value)}
              placeholder="Calle 123 #45-67"
              className={claseInput}
            />
          </div>

          <div>
            <label
              htmlFor="cliente-email"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Email
            </label>
            <input
              id="cliente-email"
              type="email"
              value={form.email}
              onChange={(e) => setCampo('email', e.target.value)}
              placeholder="correo@ejemplo.com"
              className={claseInput}
            />
            <p className="text-[11px] text-slate-400 mt-1.5 m-0">
              Opcional. Se usa solo para contacto.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3"
            >
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-rose-700 m-0">{error}</p>
            </div>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !puedeGuardar}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              {guardando ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check size={15} aria-hidden="true" />
                  Guardar cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
