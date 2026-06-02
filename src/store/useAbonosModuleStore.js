import { create } from 'zustand'
import { getAbonos, crearAbono, eliminarAbono } from '@/api/abonos_api'

const useAbonosModuleStore = create((set, get) => ({
  abonos: [],
  total: 0,
  pagina: 1,
  totalPaginas: 1,
  cargando: false,
  error: null,

  fetchAbonos: async (pagina = 1, limite = 20) => {
    set({ cargando: true, error: null })
    try {
      const res = await getAbonos(pagina, limite)
      set({
        abonos: res.data.datos || [],
        total: res.data.total,
        pagina: res.data.pagina,
        totalPaginas: res.data.total_paginas,
        cargando: false,
      })
    } catch (err) {
      set({ error: 'Error al cargar abonos', cargando: false })
    }
  },

  crearAbono: async (payload) => {
    const res = await crearAbono(payload)
    return res.data
  },

  eliminarAbono: async (id) => {
    await eliminarAbono(id)
  },
}))

export default useAbonosModuleStore