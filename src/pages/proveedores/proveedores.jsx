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

 const handleChange = (e) => {
  const { name, value } = e.target
  
  // Validaciones solo para el campo "nombre"
  if (name === 'nombre') {
    // Si el valor son solo números, no actualizar
    const soloNumeros = /^\d+$/
    if (value.length > 0 && soloNumeros.test(value)) {
      return // No permite escribir si todo son números
    }
    
    // Limitar a 30 caracteres
    const valorLimitado = value.slice(0, 30)
    
    setForm(prev => ({ ...prev, [name]: valorLimitado }))
    setErrForm(null)
    return
  }
   // Validaciones para el campo "contacto" (persona de contacto)
  if (name === 'contacto') {
    // No permitir números
    const valorSinNumeros = value.replace(/[0-9]/g, '')
    
    // Limitar a 30 caracteres
    const valorLimitado = valorSinNumeros.slice(0, 30)
    
    setForm(prev => ({ ...prev, [name]: valorLimitado }))
    setErrForm(null)
    return
  }
  
  // Para los demás campos (teléfono, dirección, email)
  setForm(prev => ({ ...prev, [name]: value }))
  setErrForm(null)
}

  
const handleGuardar = async () => {
  const nombre = form.nombre?.trim()
  
  // Validación 1: Campo obligatorio
  if (!nombre) { 
    setErrForm('El nombre del proveedor es obligatorio.') 
    return 
  }
  
  // Validación 2: Mínimo 3 caracteres
  if (nombre.length < 3) {
    setErrForm('El nombre debe tener al menos 3 caracteres.')
    return
  }
  
  // Validación 3: Debe contener al menos una letra
  const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(nombre)
  if (!tieneLetras) {
    setErrForm('El nombre debe contener al menos una letra, no solo números.')
    return
  }
  
  // Validación 4: Máximo 30 caracteres
  if (nombre.length > 30) {
    setErrForm('El nombre no puede exceder los 30 caracteres.')
    return
  }
  
  setGuardando(true)
  setErrForm(null)
  try {
    await onGuardar({ ...form, nombre, activo: proveedor ? proveedor.activo : 1 })
    onClose()
  } catch (err) {
    setErrForm(err.response?.data?.mensaje || 'Error al guardar proveedor.')
  } finally { 
    setGuardando(false) 
  }
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
    <div className="p-4" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="modal-inner" style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', overflow: 'hidden', fontFamily: "'Montserrat','Poppins',sans-serif" }}>

        {/* Header */}
        <div className="modal-header pt-6 pr-7 pb-5 pl-7" style={{ borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#5842ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(88,66,255,0.25)', flexShrink: 0 }}>
              <Truck size={20} color="white" />
            </div>
            <div>
              <p className="m-0" style={{ fontWeight: 700, fontSize: '17px', color: '#0f172a' }}>{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</p>
              <p className="mt-0.5 mr-0 mb-0 ml-0" style={{ fontSize: '13px', color: '#94a3b8' }}>{proveedor ? 'Modifica los datos del proveedor' : 'Completa la información'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={15} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body py-6 px-7" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {campos.map(({ name, label, req, Icon, placeholder, type }) => (
            <div key={name}>
              <label className="mb-1.5" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}{req && <span className="ml-0.5" style={{ color: '#f43f5e' }}>*</span>}
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
            <div className="py-3 px-3.5" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '10px' }}>
              <AlertTriangle size={15} color="#f43f5e" className="mt-0" style={{ flexShrink: 0 }} />
              <p className="m-0" style={{ fontSize: '13px', color: '#e11d48' }}>{errForm}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer modal-footer-wrap pt-4 pr-7 pb-6 pl-7" style={{ borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="p-2.5" style={{ flex: 1, borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando}
            className="p-2.5" style={{ flex: 1, borderRadius: '10px', border: 'none', background: guardando ? '#a5b4fc' : '#5842ff', color: 'white', fontSize: '14px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
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
    <div className="p-4" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="py-9 px-7" style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', textAlign: 'center', fontFamily: "'Montserrat','Poppins',sans-serif" }}>
        <div className="mt-0 mr-auto mb-5 ml-auto" style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#fff1f2', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={26} color="#f43f5e" />
        </div>
        <p className="mt-0 mr-0 mb-2 ml-0" style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>¿Desactivar proveedor?</p>
        <p className="mt-0 mr-0 mb-7 ml-0" style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          El proveedor <strong style={{ color: '#0f172a' }}>{proveedor?.nombre}</strong> pasará a estado inactivo para no afectar el historial de compras.
        </p>
        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="p-2.5" style={{ flex: 1, borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={eliminando}
            className="p-2.5" style={{ flex: 1, borderRadius: '10px', border: 'none', background: eliminando ? '#fda4af' : '#f43f5e', color: 'white', fontSize: '14px', fontWeight: 600, cursor: eliminando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
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
    <div className="p-4" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="py-9 px-7" style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', textAlign: 'center', fontFamily: "'Montserrat','Poppins',sans-serif" }}>
        <div className="mt-0 mr-auto mb-5 ml-auto" style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={26} color="#10b981" />
        </div>
        <p className="mt-0 mr-0 mb-2 ml-0" style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>¿Reactivar proveedor?</p>
        <p className="mt-0 mr-0 mb-7 ml-0" style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
          El proveedor <strong style={{ color: '#0f172a' }}>{proveedor?.nombre}</strong> volverá a estar disponible para realizar operaciones.
        </p>
        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="p-2.5" style={{ flex: 1, borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={activando}
            className="p-2.5" style={{ flex: 1, borderRadius: '10px', border: 'none', background: activando ? '#6ee7b7' : '#10b981', color: 'white', fontSize: '14px', fontWeight: 600, cursor: activando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
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
    <div className="page-container py-10 px-12" style={{ flex: 1, background: '#fafbfc', minHeight: '100vh', fontFamily: "'Montserrat','Poppins',sans-serif" }}>
      <style>{responsiveStyles}</style>

      {/* ═══ HEADER ═══ */}
      <div className="header-container mb-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="m-0" style={{ fontSize: '24px', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            GESTIÓN DE PROVEEDORES
          </h1>
        </div>
        <button className="header-btn py-3 px-5" onClick={abrirCrear}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#5842ff', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
          <div key={i} className="py-5 px-6" style={{ background: '#1a1b26', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: `1.5px solid ${card.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="m-0" style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>{card.value}</p>
              <p className="mt-1 mr-0 mb-0 ml-0" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ TABLA / CARDS ═══ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>

        {/* Barra de herramientas */}
        <div className="toolbar-container py-4 px-6" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, email, contacto..."
              className="pt-2.5 pr-4 pb-2.5 pl-11" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#ffffff', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.border = '1px solid #5842ff'}
              onBlur={e => e.target.style.border = '1px solid #e2e8f0'} />
          </div>
          <button className="py-2.5 px-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        {/* ── TABLA (desktop) ── */}
        <div className="table-desktop" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#fafbfc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'PROVEEDOR', 'CONTACTO', 'TELÉFONO', 'EMAIL / DIRECCIÓN', 'ACCIONES'].map(h => (
                  <th key={h} className="py-3.5 px-6" style={{ textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr><td colSpan={6} className="py-14 px-0" style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay resultados.</td></tr>
              ) : lista.map((p, index) => {
                const inactivo = esInactivo(p)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: inactivo ? '#f8fafc' : '#ffffff', opacity: inactivo ? 0.75 : 1 }}>
                    <td className="py-4 px-6" style={{ fontSize: '14px', fontWeight: 600, color: inactivo ? '#94a3b8' : '#5842ff' }}>
                      #{String(p.id || index + 1).padStart(3, '0')}
                    </td>
                    <td className="py-4 px-6" style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {p.nombre}
                        {inactivo && <span className="py-0.5 px-2" style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #fecaca' }}>INACTIVO</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6" style={{ fontSize: '14px', color: '#475569' }}>{p.contacto || '—'}</td>
                    <td className="py-4 px-6" style={{ fontSize: '14px', color: '#475569' }}>{p.telefono || '—'}</td>
                    <td className="py-4 px-6">
                      {p.email && <div className="mb-0.5" style={{ fontSize: '13px', color: '#475569' }}>{p.email}</div>}
                      {p.direccion && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.direccion}</div>}
                      {!p.email && !p.direccion && <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <button title="Detalles" className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <Info size={18} color="#5842ff" />
                        </button>
                        {!inactivo ? (
                          <>
                            <button onClick={() => abrirEditar(p)} title="Editar" className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                              <Pencil size={18} color="#f59e0b" />
                            </button>
                            <button title="Validar" className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                              <CheckCircle2 size={18} color="#10b981" />
                            </button>
                            <button onClick={() => setProveedorEliminar(p)} title="Desactivar" className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={18} color="#ef4444" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setProveedorReactivar(p)} title="Reactivar" className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
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
        <div className="cards-mobile pt-2 pr-0 pb-4 pl-0">
          {lista.length === 0 ? (
            <p className="py-10 px-0" style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay resultados.</p>
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
                      <span className="py-0.5 px-1.5" style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #fecaca' }}>INACTIVO</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <button className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Info size={16} color="#5842ff" />
                    </button>
                    {!inactivo ? (
                      <>
                        <button onClick={() => abrirEditar(p)} className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <Pencil size={16} color="#f59e0b" />
                        </button>
                        <button className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <CheckCircle2 size={16} color="#10b981" />
                        </button>
                        <button onClick={() => setProveedorEliminar(p)} className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setProveedorReactivar(p)} className="p-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <RefreshCw size={16} color="#10b981" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Nombre */}
                <div className="mb-2.5">
                  <p className="m-0" style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{p.nombre}</p>
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
                  <div className="card-row mb-0">
                    <span className="card-label">Dirección</span>
                    <span className="card-value" style={{ fontSize: '12px', color: '#94a3b8' }}>{p.direccion}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pie tabla */}
        <div className="table-footer py-4 px-6" style={{ display: 'flex', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
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