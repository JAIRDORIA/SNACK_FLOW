import { useEffect, useState } from 'react'
import { usePrestamosStore } from '../../store/Useprestamosstore'
import NuevoPrestamoModal from '../../components/nuevoprestamomodal'
import AbonarPrestamoModal from '../../components/Pagarprestamomodal'
import { formatearFechaColombia } from '../../utils/formatearFecha'
import {
  Plus,
  Search,
  Wallet,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  HandCoins,
  Users,
} from 'lucide-react'

// Estilo "Data-Dense Dashboard" (ui-ux-pro-max): KPIs arriba, tabla densa con
// cabecera sticky y hover por fila, y degradado a tarjetas en móvil (la tabla
// ancha no debe romper el layout en pantallas pequeñas — regla UX del skill).

const ESTADO_CFG = {
  pagado: {
    label: 'Pagado',
    bg: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
    icon: <CheckCircle2 size={12} aria-hidden="true" />,
  },
  pendiente: {
    label: 'Pendiente',
    bg: '#fef9e7',
    color: '#b45309',
    border: '#fde68a',
    icon: <Clock size={12} aria-hidden="true" />,
  },
}

export default function Prestamos() {
  const { prestamos, loading, error, filtroEstado, setFiltroEstado, fetchPrestamos } =
    usePrestamosStore()
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [prestamoAAbonar, setPrestamoAAbonar] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchPrestamos()
  }, [])

  // Totales derivados de la lista cargada (misma fuente que la tabla).
  const totalPrestado = prestamos.reduce((acc, p) => acc + (p.monto || 0), 0)
  const totalAbonado = prestamos.reduce((acc, p) => acc + (p.total_abonado || 0), 0)
  const totalSaldo = prestamos.reduce((acc, p) => acc + (p.saldo_pendiente || 0), 0)
  const cantPendientes = prestamos.filter((p) => p.estado === 'pendiente').length
  const cantPagados = prestamos.filter((p) => p.estado === 'pagado').length

  const kpis = [
    {
      label: 'Total prestado',
      value: `$${totalPrestado.toLocaleString('es-CO')}`,
      icon: Wallet,
      color: '#818cf8',
      ring: 'ring-indigo-400/40',
    },
    {
      label: 'Total abonado',
      value: `$${totalAbonado.toLocaleString('es-CO')}`,
      icon: HandCoins,
      color: '#34d399',
      ring: 'ring-emerald-400/40',
    },
    {
      label: 'Saldo por cobrar',
      value: `$${totalSaldo.toLocaleString('es-CO')}`,
      icon: TrendingDown,
      color: '#fb923c',
      ring: 'ring-orange-400/40',
    },
    {
      label: 'Pendientes',
      value: cantPendientes,
      icon: Clock,
      color: '#fbbf24',
      ring: 'ring-amber-400/40',
    },
    {
      label: 'Pagados',
      value: cantPagados,
      icon: CheckCircle2,
      color: '#22d3ee',
      ring: 'ring-cyan-400/40',
    },
  ]

  const filtros = [
    { key: '', label: 'Todos', count: prestamos.length },
    { key: 'pendiente', label: 'Pendientes', count: cantPendientes },
    { key: 'pagado', label: 'Pagados', count: cantPagados },
  ]

  // Búsqueda local: la tabla ya trae la lista completa desde el store.
  const termino = busqueda.trim().toLowerCase()
  const prestamosFiltrados = termino
    ? prestamos.filter((p) =>
        [p.cliente_nombre, p.observacion, String(p.id)]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(termino)),
      )
    : prestamos

  const inputBusqueda = (
    <div className="relative flex-1 min-w-[220px] max-w-md">
      <Search
        size={16}
        aria-hidden="true"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por cliente u observación..."
        aria-label="Buscar préstamos"
        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
      />
    </div>
  )

  return (
    <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ═══ ENCABEZADO ═══ */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
            <Users size={20} color="#818cf8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B1D2E] truncate m-0">
              Préstamos a clientes
            </h1>
            <p className="text-xs text-slate-500 m-0">
              Control de créditos, abonos y saldos pendientes
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalNuevoAbierto(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/30 active:scale-95 transition-all whitespace-nowrap py-2.5 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
        >
          <Plus size={16} aria-hidden="true" />
          Nuevo préstamo
        </button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icono = kpi.icon
          return (
            <div
              key={kpi.label}
              className="bg-[#1B1D2E] rounded-2xl flex items-center gap-3 p-3 sm:p-4 transition-transform hover:scale-[1.02]"
            >
              <div
                className={`bg-[#13152280] ring-2 ${kpi.ring} w-9 h-9 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center shrink-0`}
              >
                <Icono size={18} color={kpi.color} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg lg:text-xl font-bold text-white truncate tabular-nums m-0">
                  {kpi.value}
                </p>
                <p className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5 m-0">
                  {kpi.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ TABLA ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible">
        {/* barra de búsqueda + filtros */}
        <div className="border-b border-slate-100 flex gap-3 items-center flex-wrap p-3">
          {inputBusqueda}

          <div
            role="group"
            aria-label="Filtrar por estado"
            className="flex items-center gap-1 bg-slate-100 rounded-xl p-1"
          >
            {filtros.map((f) => {
              const activo = filtroEstado === f.key
              return (
                <button
                  key={f.key || 'todos'}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setFiltroEstado(f.key)}
                  className={`flex items-center gap-1.5 rounded-lg text-[13px] font-semibold transition-all py-2 px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                    activo
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                  <span
                    className={`text-[10px] rounded-full font-bold py-0.5 px-1.5 tabular-nums ${
                      activo ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-[13px] border-b border-red-100 bg-red-50 px-4 py-2.5">
            <AlertCircle size={15} aria-hidden="true" />
            {error}
          </div>
        )}

        {/* ── Tabla (sm y superior) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {[
                  { label: 'Cliente', align: 'left' },
                  { label: 'Monto prestado', align: 'right' },
                  { label: 'Abonado', align: 'right' },
                  { label: 'Saldo pendiente', align: 'right' },
                  { label: 'Observación', align: 'left' },
                  { label: 'Estado', align: 'left' },
                  { label: 'Fecha', align: 'left' },
                  { label: 'Acciones', align: 'right' },
                ].map((col) => (
                  <th
                    key={col.label}
                    scope="col"
                    className={`sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[13px] text-slate-500 font-medium m-0">
                        Cargando préstamos...
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && prestamosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-24">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Wallet size={26} className="text-slate-300" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 m-0">
                        {termino ? 'Sin resultados para esta búsqueda' : 'No hay préstamos registrados'}
                      </p>
                      <p className="text-xs text-slate-400 m-0">
                        {termino
                          ? 'Intenta con otro cliente u observación'
                          : 'Registra el primer préstamo para verlo aquí'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                prestamosFiltrados.map((p, i) => {
                  const cfg = ESTADO_CFG[p.estado] ?? ESTADO_CFG.pendiente
                  const esPagado = p.estado === 'pagado'

                  return (
                    <tr
                      key={p.id}
                      className={`group transition-colors ${
                        i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      } hover:bg-indigo-50/50`}
                    >
                      <td className="px-4 py-3 border-b border-slate-100 max-w-[220px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            aria-hidden="true"
                            className="w-7 h-7 shrink-0 rounded-full bg-indigo-100 text-indigo-600 text-[11px] font-bold flex items-center justify-center uppercase"
                          >
                            {String(p.cliente_nombre || '?').trim().charAt(0)}
                          </span>
                          <span
                            className="text-[13px] font-medium text-slate-700 truncate"
                            title={p.cliente_nombre}
                          >
                            {p.cliente_nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-right whitespace-nowrap text-[13px] font-semibold text-slate-800 tabular-nums">
                        ${p.monto?.toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-right whitespace-nowrap text-[13px] font-medium text-emerald-700 tabular-nums">
                        ${p.total_abonado?.toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-right whitespace-nowrap">
                        <span
                          className={`text-[13px] font-bold tabular-nums ${
                            esPagado ? 'text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          ${p.saldo_pendiente?.toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 max-w-[240px]">
                        <span
                          className="block text-[13px] text-slate-500 truncate"
                          title={p.observacion || ''}
                        >
                          {p.observacion || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] rounded-full font-semibold border py-1 px-2.5"
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            borderColor: cfg.border,
                          }}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap text-[13px] text-slate-500 tabular-nums">
                        {formatearFechaColombia(p.fecha)}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center justify-end">
                          {esPagado ? (
                            <span className="text-[11px] text-slate-400 font-medium pr-1">
                              Sin saldo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPrestamoAAbonar(p)}
                              aria-label={`Abonar al préstamo de ${p.cliente_nombre}`}
                              className="inline-flex items-center gap-1.5 text-[12px] rounded-lg font-semibold bg-indigo-600 text-white py-1.5 px-3 whitespace-nowrap transition-all hover:bg-indigo-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 cursor-pointer"
                            >
                              <HandCoins size={13} aria-hidden="true" />
                              Abonar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* ── Tarjetas (móvil) ── */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-14">
              <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] text-slate-500 font-medium m-0">Cargando préstamos...</p>
            </div>
          )}

          {!loading && prestamosFiltrados.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Wallet size={26} className="text-slate-300" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-600 m-0">
                {termino ? 'Sin resultados para esta búsqueda' : 'No hay préstamos registrados'}
              </p>
            </div>
          )}

          {!loading &&
            prestamosFiltrados.map((p) => {
              const cfg = ESTADO_CFG[p.estado] ?? ESTADO_CFG.pendiente
              const esPagado = p.estado === 'pagado'

              return (
                <div key={p.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        aria-hidden="true"
                        className="w-8 h-8 shrink-0 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center uppercase"
                      >
                        {String(p.cliente_nombre || '?').trim().charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate m-0">
                          {p.cliente_nombre}
                        </p>
                        <p className="text-[11px] text-slate-400 m-0 tabular-nums">
                          {formatearFechaColombia(p.fecha)}
                        </p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] rounded-full font-semibold border py-1 px-2.5 shrink-0"
                      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Prestado', value: p.monto, cls: 'text-slate-800' },
                      { label: 'Abonado', value: p.total_abonado, cls: 'text-emerald-700' },
                      { label: 'Saldo', value: p.saldo_pendiente, cls: esPagado ? 'text-slate-400' : 'text-slate-900' },
                    ].map((item) => (
                      <div key={item.label} className="bg-slate-50 rounded-xl px-2.5 py-2">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide m-0">
                          {item.label}
                        </p>
                        <p className={`text-[13px] font-bold m-0 tabular-nums ${item.cls}`}>
                          ${item.value?.toLocaleString('es-CO')}
                        </p>
                      </div>
                    ))}
                  </div>

                  {p.observacion && (
                    <p className="text-[12px] text-slate-500 m-0">
                      <span className="text-slate-400">Observación: </span>
                      {p.observacion}
                    </p>
                  )}

                  {!esPagado && (
                    <button
                      type="button"
                      onClick={() => setPrestamoAAbonar(p)}
                      aria-label={`Abonar al préstamo de ${p.cliente_nombre}`}
                      className="w-full flex items-center justify-center gap-2 text-sm rounded-xl font-semibold bg-indigo-600 text-white py-2.5 transition-all hover:bg-indigo-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 cursor-pointer"
                    >
                      <HandCoins size={15} aria-hidden="true" />
                      Abonar
                    </button>
                  )}
                </div>
              )
            })}
        </div>

        {/* pie */}
        {!loading && prestamosFiltrados.length > 0 && (
          <div className="border-t border-slate-200 flex justify-between items-center gap-3 flex-wrap text-[13px] text-slate-500 bg-slate-50/60 px-5 py-4">
            <span>
              Mostrando{' '}
              <strong className="text-slate-700 font-semibold tabular-nums">
                {prestamosFiltrados.length}
              </strong>{' '}
              de{' '}
              <strong className="text-slate-700 font-semibold tabular-nums">
                {prestamos.length}
              </strong>{' '}
              préstamos
            </span>
            <span className="tabular-nums">
              Saldo total:{' '}
              <strong className="text-slate-700 font-semibold">
                ${totalSaldo.toLocaleString('es-CO')}
              </strong>
            </span>
          </div>
        )}
      </div>

      <NuevoPrestamoModal
        isOpen={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        onSuccess={fetchPrestamos}
      />

      {prestamoAAbonar && (
        <AbonarPrestamoModal
          prestamo={prestamoAAbonar}
          onClose={() => setPrestamoAAbonar(null)}
          onSuccess={fetchPrestamos}
        />
      )}
    </div>
  )
}