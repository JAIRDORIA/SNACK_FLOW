import { useState, useEffect } from 'react'
import {
  Search, AlertTriangle, Package,
  TrendingDown, CheckCircle, Layers,
  Pencil, X, Check, RefreshCw
} from 'lucide-react'
import useInventarioStore from '@/store/useInventarioStore'
import { putInventario } from '@/api/inventario_api'

// ══════════════════════════════════════════
// MODAL EDITAR STOCK MÍNIMO
// ══════════════════════════════════════════
function ModalEditarStockMinimo({ item, onCerrar, onGuardado }) {
  const [valor, setValor]       = useState(String(item.stock_minimo))
  const [error, setError]       = useState('')
  const [guardando, setGuardando] = useState(false)

  const submit = async e => {
    e.preventDefault()
    const num = parseInt(valor)
    if (isNaN(num) || num < 0) { setError('Ingresa un número mayor o igual a 0.'); return }
    if (num === item.stock_minimo) { setError('El valor es igual al actual.'); return }
    setGuardando(true)
    try {
      await putInventario(item.id, { stock_minimo: num })
      onGuardado()
      onCerrar()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar.')
    } finally { setGuardando(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div style={{
        background: 'white', borderRadius: '20px',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden', animation: 'popIn 0.2s ease'
      }}>
        <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }`}</style>

        {/* header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={16} color="#4f46e5" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Editar stock mínimo</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.nombre_producto}</p>
            </div>
          </div>
          <button onClick={onCerrar} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="#64748b" />
          </button>
        </div>

        {/* body */}
        <form onSubmit={submit} style={{ padding: '24px' }}>
          <div style={{
            background: '#f8fafc', borderRadius: '12px',
            padding: '16px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Stock actual</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{item.stock_actual}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Stock mínimo actual</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#4f46e5' }}>{item.stock_minimo}</p>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Nuevo stock mínimo
          </label>
          <input
            type="number" min="0" value={valor}
            onChange={e => { setValor(e.target.value); setError('') }}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: '10px', padding: '12px 14px',
              fontSize: '15px', fontWeight: 600, outline: 'none',
              fontFamily: 'inherit', color: '#0f172a',
              transition: 'border 0.15s', marginBottom: '12px'
            }}
            onFocus={e => { if (!error) e.target.style.borderColor = '#4f46e5' }}
            onBlur={e  => { if (!error) e.target.style.borderColor = '#e2e8f0' }}
            autoFocus
          />

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onCerrar} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={{ flex: 1, background: guardando ? 'rgba(79,70,229,0.5)' : '#4f46e5', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', color: 'white', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════
export default function Inventario() {
  const {
    inventario, total, pagina, total_paginas,
    bajoStock, cargando, error,
    fetchInventario, fetchBajoStock
  } = useInventarioStore()

  const [busqueda, setBusqueda]     = useState('')
  const [editando, setEditando]     = useState(null) // item a editar

  useEffect(() => {
    fetchInventario()
    fetchBajoStock()
  }, [])

  const cargar = (p = 1) => {
    fetchInventario(p)
    fetchBajoStock()
  }

  // filtrar por búsqueda
  const lista = inventario.filter(i => {
    const q = busqueda.toLowerCase()
    return (
      String(i.id).includes(q) ||
      i.nombre_producto?.toLowerCase().includes(q)
    )
  })

  // stats
  const totalProductos  = total
  const bajoStockCount  = bajoStock.length
  const stockOk         = inventario.filter(i => i.stock_actual > i.stock_minimo).length
  const sinStock        = inventario.filter(i => i.stock_actual === 0).length

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Cargando inventario...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 max-w-2xl">
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <div>
        <p className="text-red-700 font-semibold text-sm mb-1">Error al cargar inventario</p>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px' }} className="flex-1 bg-gray-50">

      {/* ── título ── */}
      <div style={{ marginBottom: '32px' }} className="flex items-center justify-between">
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Gestión de Inventario
        </h1>
        <button
          onClick={() => cargar(pagina)}
          className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
          style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ marginBottom: '30px' }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* total productos */}
        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '20px 0 20px 20px' }} className="bg-[#13152280] ring-2 ring-indigo-500/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <Layers size={22} color="#818cf8" />
          </div>
          <div>
            <p className="text-3xl text-white">{totalProductos}</p>
            <p className="text-xs text-white/50 mt-0.5">Total productos</p>
          </div>
        </div>

        {/* stock ok */}
        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '20px 0 20px 20px' }} className="bg-[#13152280] ring-2 ring-emerald-400/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle size={22} color="#34d399" />
          </div>
          <div>
            <p className="text-3xl text-white">{stockOk}</p>
            <p className="text-xs text-white/50 mt-0.5">Stock OK</p>
          </div>
        </div>

        {/* bajo stock */}
        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '20px 0 20px 20px' }} className="bg-[#13152280] ring-2 ring-amber-400/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <TrendingDown size={22} color="#fbbf24" />
          </div>
          <div>
            <p className="text-3xl text-white">{bajoStockCount}</p>
            <p className="text-xs text-white/50 mt-0.5">Bajo stock</p>
          </div>
        </div>

        {/* sin stock */}
        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '20px 0 20px 20px' }} className="bg-[#13152280] ring-2 ring-red-400/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <Package size={22} color="#f87171" />
          </div>
          <div>
            <p className="text-3xl text-white">{sinStock}</p>
            <p className="text-xs text-white/50 mt-0.5">Sin stock</p>
          </div>
        </div>

      </div>

      {/* ── alerta bajo stock ── */}
      {bajoStock.length > 0 && (
        <div style={{ marginBottom: '24px', padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#92400e', fontSize: '13px' }}>
              {bajoStock.length} producto{bajoStock.length > 1 ? 's' : ''} bajo el stock mínimo
            </p>
            <p style={{ margin: 0, color: '#b45309', fontSize: '12px' }}>
              {bajoStock.map(b => b.nombre).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── tabla ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible">

        {/* barra búsqueda */}
        <div className="border-b border-slate-100 flex gap-4 items-center flex-wrap" style={{ padding: '12px' }}>
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <input
              type="text"
              placeholder="Buscar por ID o nombre de producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft: '48px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
              className="w-full border border-slate-200 rounded-xl text-sm outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* tabla */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                {['ID', 'Producto', 'Stock actual', 'Unidades sueltas', 'Stock mínimo', 'Estado', 'Acciones'].map((h, i) => (
                  <th key={h} style={{ padding: '4px 8px' }} className={`text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${i === 0 ? 'pl-8' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px 0' }} className="text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No se encontraron productos</p>
                    </div>
                  </td>
                </tr>
              ) : lista.map(item => {

                // determinar estado del stock
                const sinStock   = item.stock_actual === 0
                const bajStock   = item.stock_actual <= item.stock_minimo && item.stock_actual > 0
                const stockOkItem = item.stock_actual > item.stock_minimo

                const estadoCfg = sinStock
                  ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Sin stock' }
                  : bajStock
                  ? { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Bajo stock' }
                  : { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Disponible' }

                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <td style={{ padding: '4px 6px', paddingLeft: '32px' }}>
                      <span className="font-semibold text-sm text-indigo-600">
                        #{String(item.id).padStart(3, '0')}
                      </span>
                    </td>
                    <td style={{ padding: '4px 6px' }} className="text-slate-700 font-medium text-sm">
                      {item.nombre_producto}
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <span style={{
                        fontSize: '15px', fontWeight: 700,
                        color: sinStock ? '#dc2626' : bajStock ? '#b45309' : '#0f172a'
                      }}>
                        {item.stock_actual}
                      </span>
                    </td>
                    <td style={{ padding: '4px 6px' }} className="text-slate-500 text-sm">
                      {item.unidades_sueltas}
                    </td>
                    <td style={{ padding: '4px 6px' }} className="text-slate-500 text-sm">
                      {item.stock_minimo}
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border"
                        style={{ background: estadoCfg.bg, color: estadoCfg.color, borderColor: estadoCfg.border }}>
                        {estadoCfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <button
                        title="Editar stock mínimo"
                        onClick={() => setEditando(item)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-indigo-50"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        <Pencil size={15} color="#4f46e5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* pie tabla */}
        <div style={{ padding: '5px 8px' }} className="border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/30">
          <span className="text-sm">
            Mostrando <strong className="text-slate-700 font-semibold">{lista.length}</strong> de{' '}
            <strong className="text-slate-700 font-semibold">{total}</strong> productos
          </span>

          {total_paginas > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInventario(pagina - 1)}
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
                onClick={() => fetchInventario(pagina + 1)}
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

      {/* modal editar */}
      {editando && (
        <ModalEditarStockMinimo
          item={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => cargar(pagina)}
        />
      )}

    </div>
  )
}
