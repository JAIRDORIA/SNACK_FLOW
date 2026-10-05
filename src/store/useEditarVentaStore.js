import { create } from 'zustand'
import axios from '@/api/axios'
import { getVentaDetalle } from '@/api/ventas_api'

const useEditarVentaStore = create((set, get) => ({
  // Datos de la venta
  ventaId: null,
  fechaEntrega: '',
  horaEntrega: '',
  detalle: [], // { tipo, producto_id, combo_id, nombre_producto, cantidad, precio_unitario, productos? }

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
          // FIX: antes esto se perdia por completo. Sin esto, un combo
          // personalizado que el admin no toca al editar la venta se
          // reenviaba como si nunca hubiera tenido composicion propia.
          productos: d.es_combo === 1 ? (d.combo_productos || null) : null,
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
  // Actualizar la composicion de un combo del detalle.
  // - productos = null  -> se queda como combo de catalogo (combo_id intacto).
  // - productos = array -> combo personalizado (combo_id = null).
  // Nunca deben coexistir combo_id con valor y productos.
  actualizarComposicionCombo: (index, productos) => {
    set((state) => {
      const detalle = [...state.detalle]
      const item = detalle[index]
      if (!item) return { detalle }

      const esPersonalizado = Array.isArray(productos) && productos.length > 0
      detalle[index] = {
        ...item,
        productos: esPersonalizado ? productos : null,
        combo_id: esPersonalizado ? null : item.combo_id,
      }
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
      if (item.tipo === 'combo' && Array.isArray(item.productos) && item.productos.length === 0) {
        set({ error: `El combo "${item.nombre_producto}" debe tener al menos un producto en su composición` })
        return false
      }
    }

    set({ cargando: true, error: null })

    try {
      await axios.put(`/ventas/${ventaId}/detalle`, {
        detalle: detalle.map(d => {
          const item = {
            tipo: d.tipo || 'producto',
            producto_id: d.tipo === 'combo' ? null : d.producto_id,
            combo_id: d.tipo === 'combo' ? d.combo_id : null,
            nombre_producto: d.nombre_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
          }
          // FIX: reenviar la composicion personalizada cuando exista, para
          // que actualizar_detalle_venta no la borre al reinsertar la linea.
          if (d.tipo === 'combo' && Array.isArray(d.productos) && d.productos.length > 0) {
            item.productos = d.productos
          }
          return item
        })
      })

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