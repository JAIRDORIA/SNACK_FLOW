import { create } from 'zustand'
import api from '@/api/axios'
import { getClientes } from '@/api/clientes_api'
import { getCortes } from '@/api/cortes_api'
import { getProductos } from '@/api/productos_api'

export const useNuevaVentaStore = create((set, get) => ({
  // Datos externos
  clientes: [],
  cortes: [],
  combos: [],
  productos: [],
  cargandoDatos: false,
  errorDatos: null,

  // Campos del formulario
  clienteId: '',
  corteId: '',
  fechaEntrega: '',
  horaEntrega: '',
  detalle: [],
  conAbono: false,
  montoAbono: 0,
  medioPago: 'efectivo',
  observacionAbono: '',

  // UI
  enviando: false,
  exito: false,
  errorMsg: '',

  // Cálculos (getters)
  totalVenta: () => {
    const { detalle } = get()
    return detalle.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0)
  },

  caso: () => {
    const { conAbono, montoAbono } = get()
    const total = get().totalVenta()
    if (!conAbono || montoAbono === 0) return 'sin_abono'
    if (montoAbono >= total) return 'pago_completo'
    return 'abono_parcial'
  },

  saldoPendiente: () => {
    const total = get().totalVenta()
    const { montoAbono, conAbono } = get()
    if (!conAbono) return 0
    return Math.max(0, total - montoAbono)
  },

  // Acciones para datos externos
  cargarDatos: async () => {

    set({ cargandoDatos: true, errorDatos: null })
    try {
      const [clientesRes, cortesRes, productosRes] = await Promise.all([
        getClientes(),
        getCortes(),
        getProductos(),
      ])

      // Extraer el array de clientes desde la propiedad 'items'
      const clientesData = clientesRes.data?.items || []
      // Para cortes y productos asumimos que también vienen con 'items', si no, ajusta
      const cortesTodos = cortesRes.data?.datos || []
      const productosData = productosRes.data?.datos || []
      const cortesFiltrados = cortesTodos.filter(c => c.estado === 'abierto' || c.estado === 'futuro')
      const corteAbierto = cortesFiltrados.find(c => c.estado === 'abierto')

      set({
        clientes: clientesData,
        cortes: cortesFiltrados,
        productos: productosData,
        corteId: corteAbierto?.id || '',
        cargandoDatos: false,
      })
    } catch (err) {
      console.error('Error al cargar datos', err)
      set({ errorDatos: 'No se pudieron cargar clientes/cortes/productos', cargandoDatos: false })
    }
  },
  cargarCombos: async () => {
  try {
    const res = await api.get('/combos/', { params: { page: 1, per_page: 50 } });
    const data = res.data;
    const combosData = Array.isArray(data) ? data : data.items || data.datos || [];
    set({ combos: combosData });
    console.log('Combos cargados:', combosData);
  } catch (err) {
    console.error('Error al cargar combos', err);
  }
},

  // Setters de campos
  setClienteId: (id) => set({ clienteId: id }),
  setCorteId: (id) => set({ corteId: id }),
  setFechaEntrega: (fecha) => set({ fechaEntrega: fecha }),
  setHoraEntrega: (hora) => set({ horaEntrega: hora }),
  setConAbono: (val) => set({ conAbono: val }),
  setMontoAbono: (monto) => set({ montoAbono: monto }),
  setMedioPago: (medio) => set({ medioPago: medio }),
  setObservacionAbono: (obs) => set({ observacionAbono: obs }),
agregarItem: (item) => {
  set((state) => ({ detalle: [...state.detalle, item] }));
},
  // Manejo del detalle
  agregarProducto: (productoId, nombreProducto, cantidad, precioUnitario) => {
  get().agregarItem({
    tipo: 'producto',
    producto_id: productoId,
    combo_id: null,
    nombre_producto: nombreProducto,
    cantidad: cantidad,
    precio_unitario: precioUnitario,
  });
},
  eliminarProducto: (index) => {
    set((state) => ({ detalle: state.detalle.filter((_, i) => i !== index) }))
  },

  // Acción de pago total
  pagarTotal: () => {
    const total = get().totalVenta()
    set({ montoAbono: total })
  },

  // Resetear formulario
  resetFormulario: () => {
    set({
      clienteId: '',
      fechaEntrega: '',
      horaEntrega: '',
      detalle: [],
      conAbono: false,
      montoAbono: 0,
      medioPago: 'efectivo',
      observacionAbono: '',
      enviando: false,
      exito: false,
      errorMsg: '',
    })
  },

  // Enviar venta
  registrarVenta: async () => {
    const { clienteId, corteId, fechaEntrega, horaEntrega, detalle, conAbono, montoAbono, medioPago, observacionAbono } = get()
    const total = get().totalVenta()
    const totalRedondeado = Math.round(total * 100) / 100

    // Validaciones
    if (!clienteId || !corteId || !fechaEntrega || detalle.length === 0) {
      set({ errorMsg: 'Completa todos los campos requeridos (cliente, corte, fecha, al menos un producto).' })
      return false
    }
    if (conAbono && montoAbono > total) {
      set({ errorMsg: 'El monto abonado no puede superar el total de la venta.' })
      return false
    }

    set({ enviando: true, errorMsg: '' })

    // Formatear fecha de entrega de YYYY-MM-DD a DD/MM/YYYY
    // Formatear fecha de entrega: YYYY-MM-DD HH:MM:SS
    const horaConSegundos = horaEntrega ? `${horaEntrega}:00` : '00:00:00'
    const fechaFormateada = `${fechaEntrega} ${horaConSegundos}`

    const payload = {
      cliente_id: Number(clienteId),
      corte_id: Number(corteId),
      usuario_id: 1, // Reemplazar con el ID real del usuario logueado
      fecha_entrega: fechaFormateada,
      total: totalRedondeado,
      detalle: detalle.map((d) => ({
        tipo: d.tipo || 'producto', 
        producto_id: d.tipo === 'producto' ? d.producto_id : null,
        combo_id: d.tipo === 'combo' ? d.combo_id : null,   // ← nuevo
        nombre_producto: d.nombre_producto,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
      })),
    }

    // Agregar abono inicial si corresponde (caso 2 o 3)
    if (conAbono && montoAbono > 0) {
      const abonoInicial = {
        monto: Number(montoAbono), // asegurar que sea número
        medio_pago: medioPago,
      }
      // Solo agregar observacion si no está vacía
      if (observacionAbono.trim()) {
        abonoInicial.observacion = observacionAbono.trim()
      }
      payload.abono_inicial = abonoInicial
    }

    try {
      await api.post('/ventas/', payload, { headers: { 'Content-Type': 'application/json' } })
      set({ enviando: false, exito: true })
      return true
    } catch (err) {
      console.error('Error al crear venta', err)
      set({
        enviando: false,
        errorMsg: err.response?.data?.error || 'Error al registrar venta',
      })
      return false
    }
  },
}))

export default useNuevaVentaStore