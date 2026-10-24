import { useState, useEffect, useRef } from 'react'
import { X, Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '@/api/axios'
import useAbonosModuleStore from '@/store/useAbonosModuleStore'
import useBalanceStore from '@/store/useBalanceStore'
import { getClientes } from '@/api/clientes_api'
import MedioPagoSelector, {
  medioPagoValido,
  payloadMedioPago,
} from '@/components/MedioPagoSelector'

export default function NuevoAbonoModal({ open, onClose, onAbonoCreado }) {
  const [clientes, setClientes] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [ventasCliente, setVentasCliente] = useState([])
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [monto, setMonto] = useState(0)
  const [medioPago, setMedioPago] = useState({ medio_pago: 'efectivo', medio_pago_id: null })
  // Pago del domicilio: monto y medio independientes de los productos.
  const [montoDomicilio, setMontoDomicilio] = useState(0)
  const [medioPagoDomicilio, setMedioPagoDomicilio] = useState({ medio_pago: 'efectivo', medio_pago_id: null })
  const [observacion, setObservacion] = useState('')
  const [cargandoVentas, setCargandoVentas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  // Error de la cuenta de transferencia: se muestra bajo el selector.
  const [errorMedioPago, setErrorMedioPago] = useState('')
  const [errorMedioPagoDomicilio, setErrorMedioPagoDomicilio] = useState('')
  // Aviso cuando el abono de productos ya se registró y falló el del domicilio.
  const [avisoParcial, setAvisoParcial] = useState('')
  const [exito, setExito] = useState(false)

  const { crearAbono } =useAbonosModuleStore()
  const { balance, fetchBalance,fetchResumenFuturo,resumenFuturo } = useBalanceStore()

  // Al abrir/cerrar el modal: ya no carga 200 clientes de una vez
useEffect(() => {
  if (open) {
    if (!balance) fetchBalance()
    if (!resumenFuturo) fetchResumenFuturo()
  } else {
    setBusquedaCliente('')
    setClienteSeleccionado(null)
    setClientes([])
    setVentasCliente([])
    setVentaSeleccionada(null)
    setMonto(0)
    setMontoDomicilio(0)
    setMedioPago({ medio_pago: 'efectivo', medio_pago_id: null })
    setMedioPagoDomicilio({ medio_pago: 'efectivo', medio_pago_id: null })
    setObservacion('')
    setError('')
    setErrorMedioPago('')
    setErrorMedioPagoDomicilio('')
    setAvisoParcial('')
    setExito(false)
  }
}, [open])

// Busqueda de clientes en el backend, con debounce
useEffect(() => {
  if (!open || !busquedaCliente || clienteSeleccionado) {
    setClientes([])
    return
  }
  const timer = setTimeout(() => {
    getClientes(1, 20, busquedaCliente)
      .then(res => setClientes(res.data.items || res.data.datos || []))
      .catch(() => {})
  }, 300)
  return () => clearTimeout(timer)
}, [busquedaCliente, open, clienteSeleccionado])

  const clientesFiltrados = clientes

  // El modal se abre desde Abonos.jsx con las ventas del listado, que trae
  // valor_domicilio y domicilio_pendiente pero no productos_pendiente: se
  // deriva del saldo total.
  const valorDomicilioVenta = Number(ventaSeleccionada?.valor_domicilio) || 0
  const domicilioPendiente = Number(ventaSeleccionada?.domicilio_pendiente) || 0
  const productosPendiente = ventaSeleccionada
    ? (ventaSeleccionada.productos_pendiente != null
        ? Number(ventaSeleccionada.productos_pendiente) || 0
        : Math.max(0, (Number(ventaSeleccionada.saldo_pendiente) || 0) - domicilioPendiente))
    : 0

  const mensajeDeError = (err, fallback) =>
    err.response?.data?.mensaje || err.response?.data?.error || fallback

  // Tras un fallo parcial se recargan las ventas del cliente para reflejar el
  // abono que sí quedó registrado y dejar el domicilio pendiente para reintentar.
  const recargarVenta = async (idVenta) => {
    if (!clienteSeleccionado) return null
    try {
      const res = await api.get(`/ventas/?cliente_id=${clienteSeleccionado.ID_Cliente}&limite=50`)
      const pendientes = (res.data.datos || []).filter(v =>
        v.saldo_pendiente > 0 && v.estado !== 'anulada'
      )
      setVentasCliente(pendientes)
      const actual = pendientes.find(v => String(v.id_venta) === String(idVenta)) || null
      setVentaSeleccionada(actual)
      setMonto(0)
      setMontoDomicilio(actual ? Number(actual.domicilio_pendiente) || 0 : 0)
      return actual
    } catch {
      // Si falla la recarga, al menos se limpia el monto ya registrado.
      setMonto(0)
      return null
    }
  }

  const seleccionarCliente = async (cliente) => {
  setClienteSeleccionado(cliente)
  setBusquedaCliente('')
  setVentaSeleccionada(null)
  setMonto(0)
  setMontoDomicilio(0)
  setCargandoVentas(true)
  setError('')
  setAvisoParcial('')
  try {
    // El backend ya filtra por cliente_id -- usamos el ID real de este objeto
    const res = await api.get(`/ventas/?cliente_id=${cliente.ID_Cliente}&limite=50`)
    const pendientes = (res.data.datos || []).filter(v =>
      v.saldo_pendiente > 0 && v.estado !== 'anulada'
    )
    console.log('primera venta:', pendientes[0])
    setVentasCliente(pendientes)
  } catch (err) {
    setError('Error al cargar ventas del cliente')
    setVentasCliente([])
  } finally {
    setCargandoVentas(false)
  }
}

  const handleSubmit = async () => {
    if (!ventaSeleccionada || enviando) return

    const montoProductos = Number(monto) || 0
    const montoDom = Number(montoDomicilio) || 0
    if (montoProductos <= 0 && montoDom <= 0) {
      setError('Ingresa al menos un monto mayor a 0')
      return
    }
    if (montoProductos > productosPendiente) {
      setError(`El pago de productos no puede superar los productos pendientes ($${productosPendiente.toLocaleString('es-CO')})`)
      return
    }
    if (montoDom > domicilioPendiente) {
      setError(`El pago del domicilio no puede superar el domicilio pendiente ($${domicilioPendiente.toLocaleString('es-CO')})`)
      return
    }
    // Transferencia sin cuenta: se valida por cada medio de pago.
    let hayErrorMedio = false
    if (montoProductos > 0 && !medioPagoValido(medioPago)) {
      setErrorMedioPago('Selecciona la cuenta de transferencia')
      hayErrorMedio = true
    }
    if (montoDom > 0 && !medioPagoValido(medioPagoDomicilio)) {
      setErrorMedioPagoDomicilio('Selecciona la cuenta de transferencia')
      hayErrorMedio = true
    }
    if (hayErrorMedio) return

    setEnviando(true)
    setError('')
    setAvisoParcial('')
    setErrorMedioPago('')
    setErrorMedioPagoDomicilio('')

    const base = {
      venta_id: ventaSeleccionada.id_venta,
      corte_id: balance.corte_id,
      fecha: new Date().toISOString().slice(0, 10).split('-').reverse().join('/'),
      observacion: observacion || undefined,
    }

    try {
      // Productos primero. Si falla, no se intenta el domicilio.
      if (montoProductos > 0) {
        try {
          await crearAbono({
            ...base,
            monto: montoProductos,
            es_domicilio: false,
            ...payloadMedioPago(medioPago),
          })
        } catch (err) {
          setError(mensajeDeError(err, 'Error al crear el abono de productos'))
          return
        }
      }

      if (montoDom > 0) {
        try {
          await crearAbono({
            ...base,
            monto: montoDom,
            es_domicilio: true,
            ...payloadMedioPago(medioPagoDomicilio),
          })
        } catch (err) {
          // El abono de productos ya quedó registrado: se avisa, se recargan
          // los datos y se deja solo el domicilio pendiente para reintentar.
          setError(mensajeDeError(err, 'Error al crear el abono del domicilio'))
          if (montoProductos > 0) {
            setAvisoParcial(
              `El abono de productos por $${montoProductos.toLocaleString('es-CO')} SÍ quedó registrado. Revisa el domicilio pendiente e intenta de nuevo.`,
            )
          }
          await recargarVenta(ventaSeleccionada.id_venta)
          return
        }
      }

      setExito(true)
      setTimeout(() => {
        onAbonoCreado()
        onClose()
      }, 1000)
    } finally {
      setEnviando(false)
    }
  }

  if (!open) return null

  return (
    <div  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div  className="flex items-center justify-between border-b border-gray-100 bg-indigo-50 py-4 px-6">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Abono</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200">
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div  className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto p-6">
          {/* Buscar cliente */}
          {!clienteSeleccionado ? (
            <div>
              <label    className="text-sm font-semibold text-slate-700 block mb-1">Buscar cliente</label>
              <input
                type="text"
                value={busquedaCliente}
                onChange={e => setBusquedaCliente(e.target.value)}
                placeholder="Escriba el nombre del cliente..."
 
                className="w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 p-2"
              />
              {busquedaCliente && clientesFiltrados.length > 0 && (
                <div style={{ overflowY:"auto",maxHeight:"160px" }}  className="border rounded-lg max-h-40 overflow-y-auto mt-2">
                  {clientesFiltrados.map(c => (
                    <div
                      key={c.ID_Cliente}
                      onClick={() => seleccionarCliente(c)}
 
                      className="hover:bg-indigo-100 cursor-pointer text-sm py-2 px-4"
                    >
                      {c.Cli_Nombre}
                    </div>
                  ))}
                </div>
              )}
              {busquedaCliente && clientesFiltrados.length === 0 && (
      <div className="border rounded-lg text-sm text-slate-400 mt-2 py-2 px-4">
        No se encontraron clientes
      </div>
    )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Cliente: <strong>{clienteSeleccionado.Cli_Nombre}</strong>
                </span>
                <button onClick={() => setClienteSeleccionado(null)} className="text-indigo-600 text-xs hover:underline">
                  Cambiar
                </button>
              </div>

              {cargandoVentas ? (
                <div  className="flex justify-center pt-4 pb-4">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
              ) : ventasCliente.length === 0 ? (
                <p  className="text-sm text-gray-500 mt-2">No hay ventas pendientes para este cliente.</p>
              ) : (
                <div className="mt-3">
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Seleccione venta</label>
                  <select
                    value={ventaSeleccionada?.id_venta || ''}
                    onChange={e => {
                      const v = ventasCliente.find(v => v.id_venta == e.target.value)
                      setVentaSeleccionada(v)
                      const domPend = Number(v?.domicilio_pendiente) || 0
                      const prodPend = v
                        ? (v.productos_pendiente != null
                            ? Number(v.productos_pendiente) || 0
                            : Math.max(0, (Number(v.saldo_pendiente) || 0) - domPend))
                        : 0
                      setMonto(prodPend)
                      setMontoDomicilio(domPend)
                      setError('')
                      setAvisoParcial('')
                      setErrorMedioPago('')
                      setErrorMedioPagoDomicilio('')
                    }}

                    className="w-full border border-slate-200 rounded-lg text-sm p-2"
                  >
                    <option value="">-- Elegir venta --</option>
                    {ventasCliente.map(v => (
                      <option key={v.id_venta} value={v.id_venta}>
                        #{String(v.id_venta).padStart(3, '0')} - Total: ${v.total.toLocaleString('es-CO')} - Pendiente: ${v.saldo_pendiente.toLocaleString('es-CO')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {ventaSeleccionada && (
                <div className="bg-indigo-50 rounded-xl space-y-3 mt-4 p-4">
                  <div className="flex justify-between text-sm">
                    <span>Total venta</span>
                    <span className="font-semibold">${ventaSeleccionada.total.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Saldo pendiente</span>
                    <span className="font-semibold text-amber-600">${ventaSeleccionada.saldo_pendiente.toLocaleString('es-CO')}</span>
                  </div>

                  {valorDomicilioVenta > 0 && (
                    <div className="bg-white/70 border border-indigo-100 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Productos pendientes</span>
                        <span className="font-medium">${productosPendiente.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Domicilio pendiente</span>
                        <span className="font-medium">${domicilioPendiente.toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="monto-venta" className="block text-xs font-medium text-slate-600">
                      {valorDomicilioVenta > 0 ? 'Pagar venta' : 'Monto a abonar'}
                    </label>
                    <input
                      id="monto-venta"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={productosPendiente}
                      step="0.01"
                      value={monto}
                      onChange={e => setMonto(Number(e.target.value))}
                      disabled={enviando}
                      aria-describedby={valorDomicilioVenta > 0 ? 'productos-pendientes' : undefined}
                      className="w-full border border-slate-200 rounded-lg text-sm p-2"
                    />
                    {valorDomicilioVenta > 0 && (
                      <p id="productos-pendientes" className="text-xs text-slate-500">
                        Productos pendientes: ${productosPendiente.toLocaleString('es-CO')}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 m-0 mb-1">Medio de pago</p>
                    <MedioPagoSelector
                      value={medioPago}
                      onChange={(value) => {
                        setMedioPago(value)
                        if (errorMedioPago) setErrorMedioPago('')
                      }}
                      disabled={enviando}
                      error={errorMedioPago}
                    />
                  </div>

                  {domicilioPendiente > 0 && (
                    <div className="border-t border-indigo-100 pt-3 space-y-2">
                      <label htmlFor="monto-domicilio" className="block text-xs font-medium text-slate-600">
                        Pagar domicilio
                      </label>
                      <input
                        id="monto-domicilio"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={domicilioPendiente}
                        step="0.01"
                        value={montoDomicilio}
                        onChange={e => setMontoDomicilio(Number(e.target.value))}
                        disabled={enviando}
                        aria-describedby="domicilio-pendiente"
                        className="w-full border border-slate-200 rounded-lg text-sm p-2"
                      />
                      <p id="domicilio-pendiente" className="text-xs text-slate-500">
                        Domicilio pendiente: ${domicilioPendiente.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-slate-500 m-0 mb-1">Medio de pago</p>
                      <MedioPagoSelector
                        value={medioPagoDomicilio}
                        onChange={(value) => {
                          setMedioPagoDomicilio(value)
                          if (errorMedioPagoDomicilio) setErrorMedioPagoDomicilio('')
                        }}
                        disabled={enviando}
                        error={errorMedioPagoDomicilio}
                      />
                    </div>
                  )}

                  <label htmlFor="abono-observacion" className="block text-xs text-slate-500">Observación (opcional)</label>
                  <input
                    id="abono-observacion"
                    type="text"
                    value={observacion}
                    onChange={e => setObservacion(e.target.value)}
                    disabled={enviando}
                    className="w-full border border-slate-200 rounded-lg text-sm p-2"
                    placeholder="Ej. pago en caja"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {avisoParcial && (
            <div role="status" className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {avisoParcial}
            </div>
          )}
          {exito && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3">
              <CheckCircle2 size={16} /> Abono registrado correctamente
            </div>
          )}
        </div>

        <div  className="border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 py-4 px-6">
          <button onClick={onClose} disabled={enviando}
            className="px-5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={!ventaSeleccionada || enviando || (Number(monto) <= 0 && Number(montoDomicilio) <= 0)}

            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50 py-2 px-6">
            {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
            Registrar Abono
          </button>
        </div>
      </div>
    </div>
  )
}