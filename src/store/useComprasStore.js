import { create } from 'zustand'
import { getCompras, postCompra, putCompra, deleteCompra } from '@/api/compras_api'
import { getCortes } from '@/api/cortes_api'
import { payloadMedioPago } from '@/components/MedioPagoSelector'

// Mapea la respuesta del backend al shape que usa el frontend
const normalizar = (c) => ({
  ...c,
  id_compra:        c.id_compra        ?? c.id,
  id_proveedor:     c.id_proveedor     ?? c.proveedor_id,
  nombre_proveedor: c.nombre_proveedor ?? c.proveedor_nombre ?? '',
  costo_total:      c.costo_total      ?? c.total ?? 0,
  fecha_compra:     c.fecha_compra     ?? c.fecha ?? '',
})
let ultimaPeticion = 0   // ignora respuestas viejas del listado
const useComprasStore = create((set, get) => ({
  compras:       [],
  resumen:       { cantidad_compras: 0, total_gastado: 0 },   // global del corte, no depende de q ni de la página
  total:         0,
  pagina:        1,
  limite:        20,
  total_paginas: 0,
  cargando:      false,
  error:         null,
  corteIdFiltro: null,
  busqueda:      '',   // <- nuevo
  categoriaFiltro: '', // '' = todas | 'insumo' | 'domicilio' (filtra en el servidor)
  cortes:        [],

  // `categoria` undefined = conserva el filtro actual (los refrescos no lo pierden).
  fetchCompras: async (pagina = 1, limite = 5, corteId = null, busqueda = '', categoria = get().categoriaFiltro) => {
    set({ cargando: true, error: null, corteIdFiltro: corteId, busqueda, categoriaFiltro: categoria })
    const id = ++ultimaPeticion
    try {
      const res = await getCompras(pagina, limite, corteId, busqueda, categoria)
      if (id !== ultimaPeticion) return
      const raw = res.data
      set({
        resumen:       raw.resumen ?? { cantidad_compras: 0, total_gastado: 0 },
        compras:       (raw.compras ?? raw.datos ?? []).map(normalizar),
        total:         raw.total         ?? 0,
        pagina:        raw.pagina        ?? 1,
        limite:        raw.limite        ?? 20,
        total_paginas: raw.total_paginas ?? 1,
        cargando:      false,
      })
    } catch (err) {
      if (id !== ultimaPeticion) return
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

  crearCompra: async (data, medioPago) => {
    const payload = {
      proveedor_id: data.id_proveedor,
      total:        data.costo_total,
      fecha:        data.fecha_compra,
      ...payloadMedioPago(medioPago),
      descripcion:  data.descripcion || '',
      categoria:    data.categoria || 'insumo',
      // venta_id solo viaja con categoría 'domicilio' (con 'insumo' el backend exige que venga vacío).
      ...(data.categoria === 'domicilio' ? { venta_id: data.venta_id } : {}),
    }
    const res = await postCompra(payload)
    await get().fetchCompras(get().pagina, get().limite, get().corteIdFiltro, get().busqueda)
    return res.data
  },

  editarCompra: async (id, data, medioPago) => {
    const payload = {
      proveedor_id: data.id_proveedor,
      total:        data.costo_total,
      fecha:        data.fecha_compra,
      descripcion:  data.descripcion || '',
      ...payloadMedioPago(medioPago),
      categoria:    data.categoria || 'insumo',
      ...(data.categoria === 'domicilio' ? { venta_id: data.venta_id } : {}),
    }
    const res = await putCompra(id, payload)
    await get().fetchCompras(get().pagina, get().limite, get().corteIdFiltro, get().busqueda)
    return res.data
  },

  eliminarCompra: async (id) => {
    await deleteCompra(id)
    await get().fetchCompras(get().pagina, get().limite, get().corteIdFiltro, get().busqueda)
  },
}))

export default useComprasStore