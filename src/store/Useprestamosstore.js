import { create } from 'zustand'
import { listarPrestamos, crearPrestamo, abonarPrestamo, listarPagosPrestamo } from '../api/prestamos_api'
import { payloadMedioPago } from '@/components/MedioPagoSelector'

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
      // `data` trae medio_pago y medio_pago_id; se envía el id solo cuando es
      // transferencia con cuenta.
      const payload = {
        cliente_id: data.cliente_id,
        monto: data.monto,
        ...payloadMedioPago(data),
        observacion: data.observacion ?? null,
      }
      const res = await crearPrestamo(payload)
      set((state) => ({ prestamos: [res.data.datos, ...state.prestamos] }))
      return { ok: true, datos: res.data.datos }
    } catch (err) {
      return {
        ok: false,
        mensaje:
          err.response?.data?.mensaje ||
          err.response?.data?.error ||
          'Error al registrar el prestamo',
      }
    }
  },

  // data: { monto, medio_pago, medio_pago_id, observacion }
  abonar: async (prestamoId, data) => {
    try {
      // Se envía medio_pago_id solo cuando es transferencia con cuenta.
      const payload = {
        monto: data.monto,
        ...payloadMedioPago(data),
        observacion: data.observacion ?? null,
      }
      const res = await abonarPrestamo(prestamoId, payload)
      set((state) => ({
        prestamos: state.prestamos.map((p) => (p.id === prestamoId ? res.data.datos : p)),
      }))
      return { ok: true, datos: res.data.datos }
    } catch (err) {
      return {
        ok: false,
        mensaje:
          err.response?.data?.mensaje ||
          err.response?.data?.error ||
          'Error al registrar el abono',
      }
    }
  },

  obtenerHistorialAbonos: async (prestamoId) => {
    try {
      const res = await listarPagosPrestamo(prestamoId)
      return { ok: true, datos: res.data }
    } catch (err) {
      return { ok: false, mensaje: err.response?.data?.mensaje || 'Error al cargar el historial' }
    }
  },
}))