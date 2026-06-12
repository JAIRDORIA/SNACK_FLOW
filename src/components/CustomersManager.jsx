import React, { useState, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, Users, Phone, MapPin, X, AlertTriangle, Mail
} from 'lucide-react'
import api from '../api/axios'

export default function CustomersManager() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estados para el modal de creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    email: '',
  })

  // Estados para el modal de edición
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')

  // Carga de clientes
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/clientes/')
      setCustomers(response.data?.items || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Crear cliente
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.nombre || !createForm.telefono) {
      alert('Nombre y teléfono son obligatorios')
      return
    }
    try {
      await api.post('/clientes/', createForm)
      setCreateForm({ nombres: '', apellidos: '', telefono: '', direccion: '', email: '' })
      setIsCreateModalOpen(false)
      fetchCustomers()
    } catch (err) {
      console.error(err)
      alert('Error al guardar cliente')
    }
  }

  // Abrir modal de edición (mapeo de campos del backend)
  const openEditModal = (customer) => {
  const nombreCompleto = customer.Cli_Nombre?.trim() || '';
  const partes = nombreCompleto.split(' ');
  const nombres = partes[0] || '';
  const apellidos = partes.slice(1).join(' ') || '';

  setEditingCustomer({
    id: customer.ID_Cliente,
    nombres: nombres,
    apellidos: apellidos,
    telefono: customer.Cli_Telefono || '',
    direccion: customer.Cli_Direccion || '',
    email: customer.Cli_email || '',
  });
  setIsEditModalOpen(true);
};

  // Actualizar cliente
  const handleUpdate = async (payload) => {
  try {
    await api.put(`/clientes/${payload.id}`, {
      nombre: payload.nombre,
      telefono: payload.telefono,
      direccion: payload.direccion,
      email: payload.email,
    });
    setIsEditModalOpen(false);
    fetchCustomers();
  } catch (err) {
    console.error(err);
    alert('Error al actualizar');
  }
};
  // Eliminar cliente
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return
    try {
      await api.delete(`/clientes/${id}`)
      fetchCustomers()
    } catch (err) {
      console.error(err)
      alert('No se pudo eliminar')
    }
  }

  // Filtro de búsqueda
  const filteredCustomers = customers.filter((c) =>
    c.Cli_Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Cli_Telefono?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px' }} className="flex-1 bg-gray-50">

      {/* HEADER */}
      <div style={{ marginBottom: '24px' }} className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            módulo operativo
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Gestión de Clientes
          </h1>
        </div>
        <button
          onClick={() => {
            setCreateForm({ nombres: '', apellidos: '', telefono: '', direccion: '', email: '' })
            setIsCreateModalOpen(true)
          }}
          style={{ padding: '8px 16px' }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI CARDS (sin cambios) */}
      <div style={{ marginBottom: '32px' }} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ... mismo código de las tarjetas KPI ... */}
      </div>

      {error && (
        <div style={{ marginBottom: '20px' }} className="bg-red-100 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* TABLA (ocupa todo el ancho) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative', maxWidth: '360px' }}>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px 10px 40px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Cliente', 'Teléfono', 'Dirección', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Acciones' ? 'center' : 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '14px' }}>
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.ID_Cliente} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', fontSize: '14px' }}>{customer.Cli_Nombre}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>{customer.Cli_Telefono}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>{customer.Cli_Direccion || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button
                          onClick={() => openEditModal(customer)}
                          style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Pencil size={15} color="#4f46e5" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.ID_Cliente)}
                          style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={15} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR CLIENTE */}
      {/* MODAL CREAR CON NOMBRES Y APELLIDOS */}
      {isCreateModalOpen && (
        <div style={{ padding: '16px' }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div style={{ width: '100%', maxWidth: '440px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} className="bg-white">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Registrar Cliente</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              // Validar campos obligatorios
              if (!createForm.nombres || !createForm.apellidos || !createForm.telefono) {
                alert('Nombres, apellidos y teléfono son obligatorios')
                return
              }
              // Concatenar nombres y apellidos en un solo nombre
              const nombreCompleto = `${createForm.nombres.trim()} ${createForm.apellidos.trim()}`
              handleCreate({
                ...createForm,
                nombre: nombreCompleto,
              })
              setIsCreateModalOpen(false)
            }} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Nombres */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombres</label>
                <input
                  type="text"
                  value={createForm.nombres}
                  onChange={(e) => setCreateForm({ ...createForm, nombres: e.target.value })}
                  placeholder="Ej: Juan Carlos"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Apellidos */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Apellidos</label>
                <input
                  type="text"
                  value={createForm.apellidos}
                  onChange={(e) => setCreateForm({ ...createForm, apellidos: e.target.value })}
                  placeholder="Ej: Pérez García"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</label>
                <input
                  type="text"
                  value={createForm.telefono}
                  onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                  placeholder="3001234567"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Dirección */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección</label>
                <input
                  type="text"
                  value={createForm.direccion}
                  onChange={(e) => setCreateForm({ ...createForm, direccion: e.target.value })}
                  placeholder="Calle 123"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email (opcional)</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', color: '#475569' }}>
                  Cancelar
                </button>
                <button type="submit"
                  style={{ flex: 1, background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: 'white', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CLIENTE (ajustado) */}
      {/* MODAL EDITAR CLIENTE (con nombres y apellidos) */}
      {isEditModalOpen && editingCustomer && (
        <div style={{ padding: '16px' }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div style={{ width: '100%', maxWidth: '440px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} className="bg-white">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Editar Cliente</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              // Concatenar nombres y apellidos antes de enviar
              const nombreCompleto = `${editingCustomer.nombres.trim()} ${editingCustomer.apellidos.trim()}`;
              handleUpdate({
                ...editingCustomer,
                nombre: nombreCompleto,
              });
            }} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Nombres */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombres</label>
                <input
                  type="text"
                  value={editingCustomer.nombres || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, nombres: e.target.value })}
                  placeholder="Ej: Juan Carlos"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Apellidos */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Apellidos</label>
                <input
                  type="text"
                  value={editingCustomer.apellidos || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, apellidos: e.target.value })}
                  placeholder="Ej: Pérez García"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Teléfono, Dirección y Email (igual que antes) */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</label>
                <input type="text" value={editingCustomer.telefono || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, telefono: e.target.value })} placeholder="3001234567" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección</label>
                <input type="text" value={editingCustomer.direccion || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, direccion: e.target.value })} placeholder="Calle 123" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email (opcional)</label>
                <input type="email" value={editingCustomer.email || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })} placeholder="correo@ejemplo.com" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', color: '#475569' }}>
                  Cancelar
                </button>
                <button type="submit"
                  style={{ flex: 1, background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: 'white', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}