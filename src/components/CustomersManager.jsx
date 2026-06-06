import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Phone,
  MapPin,
  X,
  AlertTriangle
} from 'lucide-react'
import api from '../api/axios'

export default function CustomersManager() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
  })

  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/clientes/')
      setCustomers(
        Array.isArray(response.data)
          ? response.data
          : response.data.clientes || []
      )
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

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.telefono) {
      alert('Nombre y teléfono son obligatorios')
      return
    }
    try {
      await api.post('/clientes', formData)
      setFormData({ nombre: '', telefono: '', direccion: '' })
      fetchCustomers()
    } catch (err) {
      console.error(err)
      alert('Error al guardar cliente')
    }
  }

  const openEditModal = (customer) => {
    setEditingCustomer({ ...customer })
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/clientes/${editingCustomer.id}`, editingCustomer)
      setIsEditModalOpen(false)
      fetchCustomers()
    } catch (err) {
      console.error(err)
      alert('Error al actualizar')
    }
  }

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

  const filteredCustomers = customers.filter((c) =>
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono?.includes(searchTerm)
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
          style={{ padding: '8px 16px' }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{ marginBottom: '32px' }} className="grid grid-cols-2 lg:grid-cols-3 gap-4">

        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-indigo-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <Users size={15} className="text-indigo-300" />
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{customers.length}</p>
            <p style={{ marginTop: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Clientes registrados</p>
          </div>
        </div>

        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-cyan-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <Phone size={15} className="text-cyan-300" />
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{filteredCustomers.length}</p>
            <p style={{ marginTop: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Resultados encontrados</p>
          </div>
        </div>

        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-emerald-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <MapPin size={15} className="text-emerald-300" />
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{customers.filter(c => c.direccion).length}</p>
            <p style={{ marginTop: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Con dirección</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '20px' }} className="bg-red-100 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">

        {/* FORMULARIO */}
        <div style={{ padding: '24px' }} className="bg-white border border-slate-200 rounded-2xl shadow-sm h-fit sticky top-6">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>
            Registrar Cliente
          </h3>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nombre
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Teléfono
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="3001234567"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle 123"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <button
              type="submit"
              style={{ width: '100%', background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: 'white', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', marginTop: '4px' }}
            >
              Guardar Cliente
            </button>
          </form>
        </div>

        {/* TABLA */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative', maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px 10px 40px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
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
                    <tr key={customer.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', fontSize: '14px' }}>{customer.nombre}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>{customer.telefono}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>{customer.direccion || '—'}</td>
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
                            onClick={() => handleDelete(customer.id)}
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
      </div>

      {/* MODAL EDITAR */}
      {isEditModalOpen && editingCustomer && (
        <div style={{ padding: '16px' }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div style={{ width: '100%', maxWidth: '440px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} className="bg-white">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Editar Cliente</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleUpdate} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={editingCustomer.nombre}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, nombre: e.target.value })}
                placeholder="Nombre"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                value={editingCustomer.telefono}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, telefono: e.target.value })}
                placeholder="Teléfono"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                value={editingCustomer.direccion || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, direccion: e.target.value })}
                placeholder="Dirección"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
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
