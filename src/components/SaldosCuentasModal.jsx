import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronRight,
  Landmark,
  Loader2,
  PiggyBank,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { obtenerSaldos } from '@/api/medios_pago_api'
import { formatoMoneda } from '@/utils/formatoCifras'
import MovimientosCuentaModal from '@/components/MovimientosCuentaModal'
import VaciarCuentasModal from '@/components/cuentas/VaciarCuentasModal'

// Modal "Saldos por cuenta": lista el saldo actual de cada cuenta de
// transferencia y permite abrir sus movimientos.
//
// El total del encabezado (`total_transferencia`) es global: el backend lo
// calcula sobre todas las cuentas, así que NO se recalcula al filtrar. Por eso
// solo se actualiza cuando la consulta va sin término de búsqueda.
//
// Carrera de peticiones: cada fetch lleva un id en un ref; las respuestas viejas
// (el usuario escribió rápido en el buscador) se descartan.

const DEBOUNCE_MS = 300

const esActiva = (cuenta) =>
  cuenta?.activo === 1 || cuenta?.activo === '1' || cuenta?.activo === true

export default function SaldosCuentasModal({ onClose, onActualizado }) {
  const [busqueda, setBusqueda] = useState('')
  // Término ya debounced con el que se consulta la API.
  const [buscar, setBuscar] = useState('')
  // Contador para "Reintentar".
  const [recarga, setRecarga] = useState(0)

  const [total, setTotal] = useState(null)
  // Cuentas con saldo de la última consulta sin filtro (para la confirmación).
  const [cuentasConSaldo, setCuentasConSaldo] = useState(0)
  const [datos, setDatos] = useState({ clave: null, cuentas: [], cantidad: 0 })
  const [error, setError] = useState({ clave: null, mensaje: null })
  const [cuentaMovimientos, setCuentaMovimientos] = useState(null)
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)

  const peticionRef = useRef(0)
  const panelRef = useRef(null)

  const clave = `${buscar}|${recarga}`
  const errorActual = error.clave === clave ? error.mensaje : null
  const cargando = datos.clave !== clave && !errorActual
  const cuentas = datos.cuentas
  const cantidad = datos.cantidad

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const esAdmin = usuario?.rol === 'admin'

  // Cierre con Escape. Si hay movimientos abiertos encima, el Escape es para
  // ese modal, no para este.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !cuentaMovimientos && !confirmarVaciar) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, cuentaMovimientos, confirmarVaciar])

  // Foco inicial en el diálogo.
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  // Debounce del buscador.
  useEffect(() => {
    const timer = setTimeout(() => setBuscar(busqueda.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [busqueda])

  // Carga de saldos. `peticionRef` descarta respuestas viejas.
  useEffect(() => {
    const idPeticion = ++peticionRef.current

    obtenerSaldos(buscar)
      .then((res) => {
        if (idPeticion !== peticionRef.current) return
        const data = res.data || {}
        const lista = Array.isArray(data.cuentas) ? data.cuentas : []
        setDatos({
          clave,
          cuentas: lista,
          cantidad: Number(data.cantidad ?? lista.length),
        })
        // Total global: solo se refresca con la consulta sin filtro.
        if (!buscar) {
          setTotal(Number(data.total_transferencia ?? 0))
          setCuentasConSaldo(lista.filter((c) => Number(c.saldo) > 0).length)
        }
        setError({ clave: null, mensaje: null })
      })
      .catch((err) => {
        if (idPeticion !== peticionRef.current) return
        setDatos({ clave, cuentas: [], cantidad: 0 })
        setError({
          clave,
          mensaje:
            err?.response?.data?.mensaje ||
            err?.response?.data?.error ||
            'No se pudieron cargar los saldos.',
        })
      })
  }, [clave, buscar, recarga])

  const abrirMovimientos = (cuenta) => {
    // El endpoint de saldos usa `medio_pago_id`; el modal de movimientos
    // espera `id`.
    setCuentaMovimientos({ ...cuenta, id: cuenta.medio_pago_id })
  }

  const vaciadoExitoso = () => {
    // Refresca la lista y el total del modal detrás de la confirmación. El
    // padre (Balance) refresca sus cards con `onActualizado`.
    setBusqueda('')
    setBuscar('')
    setRecarga((n) => n + 1)
    onActualizado?.()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-saldos-cuentas"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] outline-none"
        >
          {/* ── Encabezado ── */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
                  <Landmark size={18} color="#818cf8" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 id="titulo-saldos-cuentas" className="text-base font-bold text-slate-800 m-0">
                    Saldos por cuenta
                  </h3>
                  <p className="text-xs text-slate-500 m-0">
                    Dinero disponible en cada cuenta de transferencia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {esAdmin && (
              <button
                type="button"
                onClick={() => setConfirmarVaciar(true)}
                disabled={total === null || total <= 0}
                title={
                  total === null
                    ? 'Cargando saldos...'
                    : total <= 0
                      ? 'No hay saldo para retirar'
                      : 'Vaciar todas las cuentas a ahorros'
                }
                className="mt-3 w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-semibold hover:bg-indigo-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 cursor-pointer"
              >
                <PiggyBank size={16} aria-hidden="true" />
                Vaciar todas a ahorros
              </button>
            )}
          </div>

          {/* ── Total ── */}
          <div className="px-5 sm:px-6 pt-3 pb-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 m-0">Total</p>
            <p className="text-2xl font-bold text-[#1B1D2E] tabular-nums m-0 leading-tight">
              {total === null ? '—' : `$${formatoMoneda(total)}`}
            </p>
            <p className="text-[11px] text-slate-500 m-0">Suma de todas las cuentas</p>
          </div>

          {/* ── Buscador ── */}
          <div className="px-5 sm:px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                size={16}
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o titular..."
                aria-label="Buscar cuentas por nombre o titular"
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
              />
            </div>
            <span className="text-xs text-slate-500" aria-live="polite">
              {cantidad} {cantidad === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </div>

          {/* ── Lista ── */}
          <div className="flex-1 overflow-y-auto" aria-busy={cargando}>
            {cargando && cuentas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 size={26} className="animate-spin text-indigo-500" aria-hidden="true" />
                <p className="text-sm text-slate-500 m-0">Cargando saldos...</p>
              </div>
            ) : errorActual ? (
              <div className="m-5 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="text-rose-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-rose-700 m-0">
                    Error al cargar los saldos
                  </p>
                  <p className="text-xs text-rose-600 mt-1 m-0">{errorActual}</p>
                  <button
                    type="button"
                    onClick={() => setRecarga((n) => n + 1)}
                    className="mt-3 min-h-[44px] flex items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 bg-white hover:bg-rose-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    Reintentar
                  </button>
                </div>
              </div>
            ) : cuentas.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Landmark size={26} className="text-slate-300" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-600 m-0">
                  {buscar
                    ? 'No hay cuentas que coincidan con la búsqueda'
                    : 'Aún no hay cuentas de transferencia'}
                </p>
                <p className="text-xs text-slate-500 m-0">
                  {buscar
                    ? 'Prueba con otro nombre o titular.'
                    : 'Crea una cuenta para empezar a registrar transferencias.'}
                </p>
              </div>
            ) : (
              <div className={`divide-y divide-slate-100 ${cargando ? 'opacity-60' : ''}`}>
                {cuentas.map((cuenta) => {
                  const activa = esActiva(cuenta)
                  return (
                    <button
                      key={cuenta.medio_pago_id}
                      type="button"
                      onClick={() => abrirMovimientos(cuenta)}
                      aria-label={`Ver movimientos de ${cuenta.nombre}`}
                      className="w-full text-left flex items-center justify-between gap-3 px-4 sm:px-6 py-3 hover:bg-indigo-50/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 m-0 truncate">
                          {cuenta.nombre}
                        </p>
                        {cuenta.titular && (
                          <p className="text-[11px] text-slate-500 m-0 truncate">
                            {cuenta.titular}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!activa && (
                          <span className="inline-flex items-center text-[10px] rounded-full font-semibold border bg-slate-100 text-slate-500 border-slate-200 py-0.5 px-2">
                            Inactiva
                          </span>
                        )}
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                          ${formatoMoneda(cuenta.saldo)}
                        </span>
                        <ChevronRight
                          size={15}
                          className="text-slate-300"
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Pie ── */}
          <div className="border-t border-slate-100 px-5 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] text-slate-500">
              Toca una cuenta para ver sus movimientos.
            </span>
            {esAdmin && (
              <Link
                to="/cuentas"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 rounded-lg px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <SlidersHorizontal size={13} aria-hidden="true" />
                Administrar cuentas
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Movimientos apilados sobre este modal (hermano del overlay para que
          el clic en su fondo no cierre también esta lista). */}
      {cuentaMovimientos && (
        <MovimientosCuentaModal
          cuenta={cuentaMovimientos}
          onClose={() => setCuentaMovimientos(null)}
        />
      )}

      {confirmarVaciar && (
        <VaciarCuentasModal
          cantidad={cuentasConSaldo}
          total={Number(total ?? 0)}
          onClose={() => setConfirmarVaciar(false)}
          onExito={vaciadoExitoso}
        />
      )}
    </>
  )
}
