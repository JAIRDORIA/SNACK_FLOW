import { useState, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, X,
  AlertTriangle, Truck, Phone, Mail, MapPin, User
} from 'lucide-react'
import useProveedoresStore from '@/store/useProveedoresStore'

function ModalProveedor({ proveedor, onClose, onGuardar }) {
  const [form, setForm] = useState({
    nombre: proveedor?.nombre || '',
    telefono: proveedor?.telefono || '',
    email: proveedor?.email || '',
    direccion: proveedor?.direccion || '',
    contacto: proveedor?.contacto || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [errForm, setErrForm] = useState(null)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { setErrForm('El nombre del proveedor es obligatorio.'); return }
    setGuardando(true)
    setErrForm(null)
    try {
      await onGuardar(form)
      onClose()
    } catch (err) {
      setErrForm(err.response?.data?.mensaje || 'Error al guardar proveedor.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#1B1D2E', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            {proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { name: 'nombre',    label: 'Nombre *',              icon: Truck,  placeholder: 'Nombre del proveedor' },
            { name: 'contacto',  label: 'Persona de Contacto',   icon: User,   placeholder: 'Nombre del contacto' },
            { name: 'telefono',  label: 'Teléfono',              icon: Phone,  placeholder: 'Ej: 300 123 4567' },
            { name: 'email',     label: 'Email',                 icon: Mail,   placeholder: 'correo@ejemplo.com' },
            { name: 'direccion', label: 'Dirección',             icon: MapPin, placeholder: 'Dirección del proveedor' },
          ].map(({ name, label, icon: Icon, placeholder }) => (
            <div key={name}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <Icon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          ))}
        </div>

        {errForm && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
            {errForm}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#4f46e5', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            {guardando ? 'Guardando...' : proveedor ? 'Actualizar' : 'Crear Proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEliminar({ proveedor, onClose, onConfirmar }) {
  const [eliminando, setEliminando] = useState(false)

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
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>¿Eliminar proveedor?</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Se eliminará <strong style={{ color: 'white' }}>{proveedor?.nombre}</strong> permanentemente.
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

export default function Proveedores() {
  const { proveedores, cargando, error, fetchProveedores, crearProveedor, editarProveedor, eliminarProveedor } = useProveedoresStore()
  const [busqueda, setBusqueda] = useState('')
  const [modalFormOpen, setModalFormOpen] = useState(false)
  const [proveedorEditar, setProveedorEditar] = useState(null)
  const [proveedorEliminar, setProveedorEliminar] = useState(null)

  useEffect(() => { fetchProveedores() }, [])

  const lista = proveedores.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.telefono?.includes(busqueda) ||
    p.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.contacto?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const abrirCrear = () => { setProveedorEditar(null); setModalFormOpen(true) }
  const abrirEditar = (p) => { setProveedorEditar(p); setModalFormOpen(true) }
  const cerrarForm = () => { setModalFormOpen(false); setProveedorEditar(null) }

  const handleGuardar = async (data) => {
    if (proveedorEditar) await editarProveedor(proveedorEditar.id_proveedor, data)
    else await crearProveedor(data)
  }

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Cargando proveedores...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 max-w-2xl">
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <div>
        <p className="text-red-700 font-semibold text-sm mb-1">Error al cargar proveedores</p>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px', flex: 1, background: '#f9fafb', minHeight: '100vh' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Gestión De Proveedores
        </h1>
        <button onClick={abrirCrear} style={{ padding: '8px 14px' }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95">
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Proveedor</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Proveedores', value: proveedores.length, color: '#4f46e5' },
          { label: 'Mostrando',         value: lista.length,       color: '#22d3ee' },
          { label: 'Con Email',         value: proveedores.filter(p => p.email).length, color: '#34d399' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#1B1D2E', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: card.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={20} color={card.color} />
            </div>
            <div>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
              <p style={{ color: 'white', fontSize: '24px', fontWeight: 700, margin: 0 }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, teléfono, email..."
          style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 120px', padding: '12px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          {['Proveedor', 'Contacto', 'Teléfono', 'Email / Dirección', 'Acciones'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {lista.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Truck size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              {busqueda ? 'Sin resultados para la búsqueda.' : 'No hay proveedores registrados.'}
            </p>
          </div>
        ) : (
          lista.map((p, idx) => (
            <div key={p.id_proveedor}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 120px', padding: '14px 20px', alignItems: 'center', borderBottom: idx < lista.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#4f46e522', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={16} color="#4f46e5" />
                </div>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{p.nombre}</span>
              </div>
              <span style={{ fontSize: '14px', color: '#374151' }}>{p.contacto || <span style={{ color: '#d1d5db' }}>—</span>}</span>
              <span style={{ fontSize: '14px', color: '#374151' }}>{p.telefono || <span style={{ color: '#d1d5db' }}>—</span>}</span>
              <div>
                {p.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}><Mail size={12} color="#9ca3af" /><span style={{ fontSize: '13px', color: '#374151' }}>{p.email}</span></div>}
                {p.direccion && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={12} color="#9ca3af" /><span style={{ fontSize: '13px', color: '#6b7280' }}>{p.direccion}</span></div>}
                {!p.email && !p.direccion && <span style={{ color: '#d1d5db' }}>—</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => abrirEditar(p)}
                  style={{ padding: '7px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.borderColor = '#c7d2fe' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                ><Pencil size={14} /></button>
                <button onClick={() => setProveedorEliminar(p)}
                  style={{ padding: '7px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                ><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalFormOpen && <ModalProveedor proveedor={proveedorEditar} onClose={cerrarForm} onGuardar={handleGuardar} />}
      {proveedorEliminar && <ModalEliminar proveedor={proveedorEliminar} onClose={() => setProveedorEliminar(null)} onConfirmar={() => eliminarProveedor(proveedorEliminar.id_proveedor)} />}
    </div>
  )
}