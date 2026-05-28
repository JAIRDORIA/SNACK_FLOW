import { create } from 'zustand'
import { getAbonosPorVentas } from '@/api/abonos_api'

const useAbonosStore = create((set, get) => ({
  // Diccionario: venta_id → medio_pago (extraído del primer abono)
  medioPagoPorVenta: {},

  // Carga los abonos para un lote de IDs, solo si no están en caché
  cargarAbonos: async (ventaIds) => {

    const existentes = get().medioPagoPorVenta
    const faltantes = ventaIds.filter(id => !(id in existentes))

    if (faltantes.length === 0) return

    try {
      const data = await getAbonosPorVentas(faltantes)
       

      const nuevosMedios = {}
      data.forEach(({ venta_id, abonos }) => {
        
        const primerAbono = abonos[0]
        nuevosMedios[venta_id] = primerAbono?.medio_pago || 'sin_pago'
      })


        
      set({ medioPagoPorVenta: { ...existentes, ...nuevosMedios } })
    } catch (error) {
      console.error('Error al cargar tipos de pago:', error)
      // En caso de error, marcamos como 'error' para no reintentar infinitamente
      const fallidos = Object.fromEntries(faltantes.map(id => [id, 'error']))
      set({ medioPagoPorVenta: { ...existentes, ...fallidos } })
    }
  },

  // Obtiene el medio de pago para una venta (o 'sin_pago' si aún no se ha cargado)
  getMedioPago: (ventaId) => {
    return get().medioPagoPorVenta[ventaId] || 'sin_pago'
  }
}))

export default useAbonosStore