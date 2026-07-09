import { create } from 'zustand'
import axios from '@/api/axios'
import { getVentaDetalle } from '@/api/ventas_api'

const useEditarVentaStore = create((set, get) => ({
  // Datos de la venta
  ventaId: null,
  fechaEntrega: '',
  horaEntrega: '',
  detalle: [], // { producto_id, nombre_producto, cantidad, precio_unitario }

  // UI
  cargando: false,
  error: null,
  exito: false,

  // Setters
  setVentaId: (id) => set({ ventaId: id }),
  setFechaEntrega: (f) => set({ fechaEntrega: f }),
  setHoraEntrega: (h) => set({ horaEntrega: h }),

  // Cargar datos de la venta a editar
  cargarVenta: async (id) => {
    set({ cargando: true, error: null, exito: false })
    try {
      const res = await getVentaDetalle(id)
      const data = res.data
      // Separar fecha y hora
      const [fecha, hora] = (data.fecha_entrega || '').split(' ')
      set({
        ventaId: id,
        fechaEntrega: fecha || '',
        horaEntrega: hora?.slice(0, 5) || '', // HH:MM
        detalle: (data.detalle || []).map(d => ({
          tipo: d.es_combo === 1 ? 'combo' : 'producto',
          producto_id: d.es_combo === 1 ? null : d.producto_id,
          combo_id: d.es_combo === 1 ? d.combo_id : null,
          nombre_producto: d.nombre_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        })),
        cargando: false,
      })
    } catch (err) {
      set({ error: 'Error al cargar la venta', cargando: false })
    }
  },

  // Modificar un producto del detalle
  modificarProducto: (index, campo, valor) => {
    set((state) => {
      const detalle = [...state.detalle]
      detalle[index] = { ...detalle[index], [campo]: valor }
      return { detalle }
    })
  },
  // Agregar nuevo producto
  agregarItem: (item) => {
    set((state) => ({ detalle: [...state.detalle, item] }))
  },

  // Eliminar producto
  eliminarProducto: (index) => {
    set((state) => ({
      detalle: state.detalle.filter((_, i) => i !== index),
    }))
  },

  // Calcular nuevo total
  totalActual: () => {
    return get().detalle.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0)
  },

  // Guardar cambios
  guardarCambios: async () => {
    const { ventaId, fechaEntrega, horaEntrega, detalle } = get()
    if (!ventaId) return false

    // Validar
    if (!fechaEntrega) {
      set({ error: 'La fecha de entrega es requerida' })
      return false
    }
    if (!detalle.length) {
      set({ error: 'Debe haber al menos un producto' })
      return false
    }
    for (const item of detalle) {
      if (item.cantidad <= 0 || item.precio_unitario <= 0) {
        set({ error: 'Cantidad y precio deben ser mayores a 0' })
        return false
      }
    }

    set({ cargando: true, error: null })

    try {
      // 1. Actualizar detalle
      await axios.put(`/ventas/${ventaId}/detalle`, {
        detalle: detalle.map(d => ({
          tipo: d.tipo || 'producto',
          producto_id: d.tipo === 'combo' ? null : d.producto_id,
          combo_id: d.tipo === 'combo' ? d.combo_id : null,
          nombre_producto: d.nombre_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        }))
      })

      // 2. Actualizar fecha si cambió (opcional)
      const horaConSegundos = horaEntrega ? `${horaEntrega}:00` : '00:00:00'
      const nuevaFecha = `${fechaEntrega} ${horaConSegundos}`
      await axios.put(`/ventas/${ventaId}`, { fecha_entrega: nuevaFecha })

      set({ cargando: false, exito: true })
      return true
    } catch (err) {
      set({
        cargando: false,
        error: err.response?.data?.mensaje || 'Error al guardar los cambios',
      })
      return false
    }
  },

  // Reset
  reset: () => set({
    ventaId: null,
    fechaEntrega: '',
    horaEntrega: '',
    detalle: [],
    cargando: false,
    error: null,
    exito: false,
  }),
}))

export default useEditarVentaStore