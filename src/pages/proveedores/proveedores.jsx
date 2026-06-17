import { useState, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, X,
  AlertTriangle, Truck, Mail, MapPin, Phone, User, CheckCircle2,
  Building2, SlidersHorizontal, Info, ShieldAlert,
  RefreshCw
} from 'lucide-react'
import useProveedoresStore from '@/store/useProveedoresStore'

// ── ESTILOS RESPONSIVE ──
const responsiveStyles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── KPI grid ── */
  .grid-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }

  /* ── Tabla / cards ── */
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
    .toolbar-container     { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
    .search-box            { width: 100% !important; }
    .toolbar-container button { width: 100% !important; box-sizing: border-box !important; justify-content: center !important; }
    .modal-footer          { flex-direction: column-reverse !important; }
    .table-footer          { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
    .table-desktop         { display: none !important; }
    .cards-mobile          { display: block !important; }
  }

  @media (max-width: 480px) {
    .page-container  { padding: 14px 10px !important; }
    .grid-kpi        { grid-template-columns: repeat(2, 1fr) !important; }
    .modal-inner     { max-height: 92vh; overflow-y: auto; }
    .modal-header    { padding: 18px 18px 14px !important; }
    .modal-body      { padding: 18px 18px !important; }
    .modal-footer-wrap { padding: 12px 18px 18px !important; }
  }

  /* ── Mobile cards ── */
  .proveedor-card {
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 16px;
    margin: 0 16px 10px;
    background: #fff;
  }
  .proveedor-card.inactivo { background: #f8fafc; opacity: 0.8; }
  .card-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .card-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }
  .card-value { font-size: 13px; color: #475569; font-weight: 500; text-align: right; max-width: 65%; word-break: break-word; }
`

// ══════════════════════════════════════════
// MODAL PROVEEDOR
// ══════════════════════════════════════════
function ModalProveedor({ proveedor, onClose, onGuardar }) {
  const [form, setForm] = useState({
    nombre:    proveedor?.nombre    || '',
    telefono:  proveedor?.telefono  || '',
    email:     proveedor?.email     || '',
    direccion: proveedor?.direccion || '',
    contacto:  proveedor?.contacto  || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [errForm,   setErrForm]   = useState(null)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { setErrForm('El nombre del proveedor es obligatorio.'); return }
    setGuardando(true); setErrForm(null)
    try {
      await onGuardar({ ...form, activo: proveedor ? proveedor.activo : 1 })
      onClose()
    } catch (err) {
      setErrForm(err.response?.data?.mensaje || 'Error al guardar proveedor.')
    } finally { setGuardando(false) }
  }

  const campos = [
    { name: 'nombre',    label: 'Nombre del proveedor', req: true,  Icon: Building2, placeholder: 'Ej: Distribuidora Norte S.A.', type: 'text'  },
    { name: 'contacto',  label: 'Persona de contacto',  req: false, Icon: User,      placeholder: 'Nombre completo del contacto', type: 'text'  },
    { name: 'telefono',  label: 'Teléfono',             req: false, Icon: Phone,     placeholder: '300 123 4567',                 type: 'tel'   },
    { name: 'email',     label: 'Correo electrónico',   req: false, Icon: Mail,      placeholder: 'correo@empresa.com',           type: 'email' },
    { name: 'direccion', label: 'Dirección',            req: false, Icon: MapPin,    placeholder: 'Calle, ciudad, departamento',  type: 'text'  },
  ]

  const inputBase = {
    width: '100%', boxSizing: 'border-box', paddingLeft: '40px', paddingRight: '14px',
    paddingTop: '11px', paddingBottom: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', color: '#0f172a', background: '#fafafa', outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit'
  }
  const focusIn  = (e) => { e.target.style.border = '1.5px solid #5842ff'; e.target.style.background = '#ffffff' }
  const focusOut = (e) => { e.target.style.border = '1.5px solid #e2e8f0'; e.target.style.background = '#fafafa' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div className="modal-inner" style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', overflow: 'hidden', fontFamily: "'Montserrat','Poppins',sans-serif" }}>

        {/* Header */}
        <div className="modal-header" style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#5842ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(88,66,255,0.25)', flexShrink: 0 }}>
              <Truck size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '17px', color: '#0f172a' }}>{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>{proveedor ? 'Modifica los datos del proveedor' : 'Completa la información'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={15} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {campos.map(({ name, label, req, Icon, placeholder, type }) => (
            <div key={name}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}{req && <span style={{ color: '#f43f5e', marginLeft: '3px' }}>*</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Icon size={15} color="#cbd5e1" />
                </div>
                <input name={name} type={type} value={form[name]} onChange={handleChange} placeholder={placeholder}
                  style={inputBase} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
          ))}
          {errForm && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '10px' }}>
              <AlertTriangle size={15} color="#f43f5e" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#e11d48' }}>{errForm}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer modal-footer-wrap" style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando}
            style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: guardando ? '#a5b4fc' : '#5842ff', color: 'white', fontSize: '14px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            <CheckCircle2 size={15} />{guardando ? 'Guardando...' : proveedor ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MODAL DESACTIVAR
// ══════════════════════════════════════════
function ModalEliminar({ proveedor, onClose, onConfirmar }) {
  const [eliminando, setEliminando] = useState(false)

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
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>¿Desactivar proveedor?</p>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          El proveedor <strong style={{ color: '#0f172a' }}>{proveedor?.nombre}</strong> pasará a estado inactivo para no afectar el historial de compras.
        </p>
        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={eliminando}
            style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: eliminando ? '#fda4af' : '#f43f5e', color: 'white', fontSize: '14px', fontWeight: 600, cursor: eliminando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {eliminando ? 'Desactivando...' : 'Sí, desactivar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MODAL REACTIVAR
// ══════════════════════════════════════════
function ModalReactivar({ proveedor, onClose, onConfirmar }) {
  const [activando, setActivando] = useState(false)

  const handleConfirmar = async () => {
    setActivando(true)
    try { await onConfirmar(proveedor); onClose() }
    finally { setActivando(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', padding: '36px 28px', textAlign: 'center', fontFamily: "'Montserrat','Poppins',sans-serif" }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <RefreshCw size={26} color="#10b981" />
        </div>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>¿Reactivar proveedor?</p>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          El proveedor <strong style={{ color: '#0f172a' }}>{proveedor?.nombre}</strong> volverá a estar disponible para realizar operaciones.
        </p>
        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={activando}
            style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: activando ? '#6ee7b7' : '#10b981', color: 'white', fontSize: '14px', fontWeight: 600, cursor: activando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {activando ? 'Activando...' : 'Sí, reactivar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════
export default function Proveedores() {
  const {
    proveedores, cargando, error,
    fetchProveedores, crearProveedor, editarProveedor, eliminarProveedor
  } = useProveedoresStore()

  const [busqueda,           setBusqueda]           = useState('')
  const [modalFormOpen,      setModalFormOpen]      = useState(false)
  const [proveedorEditar,    setProveedorEditar]    = useState(null)
  const [proveedorEliminar,  setProveedorEliminar]  = useState(null)
  const [proveedorReactivar, setProveedorReactivar] = useState(null)

  useEffect(() => { fetchProveedores() }, [])

  const esInactivo = (p) => {
    if (p.activo === undefined) return false
    const v = String(p.activo).toLowerCase()
    return v === '0' || v === 'false' || v === 'null'
  }

  const lista = proveedores.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.telefono?.includes(busqueda) ||
    p.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.contacto?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const inactivosCount = proveedores.filter(esInactivo).length

  const abrirCrear  = () => { setProveedorEditar(null); setModalFormOpen(true) }
  const abrirEditar = (p) => { setProveedorEditar(p);   setModalFormOpen(true) }
  const cerrarForm  = () => { setModalFormOpen(false);  setProveedorEditar(null) }

  const handleGuardar = async (data) => {
    if (proveedorEditar) await editarProveedor(proveedorEditar.id, data)
    else await crearProveedor(data)
  }

  const handleReactivar = async (p) => {
    await editarProveedor(p.id, { nombre: p.nombre || '', telefono: p.telefono || '', direccion: p.direccion || '', email: p.email || '', activo: 1 })
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
            GESTIÓN DE PROVEEDORES
          </h1>
        </div>
        <button className="header-btn" onClick={abrirCrear}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#5842ff', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={18} />Nuevo Proveedor
        </button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid-kpi">
        {[
          { label: 'Total Proveedores', value: proveedores.length,                     borderColor: '#f59e0b', icon: <Truck size={20} color="#f59e0b" /> },
          { label: 'Resultados',        value: lista.length,                             borderColor: '#8b5cf6', icon: <Search size={20} color="#8b5cf6" /> },
          { label: 'Con Email',         value: proveedores.filter(p => p.email).length,  borderColor: '#06b6d4', icon: <Mail size={20} color="#06b6d4" /> },
          { label: 'Inactivos',         value: inactivosCount,                           borderColor: '#f43f5e', icon: <ShieldAlert size={20} color="#f43f5e" /> },
        ].map((card, i) => (
          <div key={i} style={{ background: '#1a1b26', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: `1.5px solid ${card.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>{card.value}</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ TABLA / CARDS ═══ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>

        {/* Barra de herramientas */}
        <div className="toolbar-container" style={{ padding: '16px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, email, contacto..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 16px 10px 44px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#ffffff', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.border = '1px solid #5842ff'}
              onBlur={e => e.target.style.border = '1px solid #e2e8f0'} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        {/* ── TABLA (desktop) ── */}
        <div className="table-desktop" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#fafbfc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'PROVEEDOR', 'CONTACTO', 'TELÉFONO', 'EMAIL / DIRECCIÓN', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay resultados.</td></tr>
              ) : (
                lista.map((p, index) => {
                  const inactivo = esInactivo(p);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: inactivo ? '#f8fafc' : '#ffffff', opacity: inactivo ? 0.75 : 1 }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: inactivo ? '#94a3b8' : '#5842ff' }}>
                        #{String(p.id || index + 1).padStart(3, '0')}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.nombre}
                          {inactivo && <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #fecaca' }}>INACTIVO</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>{p.contacto || '—'}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>{p.telefono || '—'}</td>
                      <td style={{ padding: '16px 24px' }}>
                        {p.email && <div style={{ fontSize: '13px', color: '#475569', marginBottom: '2px' }}>{p.email}</div>}
                        {p.direccion && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.direccion}</div>}
                        {!p.email && !p.direccion && <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          
                          {/* BOTONES DE ACCIÓN */}
                          {!inactivo ? (
                            <>
                              <button onClick={() => abrirEditar(p)} title="Editar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <Pencil size={18} color="#f59e0b" />
                              </button>
                              <button onClick={() => setProveedorEliminar(p)} title="Desactivar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <Trash2 size={18} color="#ef4444" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => setProveedorReactivar(p)} title="Reactivar Proveedor" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                              <RefreshCw size={18} color="#10b981" />
                            </button>
                            <button onClick={() => setProveedorEliminar(p)} title="Desactivar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                              <Trash2 size={18} color="#ef4444" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setProveedorReactivar(p)} title="Reactivar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <RefreshCw size={18} color="#10b981" />
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

        {/* ── CARDS (móvil) ── */}
        <div className="cards-mobile" style={{ padding: '8px 0 16px' }}>
          {lista.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', padding: '40px 0' }}>No hay resultados.</p>
          ) : lista.map((p, index) => {
            const inactivo = esInactivo(p)
            return (
              <div key={p.id} className={`proveedor-card${inactivo ? ' inactivo' : ''}`}>
                {/* Top row: ID + acciones */}
                <div className="card-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: inactivo ? '#94a3b8' : '#5842ff' }}>
                      #{String(p.id || index + 1).padStart(3, '0')}
                    </span>
                    {inactivo && (
                      <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 7px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #fecaca' }}>INACTIVO</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Info size={16} color="#5842ff" />
                    </button>
                    {!inactivo ? (
                      <>
                        <button onClick={() => abrirEditar(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <Pencil size={16} color="#f59e0b" />
                        </button>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <CheckCircle2 size={16} color="#10b981" />
                        </button>
                        <button onClick={() => setProveedorEliminar(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setProveedorReactivar(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <RefreshCw size={16} color="#10b981" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Nombre */}
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>{p.nombre}</p>
                </div>

                {/* Detalles */}
                {p.contacto && (
                  <div className="card-row">
                    <span className="card-label">Contacto</span>
                    <span className="card-value">{p.contacto}</span>
                  </div>
                )}
                {p.telefono && (
                  <div className="card-row">
                    <span className="card-label">Teléfono</span>
                    <span className="card-value">{p.telefono}</span>
                  </div>
                )}
                {p.email && (
                  <div className="card-row">
                    <span className="card-label">Email</span>
                    <span className="card-value" style={{ fontSize: '12px' }}>{p.email}</span>
                  </div>
                )}
                {p.direccion && (
                  <div className="card-row" style={{ marginBottom: 0 }}>
                    <span className="card-label">Dirección</span>
                    <span className="card-value" style={{ fontSize: '12px', color: '#94a3b8' }}>{p.direccion}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pie tabla */}
        <div className="table-footer" style={{ padding: '16px 24px', display: 'flex', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
            Mostrando <strong style={{ color: '#111827' }}>{lista.length}</strong> de <strong style={{ color: '#111827' }}>{proveedores.length}</strong> proveedores
          </span>
        </div>
      </div>

      {/* ═══ MODALES ═══ */}
      {modalFormOpen && (
        <ModalProveedor proveedor={proveedorEditar} onClose={cerrarForm} onGuardar={handleGuardar} />
      )}
      {proveedorEliminar && (
        <ModalEliminar proveedor={proveedorEliminar} onClose={() => setProveedorEliminar(null)} onConfirmar={() => eliminarProveedor(proveedorEliminar.id)} />
      )}
      {proveedorReactivar && (
        <ModalReactivar proveedor={proveedorReactivar} onClose={() => setProveedorReactivar(null)} onConfirmar={handleReactivar} />
      )}
    </div>
  )
}