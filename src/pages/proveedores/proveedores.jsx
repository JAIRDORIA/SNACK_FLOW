import { useState, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, X,
  AlertTriangle, Truck, Mail, MapPin, Phone, User, CheckCircle2,
  Building2, SlidersHorizontal, Info, ShieldAlert,
  RefreshCw // <-- Nuevo ícono para reactivar
} from 'lucide-react'
import useProveedoresStore from '@/store/useProveedoresStore'

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
    setGuardando(true)
    setErrForm(null)
    try {
      // Nos aseguramos de enviar activo: 1 si es nuevo, o mantener el estado si se edita
      await onGuardar({ ...form, activo: proveedor ? proveedor.activo : 1 })
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', fontFamily: "'Montserrat', 'Poppins', sans-serif" }}>
        
        {/* Header Modal */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#5842ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(88,66,255,0.25)' }}>
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

        {/* Body Modal */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {campos.map(({ name, label, req, Icon, placeholder, type }) => (
            <div key={name}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}{req && <span style={{ color: '#f43f5e', marginLeft: '3px' }}>*</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Icon size={15} color="#cbd5e1" /></div>
                <input name={name} type={type} value={form[name]} onChange={handleChange} placeholder={placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '40px', paddingRight: '14px', paddingTop: '11px', paddingBottom: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', background: '#fafafa', outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}
                  onFocus={e => { e.target.style.border = '1.5px solid #5842ff'; e.target.style.background = '#ffffff' }}
                  onBlur={e => { e.target.style.border = '1.5px solid #e2e8f0'; e.target.style.background = '#fafafa' }}
                />
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

        {/* Footer Modal */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: guardando ? '#a5b4fc' : '#5842ff', color: 'white', fontSize: '14px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            <CheckCircle2 size={15} />{guardando ? 'Guardando...' : proveedor ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MODAL DESACTIVAR / ELIMINAR
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
      <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', padding: '36px 32px', textAlign: 'center', fontFamily: "'Montserrat', 'Poppins', sans-serif" }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#fff1f2', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trash2 size={26} color="#f43f5e" />
        </div>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>¿Desactivar proveedor?</p>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>El proveedor <strong style={{ color: '#0f172a' }}>{proveedor?.nombre}</strong> pasará a estado inactivo para no afectar el historial de compras.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={eliminando} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: eliminando ? '#fda4af' : '#f43f5e', color: 'white', fontSize: '14px', fontWeight: 600, cursor: eliminando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {eliminando ? 'Desactivando...' : 'Sí, desactivar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MODAL REACTIVAR (NUEVO)
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
      <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', padding: '36px 32px', textAlign: 'center', fontFamily: "'Montserrat', 'Poppins', sans-serif" }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <RefreshCw size={26} color="#10b981" />
        </div>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>¿Reactivar proveedor?</p>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>El proveedor <strong style={{ color: '#0f172a' }}>{proveedor?.nombre}</strong> volverá a estar disponible para realizar operaciones.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={activando} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: activando ? '#6ee7b7' : '#10b981', color: 'white', fontSize: '14px', fontWeight: 600, cursor: activando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
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
  const [busqueda,            setBusqueda]            = useState('')
  const [modalFormOpen,       setModalFormOpen]       = useState(false)
  const [proveedorEditar,     setProveedorEditar]     = useState(null)
  const [proveedorEliminar,   setProveedorEliminar]   = useState(null)
  const [proveedorReactivar,  setProveedorReactivar]  = useState(null) // <-- Nuevo estado

  useEffect(() => { fetchProveedores() }, [])

  // Versión "a prueba de balas" para detectar inactivos
  const esInactivo = (p) => {
    if (p.activo === undefined) return false;
    const valorActivo = String(p.activo).toLowerCase();
    return valorActivo === '0' || valorActivo === 'false' || valorActivo === 'null';
  }

  const lista = proveedores.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.telefono?.includes(busqueda) ||
    p.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.contacto?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const inactivosCount = proveedores.filter(esInactivo).length;

  const abrirCrear  = () => { setProveedorEditar(null); setModalFormOpen(true) }
  const abrirEditar = (p) => { setProveedorEditar(p);   setModalFormOpen(true) }
  const cerrarForm  = () => { setModalFormOpen(false);  setProveedorEditar(null) }

  const handleGuardar = async (data) => {
    if (proveedorEditar) await editarProveedor(proveedorEditar.id, data)
    else await crearProveedor(data)
  }

  // Función específica para reactivar (envía activo: 1)
  const handleReactivar = async (p) => {
    const dataActualizada = {
      nombre: p.nombre || '',
      telefono: p.telefono || '',
      direccion: p.direccion || '',
      email: p.email || '',
      activo: 1
    }
    await editarProveedor(p.id, dataActualizada)
  }

  const styles = { page: { padding: '40px 48px', flex: 1, background: '#fafbfc', minHeight: '100vh', fontFamily: "'Montserrat', 'Poppins', sans-serif" } }

  if (cargando) return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #5842ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={styles.page}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div><h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.02em' }}>GESTIÓN DE PROVEEDORES</h1></div>
        <button onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#5842ff', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={18} />Nuevo Proveedor
        </button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Proveedores', value: proveedores.length,                    borderColor: '#f59e0b', icon: <Truck size={20} color="#f59e0b" /> },
          { label: 'Resultados',        value: lista.length,                            borderColor: '#8b5cf6', icon: <Search size={20} color="#8b5cf6" /> },
          { label: 'Con Email',         value: proveedores.filter(p => p.email).length, borderColor: '#06b6d4', icon: <Mail size={20} color="#06b6d4" /> },
          { label: 'Inactivos',         value: inactivosCount,                          borderColor: '#f43f5e', icon: <ShieldAlert size={20} color="#f43f5e" /> },
        ].map((card, i) => (
          <div key={i} style={{ background: '#1a1b26', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: `1.5px solid ${card.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>{card.value}</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ CONTENEDOR PRINCIPAL TABLA Y FILTROS ═══ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>

        {/* Barra de herramientas */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por ID, proveedor, email..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 16px 10px 44px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#ffffff', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.border = '1px solid #5842ff'} onBlur={e => e.target.style.border = '1px solid #e2e8f0'} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafbfc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'PROVEEDOR', 'CONTACTO', 'TELÉFONO', 'EMAIL / DIRECCIÓN', 'ACCIONES'].map((h) => (
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
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pie tabla */}
        <div style={{ padding: '16px 24px', display: 'flex', background: '#ffffff' }}>
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