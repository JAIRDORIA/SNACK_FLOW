import React, { useState, useEffect,useRef} from 'react'
import {
  Plus, Search, Pencil, Trash2, Users, Phone, MapPin, X, AlertTriangle, Mail,Loader2
} from 'lucide-react'
import api from '../api/axios'
import Toast from '@/components/Toast'
import CrearClienteModal from '@/components/CrearClienteModal'
import { capitalizarNombre } from '@/utils/formatearTexto'


export default function CustomersManager() {
  const [customers, setCustomers] = useState([])
  const [buscando, setBuscando] = useState(false)
  const debounceRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, nombre: '' })
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [totalClientes, setTotalClientes] = useState(0)

  // Modal de creación (el formulario vive en <CrearClienteModal/>)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Modal de edición
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')

  // Cargar clientes
  const fetchCustomers = async (pagina = 1, busqueda = searchTerm) => {

    setBuscando(true)
    try {
      const response = await api.get('/clientes/', {
        params: {
          page: pagina,
          per_page: 10,
          q: busqueda  // ← Enviar el término de búsqueda al backend
        }
      })
      const data = response.data
      setCustomers(data.items || [])
      setTotalClientes(data.total || 0)
      setPagina(data.page || pagina)
      setTotalPaginas(Math.ceil((data.total || 0) / (data.per_page || 10)))
      setError(null)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los clientes.')
    } finally {

      setBuscando(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSearch = (value) => {
    setSearchTerm(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchCustomers(1, value)   // página 1, término actual
    }, 300)
  }

  // Éxito al crear cliente (el POST lo hace <CrearClienteModal/>)
  const handleClienteCreado = () => {
    setIsCreateModalOpen(false)
    fetchCustomers()
    setToast({ mensaje: 'Cliente creado correctamente', tipo: 'success' })
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
        email: payload.email,
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
    <div className="flex-1 bg-gray-50 sm:p-6 lg:p-8 p-4">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <p className="mb-1" style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase' }}>
            módulo operativo
          </p>
          <h1 className="m-0" style={{ fontSize: '28px', fontWeight: 700, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Gestión de Clientes
          </h1>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}

          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95 py-2.5 px-4"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] p-4">
          <div className="bg-[#13152280] ring-2 ring-indigo-500/30 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <Users size={18} className="text-indigo-300" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalClientes}</p>
            <p className="text-xs text-white/50">Clientes registrados</p>
          </div>
        </div>
        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] p-4">
          <div className="bg-[#13152280] ring-2 ring-cyan-500/30 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <Phone size={18} className="text-cyan-300" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{customers.length}</p>
            <p className="text-xs text-white/50">Resultados encontrados</p>
          </div>
        </div>
        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] p-4">
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
        <div className="bg-red-100 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm p-3 mb-6">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* TABLA (sin formulario inline) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 p-4">
          <div style={{ position: 'relative', maxWidth: '360px' }}>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}

              className="w-full border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 pr-4 pl-10 pt-2 pb-2"
            />
            <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            {buscando && (
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <Loader2 size={16} className="animate-spin text-indigo-500" />
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[420px]">
            <thead>
              <tr className="bg-gray-50">
                {['Cliente', 'Teléfono', 'Dirección', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-gray-400 pt-12 pb-12">No hay clientes registrados</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.ID_Cliente} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="font-medium text-gray-800 py-3 px-4">{capitalizarNombre(customer.Cli_Nombre)}</td>
                    <td className="text-gray-600 py-3 px-4">{capitalizarNombre(customer.Cli_Telefono) || '—'}</td>
                    <td className="text-gray-600 py-3 px-4">{capitalizarNombre(customer.Cli_Direccion) || '—'}</td>
                    <td className="py-3 px-4">
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

            className="border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/30 py-5 px-8"
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
                  onClick={() => fetchCustomers(pagina - 1, searchTerm)}
                  disabled={pagina === 1}
                  className="border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600 py-2.5 px-4"
                  style={{
                    cursor: pagina === 1 ? "not-allowed" : "pointer"
                  }}
                >
                  ← Anterior
                </button>
                <span

                  className="text-sm text-slate-500 font-medium pl-3 pr-3"
                >
                  {pagina} / {totalPaginas}
                </span>
                <button
                  onClick={() => fetchCustomers(pagina + 1, searchTerm)}
                  disabled={pagina === totalPaginas}
                  className="border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600 py-2.5 px-4"
                  style={{
                    cursor: pagina === totalPaginas ? "not-allowed" : "pointer"
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CREAR CLIENTE (componente compartido) */}
      <CrearClienteModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleClienteCreado}
        onError={(mensaje) => setToast({ mensaje, tipo: 'error' })}
      />
      {/* Modal de confirmación de eliminación */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl text-center p-8">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 m-auto m-auto">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <p className="font-bold text-xl text-slate-800 mb-3">¿Eliminar cliente?</p>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              El cliente <strong className="text-indigo-600">{deleteModal.nombre}</strong> será eliminado permanentemente.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, id: null, nombre: '' })}
                disabled={deleting}

                className="flex-1 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all pt-3 pb-3"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}

                className="flex-1 border-none rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 pt-3 pb-3"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CLIENTE */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 py-4 px-6">
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
            }} className="flex flex-col gap-4 p-6">
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

                  className="w-full mt-1 border rounded-lg text-sm py-2 px-3"
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

                  className="w-full mt-1 border rounded-lg text-sm py-2 px-3"
                />              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Identificación</label>
                <input
                  className="py-2 px-3"
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

                  className="w-full mt-1 border rounded-lg text-sm py-2 px-3"
                />              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Dirección</label>
                <input type="text" value={editingCustomer.direccion} onChange={e => setEditingCustomer({ ...editingCustomer, direccion: e.target.value })} placeholder="Calle 123" className="w-full mt-1 border rounded-lg text-sm py-2 px-3" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email </label>
                <input type="email" value={editingCustomer.email} onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })} placeholder="correo@ejemplo.com" className="w-full mt-1 border rounded-lg text-sm py-2 px-3" />
              </div>
              <div className="flex gap-3 mt-2">
                <button className="py-2.5 px-0" type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm py-2.5 px-0">Actualizar</button>
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
