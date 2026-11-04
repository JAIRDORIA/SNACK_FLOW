import { create } from 'zustand'
import {
  getProveedores,
  getProveedoresActivos,
  postProveedor,
  putProveedor,
} from '@/api/proveedores_api'

const normalizarProveedor = (p) => ({
  ...p,
  // El backend mezcla `id` e `id_proveedor` según el endpoint.
  id_proveedor: p.id_proveedor ?? p.id,
})

// Ignora respuestas viejas al cambiar de página o de término de búsqueda.
let fetchSeq = 0

const useProveedoresStore = create((set, get) => ({
  proveedores: [],
  total: 0,
  pagina: 1,
  limite: 20,
  total_paginas: 0,
  busqueda: '',
  cargando: false,
  error: null,

  // Lista completa para selects (no usa el listado paginado).
  proveedoresActivos: [],
  cargandoActivos: false,
  errorActivos: null,

  setBusqueda: (q) => {
    const busqueda = String(q ?? '').trim()
    if (busqueda === get().busqueda) return
    set({ busqueda, pagina: 1 })
    get().fetchProveedores(1)
  },

  fetchProveedores: async (pagina = get().pagina) => {
    const seq = ++fetchSeq
    const { busqueda, limite } = get()
    set({ cargando: true, error: null })
    try {
      const res = await getProveedores(pagina, limite, busqueda)
      if (seq !== fetchSeq) return
      const data = res.data || {}
      set({
        proveedores: (data.datos || []).map(normalizarProveedor),
        total: data.total ?? 0,
        pagina: data.pagina ?? pagina,
        limite: data.limite ?? limite,
        total_paginas: data.total_paginas ?? 0,
        cargando: false,
      })
    } catch (err) {
      if (seq !== fetchSeq) return
      set({
        error: err.response?.data?.error || err.response?.data?.mensaje || 'Error al cargar proveedores',
        cargando: false,
      })
    }
  },

  fetchProveedoresActivos: async () => {
    set({ cargandoActivos: true, errorActivos: null })
    try {
      const res = await getProveedoresActivos()
      const lista = Array.isArray(res.data) ? res.data : res.data?.datos || res.data?.items || []
      set({ proveedoresActivos: lista.map(normalizarProveedor), cargandoActivos: false })
    } catch (err) {
      set({
        errorActivos:
          err.response?.data?.error || err.response?.data?.mensaje || 'Error al cargar proveedores activos',
        cargandoActivos: false,
      })
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
    await get().fetchProveedores(1)
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
  const proveedor = get().proveedores.find(p => p.id_proveedor === id)
  await putProveedor(id, {
    activo: 0,
    nombre:    proveedor?.nombre    || '',
    telefono:  proveedor?.telefono  || '',
    direccion: proveedor?.direccion || '',
    email:     proveedor?.email     || '',
  })
  await get().fetchProveedores()
},
}))

export default useProveedoresStore
