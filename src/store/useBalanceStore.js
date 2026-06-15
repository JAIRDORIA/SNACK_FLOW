import { create } from 'zustand'
import { getBalance, getHistorialCortes, cerrarCorte } from '@/api/balance_api'
import { getCortes } from '@/api/cortes_api'
import { getVentas } from '@/api/ventas_api'
import { getCompras } from '@/api/compras_api'
import axios from '@/api/axios'

const useBalanceStore = create((set, get) => ({
  // Datos del balance actual
  balance: null,
  historial: [],

  // Estados de UI
  cargandoBalance: false,
  cargandoHistorial: false,
  cerrandoCorte: false,
  error: null,
  exitoCierre: false,
  resumenFuturo: null,
  cargandoFuturo: false,
  errorFuturo: null,
  ventasPendientesAnteriores: [],
  ventasFuturo: [],           // Lista de ventas del corte futuro
cargandoVentasFuturo: false,
cargandoVentasPendientes: false,
errorVentasPendientes: null,
detalleCorte: null,
cargandoDetalleCorte: false,
errorDetalleCorte: null,

  // Acciones
  fetchVentasPendientesAnteriores: async () => {
  set({ cargandoVentasPendientes: true, errorVentasPendientes: null })
  try {
    // Obtener todas las ventas activas (sin filtrar por corte)
    const res = await axios.get('/ventas/?limite=200/') // Ajusta el límite si es necesario
    const todas = res.data?.datos || []
    const corteActual = get().balance?.corte_id

    // Filtrar: saldo pendiente > 0 y corte diferente al actual
    const pendientes = todas.filter(v => 
      v.saldo_pendiente > 0 && v.corte_id !== corteActual
    )
    set({ ventasPendientesAnteriores: pendientes, cargandoVentasPendientes: false })
  } catch (err) {
    set({ errorVentasPendientes: 'Error al cargar ventas pendientes', cargandoVentasPendientes: false })
  }
},
  fetchBalance: async () => {
    set({ cargandoBalance: true, error: null })
    try {
      const res = await getBalance()
      set({ balance: res.data, cargandoBalance: false })
    } catch (err) {
      set({ error: 'Error al cargar el balance', cargandoBalance: false })
    }
  },


fetchDetalleCorte: async (corteId) => {
  set({ cargandoDetalleCorte: true, errorDetalleCorte: null, detalleCorte: null })
  try {
    const [ventasRes, comprasRes] = await Promise.all([
      getVentas(corteId),
      getCompras(corteId)
    ])
    
    const ventas = ventasRes.data?.datos || []
    const compras = comprasRes.data?.datos || []
    const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0)
    const totalCompras = compras.reduce((sum, c) => sum + (c.total || 0), 0)
    
    set({
      detalleCorte: {
        corteId,
        ventas,
        compras,
        totalVentas,
        totalCompras,
        utilidad: totalVentas - totalCompras
      },
      cargandoDetalleCorte: false
    })
  } catch (err) {
    set({ errorDetalleCorte: 'Error al cargar detalle del corte', cargandoDetalleCorte: false })
  }
},
  // Obtener resumen del corte futuro
  fetchResumenFuturo: async () => {
    set({ cargandoFuturo: true, errorFuturo: null })
    try {
      // Obtener todos los cortes y filtrar el futuro
      const cortesRes = await getCortes()
      const cortesData = cortesRes.data?.datos || []
      const corteFuturo = cortesData.find(c => c.estado === 'futuro')

      if (!corteFuturo) {
        set({ resumenFuturo: null, cargandoFuturo: false })
        return
      }

      // Obtener ventas de ese corte futuro
      const ventasRes = await getVentas(1,100,corteFuturo.id)
      const ventas = ventasRes.data?.datos  || []
      const totalVentasFuturo = ventas.reduce((sum, v) => sum + (v.total || 0), 0)
      const totalPagado = parseFloat(corteFuturo.saldo_inicial || 0)

      set({
        resumenFuturo: {
          id: corteFuturo.id,
          numero: corteFuturo.numero,
          fecha_inicio: corteFuturo.fecha_inicio,
          total_ventas: totalVentasFuturo,
          total_pagado: totalPagado,
          // Puedes agregar más campos si el backend los devuelve
        },
        ventasFuturo: ventas,
        cargandoFuturo: false,
      })
    } catch (err) {
      set({ errorFuturo: 'Error al cargar resumen del corte futuro', cargandoFuturo: false })
    }
  },

  fetchHistorial: async () => {
    set({ cargandoHistorial: true, error: null })
    try {
      const res = await getHistorialCortes()
      // El backend debe devolver un array, si viene paginado, usa res.data.datos o res.data.items
      const historialData = res.data?.datos || res.data?.items || res.data || []
      set({ historial: historialData.slice(0, 5), cargandoHistorial: false })
    } catch (err) {
      set({ error: 'Error al cargar el historial', cargandoHistorial: false })
    }
  },

  cerrarCorteActual: async () => {
  set({ cerrandoCorte: true, error: null, exitoCierre: false })
  try {
    await cerrarCorte()   // sin argumentos
    set({ cerrandoCorte: false, exitoCierre: true })
    // Refrescar balance e historial después del cierre
    get().fetchBalance()
    get().fetchHistorial()
    return true
  } catch (err) {
    set({
      cerrandoCorte: false,
      error: err.response?.data?.mensaje || 'Error al cerrar el corte',
    })
    return false
  }
},

  // Limpiar mensaje de éxito
  resetExitoCierre: () => set({ exitoCierre: false }),
}))

export default useBalanceStore