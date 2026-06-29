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
      // El backend devuelve un array directo; normalizamos 'id' → 'id_proveedor'
      const lista = (res.data?.datos || []).map(p => ({
  ...p,
  id_proveedor: p.id_proveedor ?? p.id   // normalización
}))
      set({ proveedores: lista, cargando: false })
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.mensaje || 'Error al cargar proveedores', cargando: false })
    }
  },

  crearProveedor: async (data) => {
    // El backend espera: nombre, telefono, direccion, email
    const payload = {
      nombre:    data.nombre,
      telefono:  data.telefono   || '',
      direccion: data.direccion  || '',
      email:     data.email      || '',
    }
    const res = await postProveedor(payload)
    await get().fetchProveedores()
    return res.data
  },

  editarProveedor: async (id, data) => {
    // El backend espera: nombre, telefono, direccion, email, activo
    const payload = {
      nombre:    data.nombre,
      telefono:  data.telefono   || '',
      direccion: data.direccion  || '',
      email:     data.email      || '',
      activo:    data.activo !== undefined ? data.activo : 1,
    }
    const res = await putProveedor(id, payload)
    await get().fetchProveedores()
    return res.data
  },

 eliminarProveedor: async (id) => {
  // En vez de DELETE, enviamos PUT con activo: 0
  await putProveedor(id, {
    activo: 0,
    nombre:    get().proveedores.find(p => p.id_proveedor === id)?.nombre    || '',
    telefono:  get().proveedores.find(p => p.id_proveedor === id)?.telefono  || '',
    direccion: get().proveedores.find(p => p.id_proveedor === id)?.direccion || '',
    email:     get().proveedores.find(p => p.id_proveedor === id)?.email     || '',
  })
  await get().fetchProveedores()
},
}))

export default useProveedoresStore