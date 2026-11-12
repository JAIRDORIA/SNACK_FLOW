import { create } from 'zustand'
import { getVentasSerieDiaria } from '@/api/ventas_api'

let ultimaPeticion = 0   // ignora respuestas viejas si el modo cambia rápido

const useSerieDiariaStore = create((set, get) => ({
  modo:    'corte',   // 'corte' | 'dias'
  datos:   null,      // { modo, desde, hasta, dias: [{ fecha, total, cantidad }], total, cantidad }
  loading: false,
  error:   null,

  fetchSerieDiaria: async (modo = get().modo) => {
    const id = ++ultimaPeticion
    set({ modo, loading: true, error: null })
    try {
      const res = await getVentasSerieDiaria(modo, 30)
      if (id !== ultimaPeticion) return
      set({ datos: res.data, loading: false })
    } catch (err) {
      if (id !== ultimaPeticion) return

      // 404 = no existe corte abierto: estado vacío, no es un error visible.
      if (err.response?.status === 404) {
        set({ datos: null, error: null, loading: false })
        return
      }

      set({
        datos: null,
        error: err.response?.data?.mensaje || 'No se pudo cargar la serie de ventas',
        loading: false,
      })
    }
  },

  reset: () => { ultimaPeticion++; set({ modo: 'corte', datos: null, loading: false, error: null }) },
}))

export default useSerieDiariaStore
