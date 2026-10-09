import { useState, useEffect } from 'react'
import { usePrestamosStore } from '../store/Useprestamosstore'
import { getClientes } from '@/api/clientes_api'
import {
  X,
  Search,
  User,
  AlertCircle,
  HandCoins,
  Loader2,
  CheckCircle2,
  Banknote,
  ArrowLeftRight,
} from 'lucide-react'

// Estilo "Data-Dense Dashboard" (ui-ux-pro-max): modal de formulario con
// etiquetas visibles (nunca solo placeholder), ayudas bajo el campo, estados de
// foco visibles y feedback de error junto al campo afectado.

const MEDIOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
]

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
  const [buscando, setBuscando] = useState(false)

  // No se limpia el estado con un efecto al cerrar: la lista solo se pinta
  // cuando hay búsqueda activa y no hay cliente elegido, así que el estado
  // obsoleto es inalcanzable. Además, al abrir, el efecto de búsqueda parte de
  // `busquedaCliente === ''`, que deja la lista vacía.

  // Busqueda de clientes en el backend, con debounce (ya no trae 200 fijos).
  // El setState se hace dentro del callback del timer (nunca en el cuerpo del
  // efecto) para evitar renders en cascada.
  useEffect(() => {
    const termino = busquedaCliente.trim()
    if (!isOpen || !termino || clienteSeleccionado) return

    const timer = setTimeout(() => {
      setBuscando(true)
      getClientes(1, 20, termino)
        .then((res) => setClientes(res.data.items || res.data.datos || []))
        .catch(() => setClientes([]))
        .finally(() => setBuscando(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaCliente, isOpen, clienteSeleccionado])


  // Cerrar con Escape (patrón de accesibilidad del skill)
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !guardando) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, guardando, onClose])

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
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => !guardando && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-prestamo"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
              <HandCoins size={18} color="#818cf8" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="titulo-nuevo-prestamo"
                className="text-base font-bold text-slate-800 m-0"
              >
                Nuevo préstamo
              </h2>
              <p className="text-xs text-slate-500 m-0">
                Registra un crédito a nombre de un cliente
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 overflow-y-auto">
          {/* ── Cliente ── */}
          <div>
            <label
              htmlFor="prestamo-cliente"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Cliente <span className="text-rose-500">*</span>
            </label>

            {clienteSeleccionado ? (
              <div className="flex items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold text-indigo-800 truncate">
                    {clienteSeleccionado.Cli_Nombre}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setClienteSeleccionado(null)
                    setBusquedaCliente('')
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="prestamo-cliente"
                  type="text"
                  autoComplete="off"
                  placeholder="Buscar por nombre o identificación..."
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
                  value={busquedaCliente}
                  onChange={(e) => {
                    setClienteSeleccionado(null)
                    setBusquedaCliente(e.target.value)
                  }}
                />
                {buscando && (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin"
                  />
                )}
              </div>
            )}

            {busquedaCliente && !clienteSeleccionado && (
              <div className="border border-slate-200 rounded-xl max-h-44 overflow-y-auto mt-2 shadow-sm">
                {clientesFiltrados.map((c) => (
                  <button
                    type="button"
                    key={c.ID_Cliente}
                    className="w-full text-left text-sm hover:bg-indigo-50 flex items-center gap-2.5 px-3.5 py-2.5 transition-colors border-b border-slate-50 last:border-0 focus-visible:outline-none focus-visible:bg-indigo-50 cursor-pointer"
                    onClick={() => {
                      setClienteSeleccionado(c)
                      setBusquedaCliente('')
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="w-7 h-7 shrink-0 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center uppercase"
                    >
                      {String(c.Cli_Nombre || '?').trim().charAt(0)}
                    </span>
                    <span className="text-slate-700 truncate">{c.Cli_Nombre}</span>
                  </button>
                ))}
                {!buscando && clientesFiltrados.length === 0 && (
                  <div className="text-sm text-slate-400 flex items-center gap-2 px-3.5 py-3">
                    <User size={14} aria-hidden="true" />
                    No se encontraron clientes
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Monto ── */}
          <div>
            <label
              htmlFor="prestamo-monto"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Monto <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">
                $
              </span>
              <input
                id="prestamo-monto"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="0"
                className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-300 placeholder:font-normal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 m-0">
              Monto total que se entrega al cliente.
            </p>
          </div>

          {/* ── Medio de pago: botones en vez de <select> ── */}
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 p-0">
              Medio de pago <span className="text-rose-500">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {MEDIOS_PAGO.map((m) => {
                const Icono = m.icon
                const activo = medioPago === m.value
                return (
                  <button
                    type="button"
                    key={m.value}
                    aria-pressed={activo}
                    onClick={() => setMedioPago(m.value)}
                    className={`flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                      activo
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icono size={15} aria-hidden="true" />
                    {m.label}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 m-0">
              Medio con el que se entrega el dinero.
            </p>
          </fieldset>

          {/* ── Observación ── */}
          <div>
            <label
              htmlFor="prestamo-observacion"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Observación <span className="text-slate-400 font-medium normal-case">(opcional)</span>
            </label>
            <textarea
              id="prestamo-observacion"
              rows={2}
              placeholder="Ej: préstamo para compra de insumos"
              className="w-full border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all resize-none placeholder:text-slate-400"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>

          {/* ── Error (junto a las acciones, con rol de alerta) ── */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3"
            >
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-rose-700 m-0">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              disabled={guardando}
              className="flex-1 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all py-2.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              onClick={() => {
                resetForm()
                onClose()
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/30 disabled:opacity-50 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              {guardando ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                <>
                  <HandCoins size={15} aria-hidden="true" />
                  Guardar préstamo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}