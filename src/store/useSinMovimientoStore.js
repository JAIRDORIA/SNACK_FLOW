import { create } from 'zustand'
import { getProductosSinMovimiento } from '@/api/productos_api'

let ultimaPeticion = 0   // ignora respuestas viejas si el filtro cambia rápido

const useSinMovimientoStore = create((set, get) => ({
  dias:     15,
  datos:    null,   // { dias, desde, hasta, limite, total, productos }
  loading:  false,
  error:    null,

  fetchSinMovimiento: async (dias = get().dias) => {
    const id = ++ultimaPeticion
    set({ dias, loading: true, error: null })
    try {
      const res = await getProductosSinMovimiento(dias, 5)
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

  reset: () => { ultimaPeticion++; set({ dias: 15, datos: null, loading: false, error: null }) },
}))

export default useSinMovimientoStore
