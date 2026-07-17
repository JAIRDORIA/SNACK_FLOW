import { create } from 'zustand'
import { listarPrestamos, crearPrestamo, pagarPrestamo } from '../api/prestamos_api'

export const usePrestamosStore = create((set, get) => ({
  prestamos: [],
  loading: false,
  error: null,
  filtroEstado: '',

  setFiltroEstado: (estado) => {
    set({ filtroEstado: estado })
    get().fetchPrestamos()
  },

  fetchPrestamos: async () => {
    set({ loading: true, error: null })
    try {
      const { filtroEstado } = get()
      const res = await listarPrestamos(filtroEstado || undefined)
      set({ prestamos: res.data, loading: false })
    } catch (err) {
      set({
        error: err.response?.data?.mensaje || 'Error al cargar los prestamos',
        loading: false,
      })
    }
  },

  nuevoPrestamo: async (data) => {
    try {
      const res = await crearPrestamo(data)
      set((state) => ({ prestamos: [res.data.datos, ...state.prestamos] }))
      return { ok: true, datos: res.data.datos }
    } catch (err) {
      return { ok: false, mensaje: err.response?.data?.mensaje || 'Error al registrar el prestamo' }
    }
  },

  // medio_pago: medio con el que el cliente esta pagando en este momento
  marcarPagado: async (id, usuario_id, medio_pago) => {
    try {
      const res = await pagarPrestamo(id, usuario_id, medio_pago)
      set((state) => ({
        prestamos: state.prestamos.map((p) => (p.id === id ? res.data.datos : p)),
      }))
      return { ok: true }
    } catch (err) {
      return { ok: false, mensaje: err.response?.data?.mensaje || 'Error al pagar el prestamo' }
    }
  },
}))