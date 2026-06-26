import { create } from 'zustand'
import { getProveedores, postProveedor, putProveedor, deleteProveedor } from '@/api/proveedores_api'

const useProveedoresStore = create((set, get) => ({
  proveedores: [],
  cargando: false,
  error: null,

  fetchProveedores: async () => {
    set({ cargando: true, error: null })
    try {
      const res = await getProveedores()
      // El backend devuelve un array directo o en res.data.datos
      const lista = (Array.isArray(res.data) ? res.data : res.data.datos ?? res.data.proveedores ?? [])
        .map(p => ({ ...p, id_proveedor: p.id_proveedor ?? p.id }))
      set({ proveedores: lista, cargando: false })
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.mensaje || 'Error al cargar proveedores'
      set({ error: errorMsg, cargando: false })
      throw new Error(errorMsg)
    }
  },

  crearProveedor: async (data) => {
    try {
      // El backend espera: nombre, telefono, direccion, email
      const payload = {
        nombre:    data.nombre?.trim() || '',
        telefono:  data.telefono?.trim() || '',
        direccion: data.direccion?.trim() || '',
        email:     data.email?.trim() || '',
      }
      const res = await postProveedor(payload)
      await get().fetchProveedores()
      return res.data
    } catch (err) {
      // El backend retorna error en res.data.error
      const errorMsg = err.response?.data?.error || err.response?.data?.mensaje || err.message || 'Error al crear proveedor'
      set({ error: errorMsg })
      // Re-lanzamos el error para que el modal lo muestre
      throw new Error(errorMsg)
    }
  },

  editarProveedor: async (id, data) => {
    try {
      // El backend espera: nombre, telefono, direccion, email, activo
      const payload = {
        nombre:    data.nombre?.trim() || '',
        telefono:  data.telefono?.trim() || '',
        direccion: data.direccion?.trim() || '',
        email:     data.email?.trim() || '',
        activo:    data.activo !== undefined ? data.activo : 1,
      }
      const res = await putProveedor(id, payload)
      await get().fetchProveedores()
      return res.data
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.mensaje || err.message || 'Error al editar proveedor'
      set({ error: errorMsg })
      throw new Error(errorMsg)
    }
  },

  eliminarProveedor: async (id) => {
    try {
      const proveedor = get().proveedores.find(p => p.id_proveedor === id || p.id === id)
      if (!proveedor) throw new Error('Proveedor no encontrado')
      
      // Enviar PUT con activo: 0 (soft delete)
      await putProveedor(id, {
        nombre:    proveedor.nombre || '',
        telefono:  proveedor.telefono || '',
        direccion: proveedor.direccion || '',
        email:     proveedor.email || '',
        activo:    0,
      })
      await get().fetchProveedores()
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.mensaje || err.message || 'Error al eliminar proveedor'
      set({ error: errorMsg })
      throw new Error(errorMsg)
    }
  },
}))

export default useProveedoresStore