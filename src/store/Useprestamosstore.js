import { create } from 'zustand'
import { listarPrestamos, crearPrestamo, abonarPrestamo, listarPagosPrestamo } from '../api/prestamos_api'
import { payloadMedioPago } from '@/components/MedioPagoSelector'

// Descarta respuestas que llegaron tarde (el usuario cambió de página o de
// búsqueda antes de que terminara la petición anterior).
let fetchSeq = 0

export const usePrestamosStore = create((set, get) => ({
  prestamos: [],
  total: 0,
  pagina: 1,
  limite: 20,
  total_paginas: 0,
  loading: false,
  error: null,
  filtroEstado: '',
  busqueda: '',
  resumen: { total_prestado: 0, total_abonado: 0, saldo_por_cobrar: 0, pendientes: 0, pagados: 0 },

  setFiltroEstado: (estado) => {
    set({ filtroEstado: estado, pagina: 1 })
    get().fetchPrestamos(1)
  },

  setBusqueda: (q) => {
    const busqueda = String(q ?? '').trim()
    if (busqueda === get().busqueda) return
    set({ busqueda, pagina: 1 })
    get().fetchPrestamos(1)
  },

  fetchPrestamos: async (pagina = get().pagina) => {
    const seq = ++fetchSeq
    const { filtroEstado, busqueda, limite } = get()
    set({ loading: true, error: null })
    try {
      const res = await listarPrestamos({
        pagina,
        limite,
        q: busqueda,
        estado: filtroEstado || undefined,
      })
      if (seq !== fetchSeq) return
      const data = res.data || {}
      set({
        prestamos: data.datos ?? [],
        total: data.total ?? 0,
        pagina: data.pagina ?? pagina,
        limite: data.limite ?? limite,
        total_paginas: data.total_paginas ?? 0,
        loading: false,
         resumen: data.resumen ?? get().resumen,
      })
    } catch (err) {
      if (seq !== fetchSeq) return
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
      const creado = res.data.datos
      set((state) => {
        const visible = !state.filtroEstado || state.filtroEstado === creado.estado
        const nuevoTotal = state.total + 1
        return {
          prestamos:
            visible && state.pagina === 1
              ? [creado, ...state.prestamos].slice(0, state.limite)
              : state.prestamos,
          total: nuevoTotal,
          total_paginas: Math.ceil(nuevoTotal / state.limite),
          resumen: {
            ...state.resumen,
            total_prestado: state.resumen.total_prestado + (creado.monto || 0),
            saldo_por_cobrar: state.resumen.saldo_por_cobrar + (creado.saldo_pendiente || 0),
            pendientes: state.resumen.pendientes + 1,
          },
        }
      })
      return { ok: true, datos: creado }
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
        resumen: (() => {
          const monto = Number(data.monto) || 0
          const quedoPagado = res.data.datos?.estado === 'pagado'
          return {
            ...state.resumen,
            total_abonado: state.resumen.total_abonado + monto,
            saldo_por_cobrar: Math.max(0, state.resumen.saldo_por_cobrar - monto),
            pendientes: state.resumen.pendientes - (quedoPagado ? 1 : 0),
            pagados: state.resumen.pagados + (quedoPagado ? 1 : 0),
          }
        })(),
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
