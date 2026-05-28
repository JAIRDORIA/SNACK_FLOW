import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, Pencil, Trash2, X,
  AlertTriangle, ShoppingBag, DollarSign,
  Calendar, Truck, SlidersHorizontal, ChevronDown
} from 'lucide-react'
import useComprasStore from '@/store/useComprasStore'
import useProveedoresStore from '@/store/useProveedoresStore'

function ModalCompra({ compra, proveedores, onClose, onGuardar }) {
  const [form, setForm] = useState({
    id_proveedor: compra?.id_proveedor || '',
    descripcion:  compra?.descripcion  || '',
    costo_total:  compra?.costo_total  || '',
    fecha_compra: compra?.fecha_compra
      ? compra.fecha_compra.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  })
  const [guardando, setGuardando] = useState(false)
  const [errForm,   setErrForm]   = useState(null)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.id_proveedor) { setErrForm('Selecciona un proveedor.'); return }
    if (!form.costo_total || isNaN(Number(form.costo_total)) || Number(form.costo_total) <= 0) {
      setErrForm('Ingresa un costo total válido.'); return
    }
    setGuardando(true); setErrForm(null)
    try {
      await onGuardar({ ...form, id_proveedor: Number(form.id_proveedor), costo_total: Number(form.costo_total) })
      onClose()
    } catch (err) {
      setErrForm(err.response?.data?.mensaje || 'Error al guardar la compra.')
    } finally { setGuardando(false) }
  }

  const inputStyle = { width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#1B1D2E', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            {compra ? 'Editar Compra' : 'Nueva Compra'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Proveedor *</label>
            <div style={{ position: 'relative' }}>
              <Truck size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
              <select name="id_proveedor" value={form.id_proveedor} onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: '36px', appearance: 'none' }}>
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descripción / Insumos</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
              placeholder="¿Qué se compró? Ej: Papas, aceite, sal..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }} />
          </div>

          <div>
            <label style={labelStyle}>Costo Total *</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
              <input type="number" name="costo_total" value={form.costo_total} onChange={handleChange}
                placeholder="0" min="0" style={{ ...inputStyle, paddingLeft: '36px' }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Fecha de Compra</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
              <input type="date" name="fecha_compra" value={form.fecha_compra} onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: '36px', colorScheme: 'dark' }} />
            </div>
          </div>
        </div>

        {errForm && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
            {errForm}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#4f46e5', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            {guardando ? 'Guardando...' : compra ? 'Actualizar' : 'Registrar Compra'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEliminar({ compra, onClose, onConfirmar }) {
  const [eliminando, setEliminando] = useState(false)
  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

  const handleConfirmar = async () => {
    setEliminando(true)
    try { await onConfirmar(); onClose() }
    finally { setEliminando(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#1B1D2E', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={28} color="#dc2626" />
          </div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>¿Eliminar compra?</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Compra de <strong style={{ color: 'white' }}>{compra?.nombre_proveedor || 'este proveedor'}</strong> por{' '}
            <strong style={{ color: '#34d399' }}>{fmt(compra?.costo_total || 0)}</strong>. El dinero retornará a la caja.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={eliminando} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#dc2626', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Compras() {
  const { compras, cargando, error, fetchCompras, crearCompra, editarCompra, eliminarCompra, corteIdFiltro, cortes, fetchCortes } = useComprasStore()
  const { proveedores, fetchProveedores } = useProveedoresStore()

  const [busqueda,        setBusqueda]        = useState('')
  const [modalFormOpen,   setModalFormOpen]   = useState(false)
  const [compraEditar,    setCompraEditar]    = useState(null)
  const [compraEliminar,  setCompraEliminar]  = useState(null)
  const [panelFiltro,     setPanelFiltro]     = useState(false)
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const filtroRef = useRef(null)

  useEffect(() => { fetchCompras(); fetchProveedores(); fetchCortes() }, [])

  useEffect(() => {
    const fn = (e) => { if (filtroRef.current && !filtroRef.current.contains(e.target)) setPanelFiltro(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const fmt      = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
  const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const lista = compras.filter(c => {
    const q      = busqueda.toLowerCase()
    const matchQ = c.nombre_proveedor?.toLowerCase().includes(q) || c.descripcion?.toLowerCase().includes(q) || String(c.costo_total).includes(q)
    const matchP = !filtroProveedor || c.id_proveedor === Number(filtroProveedor)
    return matchQ && matchP
  })

  const totalCompras = lista.reduce((acc, c) => acc + (c.costo_total || 0), 0)
  const nFiltros     = filtroProveedor ? 1 : 0

  const abrirCrear  = () => { setCompraEditar(null); setModalFormOpen(true) }
  const abrirEditar = (c) => { setCompraEditar(c); setModalFormOpen(true) }
  const cerrarForm  = () => { setModalFormOpen(false); setCompraEditar(null) }
  const handleGuardar = async (data) => {
    if (compraEditar) await editarCompra(compraEditar.id_compra, data)
    else await crearCompra(data)
  }

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Cargando compras...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 max-w-2xl">
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <div>
        <p className="text-red-700 font-semibold text-sm mb-1">Error al cargar compras</p>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px', flex: 1, background: '#f9fafb', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Gestión De Compras
        </h1>
        <button onClick={abrirCrear} style={{ padding: '8px 14px' }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95">
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nueva Compra</span>
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Compras',     value: lista.length,                                    color: '#4f46e5', isMoney: false },
          { label: 'Total Egresado',    value: totalCompras,                                    color: '#e879f9', isMoney: true  },
          { label: 'Promedio x Compra', value: lista.length ? totalCompras / lista.length : 0, color: '#fb923c', isMoney: true  },
        ].map((card, i) => (
          <div key={i} style={{ background: '#1B1D2E', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: card.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} color={card.color} />
            </div>
            <div>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
              <p style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: 0 }}>{card.isMoney ? fmt(card.value) : card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de búsqueda, filtros y selector de corte */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>

        {/* Buscador */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por proveedor, descripción..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filtros por proveedor */}
        <div ref={filtroRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setPanelFiltro(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${nFiltros > 0 ? '#4f46e5' : '#e5e7eb'}`, background: nFiltros > 0 ? '#eff6ff' : 'white', color: nFiltros > 0 ? '#4f46e5' : '#6b7280', cursor: 'pointer', fontSize: '14px' }}
          >
            <SlidersHorizontal size={15} />
            Filtros
            {nFiltros > 0 && (
              <span style={{ background: '#4f46e5', color: 'white', borderRadius: '9999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>
                {nFiltros}
              </span>
            )}
            <ChevronDown size={14} />
          </button>

          {panelFiltro && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 40, background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', minWidth: '240px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Proveedor</p>
              <select
                value={filtroProveedor}
                onChange={e => setFiltroProveedor(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map(p => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                ))}
              </select>
              {nFiltros > 0 && (
                <button
                  onClick={() => { setFiltroProveedor(''); setPanelFiltro(false) }}
                  style={{ marginTop: '12px', width: '100%', padding: '7px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontSize: '13px' }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selector de corte */}
        <select
          value={corteIdFiltro ?? ''}
          onChange={e => {
            const val = e.target.value ? Number(e.target.value) : null
            fetchCompras(1, 20, val)
          }}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">📂 Corte actual</option>
          {cortes
            .filter(c => c.estado === 'cerrado')
            .map(c => (
              <option key={c.id} value={c.id}>
                Corte #{c.numero} — {c.fecha_inicio?.slice(0, 10)}
              </option>
            ))
          }
        </select>

      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 120px', padding: '12px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          {['Proveedor', 'Descripción', 'Costo Total', 'Fecha', 'Acciones'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {lista.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <ShoppingBag size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              {busqueda || nFiltros > 0 ? 'Sin resultados.' : 'No hay compras registradas.'}
            </p>
          </div>
        ) : (
          lista.map((c, idx) => (
            <div
              key={c.id_compra}
              style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 120px', padding: '14px 20px', alignItems: 'center', borderBottom: idx < lista.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e879f922', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={16} color="#e879f9" />
                </div>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{c.nombre_proveedor || '—'}</span>
              </div>
              <span style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px' }}>
                {c.descripcion || <span style={{ color: '#d1d5db' }}>Sin descripción</span>}
              </span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{fmt(c.costo_total || 0)}</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{fmtFecha(c.fecha_compra)}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => abrirEditar(c)}
                  style={{ padding: '7px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.borderColor = '#c7d2fe' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setCompraEliminar(c)}
                  style={{ padding: '7px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer de la tabla */}
      {lista.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            {lista.length} {lista.length === 1 ? 'compra' : 'compras'}
          </p>
          <p style={{ fontSize: '13px', color: '#374151', margin: 0, fontWeight: 600 }}>
            Total egresado: <span style={{ color: '#dc2626' }}>{fmt(totalCompras)}</span>
          </p>
        </div>
      )}

      {/* Modales */}
      {modalFormOpen && (
        <ModalCompra
          compra={compraEditar}
          proveedores={proveedores}
          onClose={cerrarForm}
          onGuardar={handleGuardar}
        />
      )}
      {compraEliminar && (
        <ModalEliminar
          compra={compraEliminar}
          onClose={() => setCompraEliminar(null)}
          onConfirmar={() => eliminarCompra(compraEliminar.id_compra)}
        />
      )}
    </div>
  )
}