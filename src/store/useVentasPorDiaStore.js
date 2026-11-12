import { create } from 'zustand'
import { getVentasPorDiaSemana } from '@/api/ventas_api'

let ultimaPeticion = 0   // ignora respuestas viejas si el filtro cambia rápido

const useVentasPorDiaStore = create((set, get) => ({
  semanas:  3,
  datos:    null,   // { semanas, desde, hasta, dias, mejor_dia }
  loading:  false,
  error:    null,

  fetchVentasPorDia: async (semanas = get().semanas) => {
    const id = ++ultimaPeticion
    set({ semanas, loading: true, error: null })
    try {
      const res = await getVentasPorDiaSemana(semanas)
      if (id !== ultimaPeticion) return
      set({ datos: res.data, loading: false })
    } catch (err) {
      if (id !== ultimaPeticion) return
      set({
        error: err.response?.data?.mensaje || 'No se pudo cargar la métrica',
        datos: null,
        loading: false,
      })
    }
  },

  reset: () => { ultimaPeticion++; set({ semanas: 3, datos: null, loading: false, error: null }) },
}))

export default useVentasPorDiaStore
