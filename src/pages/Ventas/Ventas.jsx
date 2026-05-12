import { useState, useRef, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, X,
  AlertTriangle, CheckCircle, Clock, XCircle,
  SlidersHorizontal, ChevronDown, Info,
  TrendingUp, DollarSign, Clock3, ShoppingBag,
  PanelBottom,CheckCheck
} from 'lucide-react'
import useVentasStore from '@/store/useVentasStore'
import { getVentaDetalle } from '@/api/ventas_api'

// ══════════════════════════════════════════
// CONFIGURACION DE ESTILOS
// ══════════════════════════════════════════
const ESTADOS_CONFIG = {
  pendiente: {
    bg: '#fef9e7', color: '#b45309', border: '#fde68a',
    icon: <Clock size={12} />, label: 'Pendiente'
  },
  entregada: {
    bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0',
    icon: <CheckCircle size={12} />, label: 'Entregada'
  },
  anulada: {
    bg: '#fef2f2', color: '#dc2626', border: '#fecaca',
    icon: <XCircle size={12} />, label: 'Anulada'
  },
}

const TIPO_CONFIG = {
  efectivo: { bg: '#f0fdf4', color: '#15803d', label: 'Efectivo' },
  transferencia: { bg: '#eff6ff', color: '#1d4ed8', label: 'Transferencia' },
  abono: { bg: '#fefce8', color: '#854d0e', label: 'Abono' },
  otro: { bg: '#f9fafb', color: '#6b7280', label: 'Otro' },
}

