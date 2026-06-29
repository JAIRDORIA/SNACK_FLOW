import { create } from 'zustand'
import { getCompras, postCompra, putCompra, deleteCompra } from '@/api/compras_api'
import { getCortes } from '@/api/cortes_api'

// Mapea la respuesta del backend al shape que usa el frontend
const normalizar = (c) => ({
  ...c,
  id_compra:        c.id_compra        ?? c.id,
  id_proveedor:     c.id_proveedor     ?? c.proveedor_id,
  nombre_proveedor: c.nombre_proveedor ?? c.proveedor_nombre ?? '',
  costo_total:      c.costo_total      ?? c.total ?? 0,
  fecha_compra:     c.fecha_compra     ?? c.fecha ?? '',
})

const useComprasStore = create((set, get) => ({
  compras:       [],
  total:         0,
  pagina:        1,
  limite:        20,
  total_paginas: 0,
  cargando:      false,
  error:         null,
  corteIdFiltro: null,
  cortes:        [],

  fetchCompras: async (pagina = 1, limite = 20, corteId = null) => {
    set({ cargando: true, error: null, corteIdFiltro: corteId })
    try {
      const res = await getCompras(pagina, limite, corteId)
      const raw = res.data
      set({
        compras:       (raw.compras ?? raw.datos ?? []).map(normalizar),
        total:         raw.total         ?? 0,
        pagina:        raw.pagina        ?? 1,
        limite:        raw.limite        ?? 20,
        total_paginas: raw.total_paginas ?? 1,
        cargando:      false,
      })
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.mensaje || 'Error al cargar compras', cargando: false })
    }
  },

  fetchCortes: async () => {
    try {
      const res = await getCortes(1, 100)
      set({ cortes: res.data.datos ?? [] })
    } catch (err) {
      console.error('Error al cargar cortes', err)
    }
  },

  crearCompra: async (data) => {
    // Frontend envía: id_proveedor, descripcion, costo_total, fecha_compra
    // Backend espera:  proveedor_id, descripcion, total,       fecha,        usuario_id
    const usuario_id = JSON.parse(localStorage.getItem('usuario') || '{}').id ?? 1
    const payload = {
      proveedor_id: data.id_proveedor,
      total:        data.costo_total,
      fecha:        data.fecha_compra,
      medio_pago:   data.medio_pago || 'efectivo',
      descripcion:  data.descripcion || '',
      usuario_id,
    }
    const res = await postCompra(payload)
    await get().fetchCompras(1, 20, get().corteIdFiltro)
    return res.data
  },

  editarCompra: async (id, data) => {
    const usuario_id = JSON.parse(localStorage.getItem('usuario') || '{}').id ?? 1
    const payload = {
      proveedor_id: data.id_proveedor,
      total:        data.costo_total,
      fecha:        data.fecha_compra,
      descripcion:  data.descripcion || '',
      usuario_id,
    }
    const res = await putCompra(id, payload)
    await get().fetchCompras(1, 20, get().corteIdFiltro)
    return res.data
  },

  eliminarCompra: async (id) => {
    await deleteCompra(id)
    await get().fetchCompras(1, 20, get().corteIdFiltro)
  },
}))

export default useComprasStore