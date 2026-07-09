import React, { useState, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, Users, Phone, MapPin, X, AlertTriangle, Mail
} from 'lucide-react'
import api from '../api/axios'
import Toast from '@/components/Toast'
import { capitalizarNombre } from '@/utils/formatearTexto'


export default function CustomersManager() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, nombre: '' })
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const [pagina, setPagina] = useState(1)
const [totalPaginas, setTotalPaginas] = useState(0)
const [totalClientes, setTotalClientes] = useState(0)

  // Modal de creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    nombres: '',
    apellidos: '',
    identificacion: '',
    telefono: '',
    direccion: '',
    email: '',
  })

  // Modal de edición
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')

  // Cargar clientes
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/clientes/')
      setCustomers(response.data?.items || [])
      setTotalClientes(data.total || 0)
      setPagina(data.page || pagina)
      setTotalPaginas(Math.ceil((data.total || 0) / (data.per_page || 10)))
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
  const handleCreate = async (payload) => {
    try {
      await api.post('/clientes/', {
        nombre: payload.nombre,
        identificacion: payload.identificacion,  // ← nuevo
        telefono: payload.telefono,
        direccion: payload.direccion,
        email: payload.email || undefined,
      })
      setCreateForm({ nombres: '', apellidos: '', identificacion: '', telefono: '', direccion: '', email: '' })
      setIsCreateModalOpen(false)
      fetchCustomers()
      setToast({ mensaje: 'Cliente creado correctamente', tipo: 'success' })
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'Error al guardar cliente'
      setToast({ mensaje, tipo: 'error' })
    }
  }

  // Abrir modal de edición (dividir nombre completo)
  const openEditModal = (customer) => {
    const nombreCompleto = customer.Cli_Nombre?.trim() || ''
    const partes = nombreCompleto.split(' ')
    const nombres = partes[0] || ''
    const apellidos = partes.slice(1).join(' ') || ''

    setEditingCustomer({
      id: customer.ID_Cliente,
      nombres: nombres,
      apellidos: apellidos,
      identificacion: customer.Cli_identificacion || '',
      telefono: customer.Cli_Telefono || '',
      direccion: customer.Cli_Direccion || '',
      email: customer.Cli_email || '',
    })
    setIsEditModalOpen(true)
  }

  // Actualizar cliente
  const handleUpdate = async (payload) => {
    try {
      await api.put(`/clientes/${payload.id}`, {
        nombre: payload.nombre,
        identificacion: payload.identificacion,  // ← nuevo
        telefono: payload.telefono,
        direccion: payload.direccion,
        email: payload.email || undefined,
      })
      setIsEditModalOpen(false)
      fetchCustomers()
      setToast({ mensaje: 'Cliente actualizado correctamente', tipo: 'success' })
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'Error al actualizar'
      setToast({ mensaje, tipo: 'error' })
    }
  }

  // Eliminar cliente
  const handleDelete = async () => {
    if (!deleteModal.id) return
    setDeleting(true)
    try {
      await api.delete(`/clientes/${deleteModal.id}`)
      setDeleteModal({ open: false, id: null, nombre: '' })
      fetchCustomers()
    } catch (err) {
      console.error(err)
      alert('No se pudo eliminar') // Opcional: puedes crear un estado de error en lugar del alert
    } finally {
      setDeleting(false)
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
    <div style={{ padding: "16px" }} className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div style={{ marginBottom: "32px" }} className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
          style={{ padding: "10px 16px" }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95 px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{ marginBottom: "32px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div style={{ padding: "16px" }} className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] p-4">
          <div className="bg-[#13152280] ring-2 ring-indigo-500/30 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <Users size={18} className="text-indigo-300" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{customers.length}</p>
            <p className="text-xs text-white/50">Clientes registrados</p>
          </div>
        </div>
        <div style={{ padding: "16px" }} className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] p-4">
          <div className="bg-[#13152280] ring-2 ring-cyan-500/30 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <Phone size={18} className="text-cyan-300" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{filteredCustomers.length}</p>
            <p className="text-xs text-white/50">Resultados encontrados</p>
          </div>
        </div>
        <div style={{ padding: "16px" }} className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] p-4">
          <div className="bg-[#13152280] ring-2 ring-emerald-500/30 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-emerald-300" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{customers.filter(c => c.Cli_Direccion).length}</p>
            <p className="text-xs text-white/50">Con dirección</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px", marginBottom: "24px" }} className="bg-red-100 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-2 text-sm mb-6">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* TABLA (sin formulario inline) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div style={{ padding: "16px" }} className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingRight: "16px", paddingLeft: "40px", paddingTop: "8px", paddingBottom: "8px" }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[420px]">
            <thead>
              <tr className="bg-gray-50">
                {['Cliente', 'Teléfono', 'Dirección', 'Acciones'].map(h => (
                  <th style={{ padding: "12px 16px" }} key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td style={{ paddingTop: "48px", paddingBottom: "48px" }} colSpan="4" className="text-center py-12 text-gray-400">No hay clientes registrados</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.ID_Cliente} className="border-t border-gray-100 hover:bg-gray-50">
                    <td style={{ padding: "12px  16px" }} className="px-4 py-3 font-medium text-gray-800">{capitalizarNombre(customer.Cli_Nombre)}</td>
                    <td style={{ padding: "12px  16px" }} className="px-4 py-3 text-gray-600">{capitalizarNombre(customer.Cli_Telefono) || '—'}</td>
                    <td style={{ padding: "12px  16px" }} className="px-4 py-3 text-gray-600">{capitalizarNombre(customer.Cli_Direccion)    || '—'}</td>
                    <td style={{ padding: "12px  16px" }} className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center"
                        >
                          <Pencil size={16} color="#4f46e5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, id: customer.ID_Cliente, nombre: customer.Cli_Nombre })}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center"
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pie de tabla con paginación */}
<div
  style={{ padding: "20px 32px" }}
  className="border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/30"
>
  <span className="text-sm">
    Mostrando{" "}
    <strong className="text-slate-700 font-semibold">
      {customers.length}
    </strong>{" "}
    de{" "}
    <strong className="text-slate-700 font-semibold">{totalClientes}</strong>{" "}
    clientes
  </span>

  {totalPaginas > 1 && (
    <div className="flex items-center gap-2">
      <button
        onClick={() => fetchCustomers(pagina - 1)}
        disabled={pagina === 1}
        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
        style={{
          cursor: pagina === 1 ? "not-allowed" : "pointer",
          padding: "10px 16px",
        }}
      >
        ← Anterior
      </button>
      <span
        style={{ paddingLeft: "12px", paddingRight: "12px" }}
        className="text-sm text-slate-500 px-3 font-medium"
      >
        {pagina} / {totalPaginas}
      </span>
      <button
        onClick={() => fetchCustomers(pagina + 1)}
        disabled={pagina === totalPaginas}
        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
        style={{
          cursor: pagina === totalPaginas ? "not-allowed" : "pointer",
          padding: "10px 16px",
        }}
      >
        Siguiente →
      </button>
    </div>
  )}
</div>
        </div>
      </div>

      {/* MODAL CREAR CLIENTE */}
      {isCreateModalOpen && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div style={{ padding: "16px 24px" }} className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Registrar Cliente</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X size={18} color="#64748b" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              
              const nombreCompleto = `${createForm.nombres.trim()} ${createForm.apellidos.trim()}`
              handleCreate({
                nombre: nombreCompleto,
                telefono: createForm.telefono,
                direccion: createForm.direccion,
                identificacion: createForm.identificacion,
                email: createForm.email,
              })
            }} style={{ padding: "24px" }} className="p-6 flex flex-col gap-4">

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Nombres</label>
                <input
                  style={{ padding: "8px 12px" }}
                  type="text"
                  value={createForm.nombres}
                  onChange={e => {
                    const valor = e.target.value
                      .replace(/[0-9]/g, '')
                      .slice(0, 30)
                    setCreateForm({ ...createForm, nombres: valor })
                  }}
                  placeholder="Ej: Juan Carlos"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {/* Identificación */}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Apellidos</label>
                <input
                  style={{ padding: "8px 12px" }}
                  type="text"
                  value={createForm.apellidos}
                  onChange={e => {
                    const valor = e.target.value
                      .replace(/[0-9]/g, '')
                      .slice(0, 30)
                    setCreateForm({ ...createForm, apellidos: valor })
                  }}
                  placeholder="Ej: Pérez García"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />              </div><div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Identificación</label>
                <input
                  style={{ padding: "8px 12px" }}
                  type="text"
                  value={createForm.identificacion}
                  onChange={e => {
                    const valor = e.target.value
                      .replace(/[^0-9]/g, '')  // Solo números
                      .slice(0, 20)            // Máximo 20 caracteres
                    setCreateForm({ ...createForm, identificacion: valor })
                  }}
                  placeholder="Ej: 1234567890"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
                <input
                  style={{ padding: "8px 12px" }}
                  type="text"
                  value={createForm.telefono}
                  onChange={e => {
                    const valor = e.target.value
                      .replace(/[^0-9+]/g, '')   // Solo permite números y el símbolo '+'
                      .slice(0, 15)              // Máximo 15 caracteres
                    setCreateForm({ ...createForm, telefono: valor })
                  }}
                  placeholder="3001234567"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Dirección</label>
                <input style={{ padding: "8px 12px" }} type="text" value={createForm.direccion} onChange={e => setCreateForm({ ...createForm, direccion: e.target.value })} placeholder="Calle 123" className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email </label>
                <input style={{ padding: "8px 12px" }} type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="correo@ejemplo.com" className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div style={{ marginTop: "8px" }} className="flex gap-3 mt-2">
                <button style={{ paddingTop: "10px", paddingBottom: "10px" }} type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button style={{ paddingTop: "10px", paddingBottom: "10px" }} type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de confirmación de eliminación */}
      {deleteModal.open && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div style={{ padding: "32px" }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
            <div style={{ marginBottom: "24px", marginLeft: "auto", marginRight: "auto" }} className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <p style={{ marginBottom: "12px" }} className="font-bold text-xl text-slate-800 mb-3">¿Eliminar cliente?</p>
            <p style={{ marginBottom: "32px" }} className="text-sm text-slate-500 mb-8 leading-relaxed">
              El cliente <strong className="text-indigo-600">{deleteModal.nombre}</strong> será eliminado permanentemente.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, id: null, nombre: '' })}
                disabled={deleting}
                style={{ paddingTop: "12px", paddingBottom: "12px" }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ paddingTop: "12px", paddingBottom: "12px" }}
                className="flex-1 py-3 border-none rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CLIENTE */}
      {isEditModalOpen && editingCustomer && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div style={{ padding: "16px  24px" }} className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Editar Cliente</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X size={18} color="#64748b" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
            
              const nombreCompleto = `${editingCustomer.nombres.trim()} ${editingCustomer.apellidos.trim()}`
              handleUpdate({
                id: editingCustomer.id,
                nombre: nombreCompleto,
                telefono: editingCustomer.telefono,
                identificacion: editingCustomer.identificacion,
                direccion: editingCustomer.direccion,
                email: editingCustomer.email,
              })
            }} style={{ padding: "24px" }} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Nombres</label>
                <input
                  type="text"
                  value={editingCustomer.nombres}
                  onChange={e => {
                    const valor = e.target.value
                      .replace(/[0-9]/g, '')
                      .slice(0, 30)
                    setEditingCustomer({ ...editingCustomer, nombres: valor })
                  }}
                  placeholder="Ej: Juan Carlos"
                  style={{ padding: "8px 12px" }}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />              </div>
              {/* Identificación */}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Apellidos</label>
                <input
                  type="text"
                  value={editingCustomer.apellidos}
                  onChange={e => {
                    const valor = e.target.value
                      .replace(/[0-9]/g, '')
                      .slice(0, 30)
                    setEditingCustomer({ ...editingCustomer, apellidos: valor })
                  }}
                  placeholder="Ej: Pérez García"
                  style={{ padding: "8px 12px" }}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Identificación</label>
                <input
                  style={{ padding: "8px 12px" }}
                  type="text"
                  value={editingCustomer.identificacion || ''}
                  onChange={e => {
                    const valor = e.target.value
                      .replace(/[^0-9]/g, '')
                      .slice(0, 20)
                    setEditingCustomer({ ...editingCustomer, identificacion: valor })
                  }}
                  placeholder="Ej: 1234567890"

                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
                <input
                  type="text"
                  value={editingCustomer.telefono}
                  onChange={e => {
                    const valor = e.target.value
                      .replace(/[^0-9+]/g, '')
                      .slice(0, 15)
                    setEditingCustomer({ ...editingCustomer, telefono: valor })
                  }}
                  placeholder="3001234567"
                  style={{ padding: "8px 12px" }}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Dirección</label>
                <input type="text" value={editingCustomer.direccion} onChange={e => setEditingCustomer({ ...editingCustomer, direccion: e.target.value })} placeholder="Calle 123" style={{ padding: "8px 12px" }} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email </label>
                <input type="email" value={editingCustomer.email} onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })} placeholder="correo@ejemplo.com" style={{ padding: "8px 12px" }} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div style={{ marginTop: "8px" }} className="flex gap-3 mt-2">
                <button style={{ padding: "10px 0px" }} type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button style={{ padding: "10px 0px" }} type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}{toast && (
        <Toast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>


  )
}