// ══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════
export default function Ventas() {
  const {
    ventas, total, pagina, total_paginas,
    cargando, error, fetchVentas
  } = useVentasStore()
  const [detalleVenta, setDetalleVenta] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [eliminarId, setEliminarId] = useState(null)
  const [panelFiltro, setPanelFiltro] = useState(false)
  const [filtroEstados, setFiltroEstados] = useState([])
  const [filtroTipos, setFiltroTipos] = useState([])
  const filtroRef = useRef(null)

  useEffect(() => {
    fetchVentas()
  }, [])

  useEffect(() => {
    const fn = (e) => {
      if (filtroRef.current && !filtroRef.current.contains(e.target))
        setPanelFiltro(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const toggleEstado = (v) =>
    setFiltroEstados(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])
  const toggleTipo = (v) =>
    setFiltroTipos(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])
  const limpiarFiltros = () => { setFiltroEstados([]); setFiltroTipos([]) }
  const nFiltros = filtroEstados.length + filtroTipos.length

  const verDetalle = async (id) => {
    setCargandoDetalle(true)
    try {
      const res = await getVentaDetalle(id)
      setDetalleVenta(res.data)
    } catch (err) {
      console.error("Error al cargar detalle", err)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const lista = ventas.filter(v => {
    const q = busqueda.toLowerCase()
    const matchQ =
      String(v.id_venta).includes(q) ||
      v.nombre_cliente?.toLowerCase().includes(q) ||
      v.fecha_entrega?.includes(q) ||
      v.estado?.toLowerCase().includes(q)
    const matchE = filtroEstados.length === 0 || filtroEstados.includes(v.estado)
    const matchT = filtroTipos.length === 0 || filtroTipos.includes(v.medio_pago)
    return matchQ && matchE && matchT
  })

  const totalMonto = lista.reduce((acc, v) => acc + (v.total || 0), 0)
  const pendientes = lista.filter(v => v.estado === 'pendiente').length

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Cargando ventas...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 max-w-2xl">
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <div>
        <p className="text-red-700 font-semibold text-sm mb-1">Error al cargar ventas</p>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: "32px" }} className="flex-1 bg-gray-50 p-8" >

      <div style={{ marginBottom: '32px' }} className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">

          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#000000',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>
              Gestión De Ventas
            </h1>

          </div>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ padding: "8px 8px" }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white  rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95">
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nueva Venta</span>
        </button>
      </div>

      {/* ═══ KPI CARDS (Estilo Dashboard) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Monto Total */}
        <div
          className='bg-[#1B1D2E] rounded-2xl  flex items-center gap-4 hover:scale-[1.02] transition-all'
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >

          <div style={{ margin: "20px 0px 20px 20px" }} className='bg-[#13152280] ring-2 ring-orange-400/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0'>
            <DollarSign size={22} color="#fb923c" />

          </div>
          <div>
            <p className='text-3xl text-white'>
              ${totalMonto.toLocaleString('es-CO')}
            </p>
            <p className='text-xs text-white/50 mt-0.5 '>
              Ingresos totales
            </p>
          </div>

        </div>

        {/* Total Ventas */}
        <div
          className='bg-[#1B1D2E] rounded-2xl  flex items-center gap-4 hover:scale-[1.02] transition-all'
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >

          <div style={{ margin: "20px 0px 20px 20px" }} className='bg-[#13152280] ring-2 ring-indigo-500/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0'>
            <ShoppingBag className=' w-6 h-6 text-indigo-300' />
          </div>

          <div>
            <p className='text-3xl text-white'>
              {lista.length}
            </p>
            <p className='text-xs text-white/50 mt-0.5 '>
              Total Ventas
            </p>

          </div>
        </div>




        {/*entregadas*/}

         <div
          className='bg-[#1B1D2E] rounded-2xl  flex items-center gap-4 hover:scale-[1.02] transition-all'
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >

          <div style={{ margin: "20px 0px 20px 20px" }} className='bg-[#13152280] ring-2 ring-cyan-400/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0'>
            <CheckCheck size={22} color="#22d3ee" />
          </div>

          <div>
            <p className='text-3xl text-white'>
              {pendientes}
            </p>
            <p className='text-xs text-white/50 mt-0.5 '>
              Entregadas
            </p>
          </div>

        </div>


{/* Pendientes */}
        <div
          className='bg-[#1B1D2E] rounded-2xl  flex items-center gap-4 hover:scale-[1.02] transition-all'
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >

          <div style={{ margin: "20px 0px 20px 20px" }} className='bg-[#13152280] ring-2 ring-[#e90e0e]/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0'>
            <Clock3 size={22} color="#e90e0e" />
          </div>

          <div>
            <p className='text-3xl text-white'>
              {pendientes}
            </p>
            <p className='text-xs text-white/50 mt-0.5 '>
              por entregar
            </p>
          </div>

        </div>

      </div>


      {/* ═══ TABLA ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* barra busqueda + filtro */}
        <div className="p-6 border-b border-slate-100 flex gap-4 items-center flex-wrap">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente, fecha o estado..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
          </div>

          <div ref={filtroRef} className="relative">
            <button
              onClick={() => setPanelFiltro(p => !p)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                border: nFiltros > 0 ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                background: nFiltros > 0 ? '#eef2ff' : '#fff',
                color: nFiltros > 0 ? '#4f46e5' : '#64748b',
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {nFiltros > 0 && (
                <span className="text-white rounded-full text-xs font-bold px-2.5 py-0.5" style={{ background: '#4f46e5' }}>
                  {nFiltros}
                </span>
              )}
              <ChevronDown
                size={14}
                style={{ transform: panelFiltro ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            {panelFiltro && (
              <div className="absolute top-full mt-3 left-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 z-40 min-w-80">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Estado</p>
                <div className="flex flex-col gap-3 mb-6">
                  {Object.entries(ESTADOS_CONFIG).map(([key, cfg]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filtroEstados.includes(key)}
                        onChange={() => toggleEstado(key)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          borderColor: cfg.border,
                        }}
                      >
                        {cfg.icon}{cfg.label}
                      </span>
                    </label>
                  ))}
                </div>

                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tipo de Pago</p>
                <div className="flex flex-col gap-3 mb-6">
                  {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtroTipos.includes(key)}
                        onChange={() => toggleTipo(key)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <span
                        className="px-4 py-2 rounded-full text-xs font-medium border border-transparent"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between">
                  <button
                    onClick={limpiarFiltros}
                    disabled={nFiltros === 0}
                    className="text-sm font-medium text-red-500 disabled:text-slate-300 bg-transparent border-none cursor-pointer hover:text-red-600 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                  <button
                    onClick={() => setPanelFiltro(false)}
                    className="text-sm font-semibold text-indigo-600 bg-transparent border-none cursor-pointer hover:text-indigo-700 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* tabla */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                {['ID Venta', 'Fecha', 'Cliente', 'Total', 'Tipo Pago', 'Estado', 'Acciones'].map((h, i) => (
                  <th key={h} className={`text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider ${i === 0 ? 'pl-8' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No se encontraron ventas</p>
                      <p className="text-xs text-slate-400">Intenta ajustar los filtros o la búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : lista.map((v, i) => {
                const tipoCfg = TIPO_CONFIG[v.medio_pago] ?? TIPO_CONFIG.otro
                const estadoCfg = ESTADOS_CONFIG[v.estado] ?? ESTADOS_CONFIG.pendiente
                return (
                  <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 pl-8">
                      <span className="font-semibold text-sm text-indigo-600">
                        #{String(v.id_venta).padStart(3, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">{v.fecha_entrega}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium text-sm">{v.nombre_cliente}</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold text-sm">
                      ${v.total?.toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs px-3.5 py-1.5 rounded-full font-medium"
                        style={{ background: tipoCfg.bg, color: tipoCfg.color }}
                      >
                        {tipoCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-medium border"
                        style={{
                          background: estadoCfg.bg,
                          color: estadoCfg.color,
                          borderColor: estadoCfg.border,
                        }}
                      >
                        {estadoCfg.icon}{estadoCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 pr-8">
                      <div className="flex gap-1">
                        <button
                          title="Ver detalle"
                          onClick={() => verDetalle(v.id_venta)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-indigo-50"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          <Info size={16} color="#4f46e5" />
                        </button>
                        <button
                          title="Editar"
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-50"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          <Pencil size={16} color="#64748b" />
                        </button>
                        <button
                          title="Anular"
                          onClick={() => setEliminarId(v.id_venta)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* pie tabla */}
        <div className="px-8 py-5 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/30">
          <span className="text-sm">
            Mostrando <strong className="text-slate-700 font-semibold">{lista.length}</strong> de{' '}
            <strong className="text-slate-700 font-semibold">{total}</strong> ventas
          </span>

          {total_paginas > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchVentas(pagina - 1)}
                disabled={pagina === 1}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
                style={{ cursor: pagina === 1 ? 'not-allowed' : 'pointer' }}
              >
                ← Anterior
              </button>
              <span className="text-sm text-slate-500 px-3 font-medium">
                {pagina} / {total_paginas}
              </span>
              <button
                onClick={() => fetchVentas(pagina + 1)}
                disabled={pagina === total_paginas}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
                style={{ cursor: pagina === total_paginas ? 'not-allowed' : 'pointer' }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODAL CONFIRMAR ANULAR ═══ */}
      {eliminarId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <p className="font-bold text-xl text-slate-800 mb-3">¿Anular venta?</p>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              La venta{' '}
              <span className="font-semibold text-indigo-600">
                #{String(eliminarId).padStart(3, '0')}
              </span>{' '}
              será anulada. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEliminarId(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all"
                style={{ cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setEliminarId(null)
                }}
                className="flex-1 py-3 border-none rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
                style={{ cursor: 'pointer' }}
              >
                Sí, anular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DETALLE VENTA ═══ */}
      {detalleVenta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">

            {/* header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <p className="font-bold text-xl text-slate-800">
                  Detalle de Venta{' '}
                  <span className="text-indigo-600">#{String(detalleVenta.id).padStart(3, '0')}</span>
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Cliente: <strong className="text-slate-700">{detalleVenta.nombre_cliente}</strong>
                </p>
              </div>
              <button
                onClick={() => setDetalleVenta(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div className="p-8 flex flex-col gap-8 max-h-[70vh] overflow-y-auto">

              {/* info general */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Total', value: detalleVenta.total, bg: '#eef2ff', color: '#4f46e5' },
                  { label: 'Total abonado', value: detalleVenta.total_abonado, bg: '#f0fdf4', color: '#15803d' },
                  {
                    label: 'Saldo pendiente',
                    value: detalleVenta.saldo_pendiente,
                    bg: detalleVenta.saldo_pendiente > 0 ? '#fef9e7' : '#f0fdf4',
                    color: detalleVenta.saldo_pendiente > 0 ? '#b45309' : '#15803d'
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-2xl p-6 text-center border border-slate-100" style={{ background: item.bg }}>
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{item.label}</p>
                    <p className="text-2xl font-bold m-0" style={{ color: item.color }}>
                      ${item.value?.toLocaleString('es-CO') ?? '0'}
                    </p>
                  </div>
                ))}
              </div>

              {/* productos */}
              <div>
                <p className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-3">
                  <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
                  Productos
                </p>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Producto', 'Cantidad', 'Precio unit.', 'Subtotal'].map(h => (
                          <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalleVenta.detalle?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                            Sin productos registrados
                          </td>
                        </tr>
                      ) : detalleVenta.detalle?.map((d, i) => (
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-700 font-medium">{d.nombre_producto}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{d.cantidad}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">${d.precio_unitario?.toLocaleString('es-CO')}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">${d.subtotal?.toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* abonos */}
              <div>
                <p className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-3">
                  <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
                  Historial de abonos
                </p>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Fecha', 'Monto', 'Medio de pago', 'Observación'].map(h => (
                          <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalleVenta.abonos?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                            Sin abonos registrados
                          </td>
                        </tr>
                      ) : detalleVenta.abonos?.map((a) => (
                        <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500">{a.fecha}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">${a.monto?.toLocaleString('es-CO')}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-3.5 py-1.5 rounded-full font-medium"
                              style={{
                                background: a.medio_pago === 'efectivo' ? '#f0fdf4' : '#eff6ff',
                                color: a.medio_pago === 'efectivo' ? '#15803d' : '#1d4ed8'
                              }}
                            >
                              {a.medio_pago}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{a.observacion ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span
                  className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full font-medium border"
                  style={{
                    background: ESTADOS_CONFIG[detalleVenta.estado]?.bg,
                    color: ESTADOS_CONFIG[detalleVenta.estado]?.color,
                    borderColor: ESTADOS_CONFIG[detalleVenta.estado]?.border,
                  }}
                >
                  {ESTADOS_CONFIG[detalleVenta.estado]?.icon}
                  {ESTADOS_CONFIG[detalleVenta.estado]?.label}
                </span>
                <span className="text-sm text-slate-400">
                  Entrega: {detalleVenta.fecha_entrega}
                </span>
              </div>
              <button
                onClick={() => setDetalleVenta(null)}
                className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all"
                style={{ cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}