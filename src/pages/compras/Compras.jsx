import { useState, useRef, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, X,
  AlertTriangle, ShoppingBag, DollarSign,
  Calendar, Truck, SlidersHorizontal, ChevronDown,
  TrendingDown, BarChart3, CheckCircle2, FileText, Info
} from 'lucide-react'
import useComprasStore from '@/store/useComprasStore'
import useProveedoresStore from '@/store/useProveedoresStore'
import useDashboardStore from '@/store/useDashboardStore'

// ── ESTILOS RESPONSIVE ──
const responsiveStyles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── KPI grid ── */
  .grid-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }

  /* ── Tabla oculta en móvil, cards visibles ── */
  .table-desktop { display: block; }
  .cards-mobile  { display: none; }

  @media (max-width: 1024px) {
    .grid-kpi { grid-template-columns: repeat(2, 1fr) !important; }
  }

  @media (max-width: 768px) {
    .page-container        { padding: 20px 16px !important; }
    .header-container      { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
    .header-container h1   { font-size: 19px !important; }
    .header-btn            { width: 100% !important; justify-content: center !important; }
    .grid-kpi              { grid-template-columns: repeat(2, 1fr) !important; }
    .toolbar-container     { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
    .search-box            { width: 100% !important; }
    .toolbar-container select,
    .toolbar-container button { width: 100% !important; box-sizing: border-box !important; }
    .modal-footer          { flex-direction: column-reverse !important; }
    .table-desktop         { display: none !important; }
    .cards-mobile          { display: block !important; }
    .form-grid             { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 480px) {
    .page-container  { padding: 14px 10px !important; }
    .grid-kpi        { grid-template-columns: 1fr !important; }
    .modal-inner     { padding: 20px 16px !important; max-height: 92vh; overflow-y: auto; }
    .modal-header    { padding: 18px 18px 14px !important; }
    .modal-body      { padding: 18px 18px !important; }
    .modal-footer-wrap { padding: 12px 18px 18px !important; }
  }

  /* ── Mobile cards ── */
  .compra-card {
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 16px;
    margin: 0 16px 10px;
    background: #fff;
  }
  .compra-card:last-child { margin-bottom: 0; }
  .card-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .card-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .card-value { font-size: 13px; color: #0f172a; font-weight: 500; text-align: right; max-width: 60%; }
`

// ══════════════════════════════════════════
// MODAL COMPRA
// ══════════════════════════════════════════
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

  const inputBase = {
    width: '100%', boxSizing: 'border-box', padding: '11px 16px 11px 40px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px',
    color: '#0f172a', background: '#fafafa', outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit'
  }
  const focusIn  = (e) => { e.target.style.border = '1.5px solid #5842ff'; e.target.style.background = '#ffffff' }
  const focusOut = (e) => { e.target.style.border = '1.5px solid #e2e8f0'; e.target.style.background = '#fafafa' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div className="modal-inner" style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', overflow: 'hidden', fontFamily: "'Montserrat','Poppins',sans-serif" }}>

        {/* Header */}
        <div className="modal-header" style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(88,66,255,0.08)', border: '1px solid rgba(88,66,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag size={20} color="#5842ff" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '17px', color: '#0f172a' }}>
                {compra ? 'Editar Compra' : 'Nueva Compra'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                {compra ? 'Modifica los datos de la compra' : 'Registra una nueva adquisición'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={15} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Proveedor */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Proveedor <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Truck size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <ChevronDown size={14} color="#cbd5e1" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select name="id_proveedor" value={form.id_proveedor} onChange={handleChange}
                style={{ ...inputBase, appearance: 'none', cursor: 'pointer', paddingRight: '36px' }}
                onFocus={focusIn} onBlur={focusOut}>
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(p => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Descripción / Insumos
            </label>
            <div style={{ position: 'relative' }}>
              <FileText size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '14px', pointerEvents: 'none' }} />
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                placeholder="¿Qué se compró? Ej: Insumos, empaques..." rows={2}
                style={{ ...inputBase, resize: 'none', lineHeight: '1.5' }}
                onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>

          {/* Costo + Fecha */}
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Costo Total <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="number" name="costo_total" value={form.costo_total} onChange={handleChange}
                  placeholder="0" min="0" style={inputBase} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Fecha de Compra
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={15} color="#cbd5e1" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="date" name="fecha_compra" value={form.fecha_compra} onChange={handleChange}
                  style={inputBase} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px' }}>
            <Info size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>La compra se asociará al corte activo automáticamente.</p>
          </div>

          {errForm && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '10px' }}>
              <AlertTriangle size={15} color="#f43f5e" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#e11d48' }}>{errForm}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer modal-footer-wrap" style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: guardando ? '#a5b4fc' : '#5842ff', color: 'white', fontSize: '14px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            <CheckCircle2 size={15} />
            {guardando ? 'Guardando...' : compra ? 'Guardar Cambios' : 'Crear Compra'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MODAL ELIMINAR
// ══════════════════════════════════════════
function ModalEliminar({ compra, onClose, onConfirmar }) {
  const [eliminando, setEliminando] = useState(false)
  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

  const handleConfirmar = async () => {
    setEliminando(true)
    try { await onConfirmar(); onClose() }
    finally { setEliminando(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', padding: '36px 28px', textAlign: 'center', fontFamily: "'Montserrat','Poppins',sans-serif" }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#fff1f2', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trash2 size={26} color="#f43f5e" />
        </div>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>¿Eliminar compra?</p>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          Compra de <strong style={{ color: '#0f172a' }}>{compra?.nombre_proveedor || 'este proveedor'}</strong> por{' '}
          <strong style={{ color: '#e11d48' }}>{fmt(compra?.costo_total || 0)}</strong>. Esta acción no se puede deshacer.
        </p>
        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleConfirmar} disabled={eliminando}
            style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: eliminando ? '#fda4af' : '#f43f5e', color: 'white', fontSize: '14px', fontWeight: 600, cursor: eliminando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════
export default function Compras() {
  const {
    compras, cargando, error,
    fetchCompras, crearCompra, editarCompra, eliminarCompra,
    corteIdFiltro, cortes, fetchCortes
  } = useComprasStore()
  const { proveedores, fetchProveedores } = useProveedoresStore()
  const { balance } = useDashboardStore()

  const [busqueda,        setBusqueda]        = useState('')
  const [modalFormOpen,   setModalFormOpen]   = useState(false)
  const [compraEditar,    setCompraEditar]    = useState(null)
  const [compraEliminar,  setCompraEliminar]  = useState(null)
  const [panelFiltro,     setPanelFiltro]     = useState(false)
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const filtroRef = useRef(null)

  useEffect(() => {
    fetchProveedores()
    fetchCortes()
  }, [])

  useEffect(() => {
    if (balance?.corte_id) fetchCompras(1, 20, balance.corte_id)
    else fetchCompras()
  }, [balance])

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
  const promedio     = lista.length ? totalCompras / lista.length : 0
  const nFiltros     = filtroProveedor ? 1 : 0

  const abrirCrear    = () => { setCompraEditar(null); setModalFormOpen(true) }
  const abrirEditar   = (c) => { setCompraEditar(c); setModalFormOpen(true) }
  const cerrarForm    = () => { setModalFormOpen(false); setCompraEditar(null) }
  const handleGuardar = async (data) => {
    if (compraEditar) await editarCompra(compraEditar.id_compra, data)
    else await crearCompra(data)
  }

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #5842ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div className="page-container" style={{ padding: '40px 48px', flex: 1, background: '#fafbfc', minHeight: '100vh', fontFamily: "'Montserrat','Poppins',sans-serif" }}>
      <style>{responsiveStyles}</style>

      {/* ═══ HEADER ═══ */}
      <div className="header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            GESTIÓN DE COMPRAS
          </h1>
        </div>
        <button className="header-btn" onClick={abrirCrear}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#5842ff', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          <Plus size={18} />
          Nueva Compra
        </button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid-kpi">
        {[
          { icon: <ShoppingBag size={20} color="#8b5cf6" />, borderColor: '#8b5cf6', value: lista.length,  label: 'Total Compras',     isMoney: false },
          { icon: <TrendingDown size={20} color="#f43f5e" />, borderColor: '#f43f5e', value: totalCompras, label: 'Total Egresado',    isMoney: true  },
          { icon: <BarChart3 size={20} color="#f59e0b" />,    borderColor: '#f59e0b', value: promedio,     label: 'Promedio x Compra', isMoney: true  },
        ].map((card, i) => (
          <div key={i} style={{ background: '#1a1b26', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: `1.5px solid ${card.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {card.isMoney ? fmt(card.value) : card.value}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ TABLA / CARDS ═══ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>

        {/* Barra de herramientas */}
        <div className="toolbar-container" style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar proveedor, descripción..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 16px 10px 44px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#ffffff', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.border = '1px solid #5842ff'}
              onBlur={e => e.target.style.border = '1px solid #e2e8f0'}
            />
          </div>

          <div ref={filtroRef} style={{ position: 'relative' }}>
            <button onClick={() => setPanelFiltro(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: nFiltros > 0 ? '1px solid #5842ff' : '1px solid #e2e8f0', background: '#ffffff', color: nFiltros > 0 ? '#5842ff' : '#475569', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px', width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}>
              <SlidersHorizontal size={16} />
              Filtros
              {nFiltros > 0 && <span style={{ background: '#5842ff', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{nFiltros}</span>}
              <ChevronDown size={14} style={{ transform: panelFiltro ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }} />
            </button>

            {panelFiltro && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', minWidth: '240px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 40 }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proveedor</p>
                <select value={filtroProveedor} onChange={e => setFiltroProveedor(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <option value="">Todos los proveedores</option>
                  {proveedores.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
                </select>
                {nFiltros > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <button onClick={() => { setFiltroProveedor(''); setPanelFiltro(false) }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <select value={corteIdFiltro ?? ''} onChange={e => fetchCompras(1, 20, e.target.value ? Number(e.target.value) : null)}
            style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: 500, cursor: 'pointer', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
            <option value="">Corte actual</option>
            {cortes.filter(c => c.estado === 'cerrado').map(c => (
              <option key={c.id} value={c.id}>Corte #{c.numero} — {c.fecha_inicio?.slice(0, 10)}</option>
            ))}
          </select>
        </div>

        {/* ── TABLA (desktop) ── */}
        <div className="table-desktop" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#fafbfc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'PROVEEDOR', 'DESCRIPCIÓN', 'COSTO TOTAL', 'FECHA', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No se encontraron compras en este periodo.
                  </td>
                </tr>
              ) : lista.map((c, idx) => (
                <tr key={c.id_compra} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#5842ff' }}>
                    #{String(c.id_compra || idx + 1).padStart(3, '0')}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827', fontWeight: 600 }}>
                    {c.nombre_proveedor || '—'}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                    {c.descripcion || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {fmt(c.costo_total || 0)}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                    {fmtFecha(c.fecha_compra)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <button onClick={() => abrirEditar(c)} title="Editar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Pencil size={18} color="#f59e0b" />
                      </button>
                      <button onClick={() => setCompraEliminar(c)} title="Eliminar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Trash2 size={18} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── CARDS (móvil) ── */}
        <div className="cards-mobile" style={{ padding: '8px 0 16px' }}>
          {lista.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', padding: '40px 0' }}>
              No se encontraron compras en este periodo.
            </p>
          ) : lista.map((c, idx) => (
            <div key={c.id_compra} className="compra-card">
              <div className="card-row">
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#5842ff' }}>#{String(c.id_compra || idx + 1).padStart(3, '0')}</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => abrirEditar(c)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Pencil size={16} color="#f59e0b" />
                  </button>
                  <button onClick={() => setCompraEliminar(c)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>
              </div>
              <div className="card-row">
                <span className="card-label">Proveedor</span>
                <span className="card-value" style={{ fontWeight: 600, color: '#111827' }}>{c.nombre_proveedor || '—'}</span>
              </div>
              {c.descripcion && (
                <div className="card-row">
                  <span className="card-label">Descripción</span>
                  <span className="card-value">{c.descripcion}</span>
                </div>
              )}
              <div className="card-row" style={{ marginBottom: 0 }}>
                <span className="card-label">Costo</span>
                <span className="card-value" style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{fmt(c.costo_total || 0)}</span>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#94a3b8' }}>
                {fmtFecha(c.fecha_compra)}
              </div>
            </div>
          ))}
        </div>

        {/* Pie tabla */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
            Mostrando <strong style={{ color: '#111827' }}>{lista.length}</strong> de <strong style={{ color: '#111827' }}>{compras.length}</strong> registros
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
            Total: <span style={{ color: '#f43f5e', fontWeight: 700, marginLeft: '4px' }}>{fmt(totalCompras)}</span>
          </span>
        </div>
      </div>

      {/* ═══ MODALES ═══ */}
      {modalFormOpen && <ModalCompra compra={compraEditar} proveedores={proveedores} onClose={cerrarForm} onGuardar={handleGuardar} />}
      {compraEliminar && <ModalEliminar compra={compraEliminar} onClose={() => setCompraEliminar(null)} onConfirmar={() => eliminarCompra(compraEliminar.id_compra)} />}
    </div>
  )
}