import { create } from 'zustand'
import axios from '@/api/axios'
import { getVentaDetalle } from '@/api/ventas_api'

const useEditarVentaStore = create((set, get) => ({
  // Datos de la venta
  ventaId: null,
  fechaEntrega: '',
  horaEntrega: '',
  detalle: [], // { tipo, producto_id, combo_id, nombre_producto, cantidad, precio_unitario, productos? }
  // Domicilio: valor actual, valor con el que se cargó (para enviarlo solo si
  // cambió) y montos ya pagados que limitan la edición.
  valorDomicilio: 0,
  valorDomicilioOriginal: 0,
  domicilioPagado: 0,
  productosPagado: 0,

  // UI
  cargando: false,
  error: null,
  exito: false,

  // Setters
  setVentaId: (id) => set({ ventaId: id }),
  setFechaEntrega: (f) => set({ fechaEntrega: f }),
  setHoraEntrega: (h) => set({ horaEntrega: h }),
  setValorDomicilio: (v) => set({ valorDomicilio: Number(v) || 0 }),

  // Cargar datos de la venta a editar
  cargarVenta: async (id) => {
    set({ cargando: true, error: null, exito: false })
    try {
      const res = await getVentaDetalle(id)
      const data = res.data
      const [fecha, hora] = (data.fecha_entrega || '').split(' ')
      const valorDomicilio = Number(data.valor_domicilio) || 0
      set({
        ventaId: id,
        fechaEntrega: fecha || '',
        horaEntrega: hora?.slice(0, 5) || '', // HH:MM
        valorDomicilio,
        valorDomicilioOriginal: valorDomicilio,
        domicilioPagado: Number(data.domicilio_pagado) || 0,
        productosPagado: Number(data.productos_pagado) || 0,
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

  // Subtotal de productos (sin domicilio)
  subtotalProductos: () => {
    return get().detalle.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0)
  },

  // Calcular nuevo total = productos + domicilio
  totalActual: () => {
    return get().subtotalProductos() + (Number(get().valorDomicilio) || 0)
  },

  // Guardar cambios
  guardarCambios: async () => {
    const {
      ventaId, fechaEntrega, horaEntrega, detalle,
      valorDomicilio, valorDomicilioOriginal, domicilioPagado, productosPagado,
    } = get()
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

    // Domicilio: >= 0, máximo 2 decimales y tope 1.000.000. No puede bajar de
    // lo que el cliente ya pagó por el domicilio.
    const domicilioNum = Number(valorDomicilio) || 0
    if (!Number.isFinite(domicilioNum) || domicilioNum < 0 || domicilioNum > 1000000) {
      set({ error: 'El valor del domicilio debe estar entre 0 y 1.000.000' })
      return false
    }
    if (domicilioNum < (Number(domicilioPagado) || 0)) {
      set({
        error: `El domicilio no puede ser menor a lo ya pagado ($${(Number(domicilioPagado) || 0).toLocaleString('es-CO')})`,
      })
      return false
    }
    if (get().subtotalProductos() < (Number(productosPagado) || 0)) {
      set({
        error: `El subtotal de productos no puede ser menor a lo ya pagado ($${(Number(productosPagado) || 0).toLocaleString('es-CO')})`,
      })
      return false
    }

    set({ cargando: true, error: null })

    try {
      const body = {
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
      }

      // Solo se envía si el usuario lo modificó; ausente = conservar el actual.
      const domicilioRedondeado = Math.round(domicilioNum * 100) / 100
      const originalRedondeado = Math.round((Number(valorDomicilioOriginal) || 0) * 100) / 100
      if (domicilioRedondeado !== originalRedondeado) {
        body.valor_domicilio = domicilioRedondeado
      }

      await axios.put(`/ventas/${ventaId}/detalle`, body)

      const horaConSegundos = horaEntrega ? `${horaEntrega}:00` : '00:00:00'
      const nuevaFecha = `${fechaEntrega} ${horaConSegundos}`
      await axios.put(`/ventas/${ventaId}`, { fecha_entrega: nuevaFecha })

      set({
        cargando: false,
        exito: true,
        valorDomicilio: domicilioRedondeado,
        valorDomicilioOriginal: domicilioRedondeado,
      })
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
    valorDomicilio: 0,
    valorDomicilioOriginal: 0,
    domicilioPagado: 0,
    productosPagado: 0,
    cargando: false,
    error: null,
    exito: false,
  }),
}))

export default useEditarVentaStore