import { create } from 'zustand'
import { getAuditoria } from '@/api/auditoria_api'

const useAuditoriaStore = create((set, get) => ({
  registros: [],
  total: 0,
  pagina: 1,
  totalPaginas: 0,
  cargando: false,
  error: null,

  fetchAuditoria: async (pagina = 1, limite = 20) => {
    set({ cargando: true, error: null })
    try {
      const res = await getAuditoria(pagina, limite)
      set({
        registros: res.data.datos || [],
        total: res.data.total,
        pagina: res.data.pagina,
        totalPaginas: res.data.total_paginas,
        cargando: false,
      })
    } catch (err) {
      set({
        error: err.response?.data?.mensaje || 'Error al cargar auditoría',
        cargando: false,
      })
    }
  },
}))

export default useAuditoriaStore