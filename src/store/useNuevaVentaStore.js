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
  observacion: '',
  // Dirección SOLO para esta venta (opcional). No modifica la del cliente.
  direccionEntrega: '',
  // Dirección registrada del cliente seleccionado, para poder comparar y no
  // congelar una copia cuando el admin no la cambió.
  direccionClienteRegistrada: '',
  detalle: [],
  //conAbono: false,
  //montoAbono: 0,
  //medioPago: 'efectivo',
  //observacionAbono: '',

  // UI
  enviando: false,
  exito: false,
  errorMsg: '',


  abonosIniciales: [],

  agregarAbonoInicial: () => {
    set((state) => ({
      abonosIniciales: [
        ...state.abonosIniciales,
        { monto: 0, medio_pago: 'efectivo', observacion: '' }
      ]
    }))
  },
  eliminarAbonoInicial: (index) => {
    set((state) => ({
      abonosIniciales: state.abonosIniciales.filter((_, i) => i !== index)
    }))
  },
  modificarAbonoInicial: (index, campo, valor) => {
    set((state) => {
      const nuevos = [...state.abonosIniciales]
      nuevos[index] = { ...nuevos[index], [campo]: valor }
      return { abonosIniciales: nuevos }
    })
  },
  pagarCompleto: () => {
  const total = get().totalVenta();
  const abonos = get().abonosIniciales;

  // Si ya hay una fila vacía (monto 0), la reutilizamos
  const indiceVacio = abonos.findIndex(
    (a) => !a.monto || Number(a.monto) === 0
  );

  if (indiceVacio !== -1) {
    const nuevos = [...abonos];
    nuevos[indiceVacio] = {
      ...nuevos[indiceVacio],
      monto: total > 0 ? total : nuevos[indiceVacio].monto,
    };
    set({ abonosIniciales: nuevos });
    return;
  }

  // Si no, creamos una nueva fila con el total
  set({
    abonosIniciales: [
      ...abonos,
      {
        monto: total > 0 ? total : 0,
        medio_pago: 'efectivo',
        observacion: '',
      },
    ],
  });
},
  totalAbonado: () => {
    return get().abonosIniciales.reduce((sum, a) => sum + (a.monto || 0), 0)
  },
  // Cálculos (getters)
  totalVenta: () => {
    const { detalle } = get()
    return detalle.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0)
  },

  caso: () => {
    const total = get().totalVenta()
    const abonado = get().totalAbonado()
    if (abonado === 0) return 'sin_abono'
    if (abonado >= total) return 'pago_completo'
    return 'abono_parcial'
  },

  saldoPendiente: () => {
    const total = get().totalVenta()
    const abonado = get().totalAbonado()
    return Math.max(0, total - abonado)
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
      
    } catch (err) {
      console.error('Error al cargar combos', err);
    }
  },

  // Setters de campos
  setClienteId: (id) => set({ clienteId: id }),
  setCorteId: (id) => set({ corteId: id }),
  setFechaEntrega: (fecha) => set({ fechaEntrega: fecha }),
  setHoraEntrega: (hora) => set({ horaEntrega: hora }),
  setObservacion: (obs) => set({ observacion: obs }),
  setDireccionEntrega: (dir) => set({ direccionEntrega: dir ?? '' }),
  // Al cambiar de cliente se limpia la dirección del pedido para no arrastrar
  // la de un cliente anterior, y se guarda la registrada del nuevo cliente.
  setDireccionCliente: (dir) =>
    set({ direccionClienteRegistrada: dir ?? '', direccionEntrega: '' }),
  //setConAbono: (val) => set({ conAbono: val }),
  //setMontoAbono: (monto) => set({ montoAbono: monto }),
  //setMedioPago: (medio) => set({ medioPago: medio }),
  //setObservacionAbono: (obs) => set({ observacionAbono: obs }),


  agregarItem: (nuevoItem) => {
    set((state) => {
      // Buscar si ya existe un item del mismo tipo con el mismo id
      const index = state.detalle.findIndex((item) => {
        if (nuevoItem.tipo === 'combo' && item.tipo === 'combo') {
          return item.combo_id === nuevoItem.combo_id
        }
        if (nuevoItem.tipo === 'producto' && item.tipo === 'producto') {
          return item.producto_id === nuevoItem.producto_id
        }
        return false
      })

      if (index !== -1) {
        // Ya existe: sumamos la cantidad
        const nuevoDetalle = [...state.detalle]
        nuevoDetalle[index] = {
          ...nuevoDetalle[index],
          cantidad: nuevoDetalle[index].cantidad + nuevoItem.cantidad,
        }
        return { detalle: nuevoDetalle }
      }

      // No existe: se agrega como nuevo
      return { detalle: [...state.detalle, nuevoItem] }
    })
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
      observacion: '',
      direccionEntrega: '',
      direccionClienteRegistrada: '',
      detalle: [],
      abonosIniciales: [],
      enviando: false,
      exito: false,
      errorMsg: '',
    })
  },

  // Enviar venta
  registrarVenta: async () => {
    const { clienteId, corteId, fechaEntrega, horaEntrega,observacion, detalle, abonosIniciales, direccionEntrega, direccionClienteRegistrada } = get()
    const total = get().totalVenta()
    const totalRedondeado = Math.round(total * 100) / 100
    const totalAbonado = get().totalAbonado()
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
    // Validaciones
    if (!clienteId || !corteId || !fechaEntrega || detalle.length === 0) {
      set({ errorMsg: 'Completa todos los campos requeridos (cliente, corte, fecha, al menos un producto).' })
      return false
    }
    if (totalAbonado > total) {
      set({ errorMsg: 'La suma de los abonos no puede superar el total de la venta.' })
      return false
    }

    set({ enviando: true, errorMsg: '' })

    // Formatear fecha de entrega: YYYY-MM-DD HH:MM:SS
    const horaConSegundos = horaEntrega ? `${horaEntrega}:00` : '00:00:00'
    const fechaFormateada = `${fechaEntrega} ${horaConSegundos}`

    const payload = {
      cliente_id: Number(clienteId),
      corte_id: Number(corteId),
      usuario_id: usuario?.id,
      fecha_entrega: fechaFormateada,
      total: totalRedondeado,
      observacion: observacion?.trim() || null, 
      detalle: detalle.map((d) => {
        const item = {
          tipo: d.tipo || 'producto',
          producto_id: d.tipo === 'combo' ? null : d.producto_id,
          combo_id: d.tipo === 'combo' ? d.combo_id : null,
          nombre_producto: d.nombre_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        }
        // Si es combo personalizado, incluir la lista de productos
        if (d.tipo === 'combo' && d.productos && Array.isArray(d.productos)) {
          item.productos = d.productos
        }
        return item
      }),
    }

    // Agregar abonos iniciales (múltiples)
    const abonosValidos = abonosIniciales.filter(a => a.monto > 0)
    if (abonosValidos.length > 0) {
      payload.abonos_iniciales = abonosValidos.map(a => ({
        monto: Number(a.monto),
        medio_pago: a.medio_pago,
        observacion: a.observacion?.trim() || undefined
      }))
    }

    // Dirección solo para este pedido. Si viene vacía, o es la misma que la
    // registrada del cliente (ignorando mayúsculas y espacios extra), NO se
    // envía: la cocina seguirá usando la dirección del cliente y no se
    // congela una copia en la venta.
    const normalizar = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const dirPedido = (direccionEntrega || '').trim()
    if (dirPedido && normalizar(dirPedido) !== normalizar(direccionClienteRegistrada)) {
      payload.direccion_entrega = dirPedido
    }

    try {
      await api.post('/ventas/', payload, { headers: { 'Content-Type': 'application/json' } })

      // Regla backend: si el cliente NO tenía dirección registrada y se envió
      // direccion_entrega, esa dirección quedó guardada también en el cliente.
      // Reflejarlo en la lista en caché para que no siga mostrándose "sin dirección".
      if (payload.direccion_entrega && !(direccionClienteRegistrada || '').trim()) {
        const idCliente = Number(clienteId)
        set({
          clientes: get().clientes.map((c) =>
            Number(c.id ?? c.ID_Cliente) === idCliente
              ? { ...c, direccion: dirPedido, Cli_Direccion: dirPedido }
              : c
          ),
          direccionClienteRegistrada: dirPedido,
        })
      }

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