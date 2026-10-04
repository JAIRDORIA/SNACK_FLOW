import { useState, useEffect, useRef } from 'react'
import { X, Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '@/api/axios'
import useAbonosModuleStore from '@/store/useAbonosModuleStore'
import useBalanceStore from '@/store/useBalanceStore'
import { getClientes } from '@/api/clientes_api'

export default function NuevoAbonoModal({ open, onClose, onAbonoCreado }) {
  const [clientes, setClientes] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [ventasCliente, setVentasCliente] = useState([])
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [monto, setMonto] = useState(0)
  const [medioPago, setMedioPago] = useState('efectivo')
  const [observacion, setObservacion] = useState('')
  const [cargandoVentas, setCargandoVentas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
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
    setMedioPago('efectivo')
    setObservacion('')
    setError('')
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

  const seleccionarCliente = async (cliente) => {
  setClienteSeleccionado(cliente)
  setBusquedaCliente('')
  setVentaSeleccionada(null)
  setMonto(0)
  setCargandoVentas(true)
  setError('')
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
    if (!ventaSeleccionada || monto <= 0 || monto > ventaSeleccionada.saldo_pendiente) {
      setError('Monto inválido o superior al saldo pendiente')
      return
    }
    setEnviando(true)
    setError('')
    try {
      const payload = {
        venta_id: ventaSeleccionada.id_venta,
        corte_id: balance.corte_id,
        usuario_id: 1, // Cambiar por usuario real
        monto: monto,
        fecha: new Date().toISOString().slice(0, 10).split('-').reverse().join('/'),
        medio_pago: medioPago,
        observacion: observacion || undefined,
        
      }
      await crearAbono(payload)
      setExito(true)
      setTimeout(() => {
        onAbonoCreado()
        onClose()
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear abono')
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
                      setMonto(v.saldo_pendiente) // por defecto el total pendiente
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

                  <label className="block text-xs text-slate-500">Monto a abonar</label>
                  <input
                    type="number"
                    min={1}
                    max={ventaSeleccionada.saldo_pendiente}
                    value={monto}
                    onChange={e => setMonto(Number(e.target.value))}
 
                    className="w-full border border-slate-200 rounded-lg text-sm p-2"
                  />

                  <label className="block text-xs text-slate-500">Medio de pago</label>
                  <select value={medioPago} onChange={e => setMedioPago(e.target.value)}

                    className="w-full border border-slate-200 rounded-lg text-sm p-2">
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="otro">Otro</option>
                  </select>

                  <label className="block text-xs text-slate-500">Observación (opcional)</label>
                  <input
                    type="text"
                    value={observacion}
                    onChange={e => setObservacion(e.target.value)}

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
          <button onClick={handleSubmit} disabled={!ventaSeleccionada || enviando || monto <= 0}

            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50 py-2 px-6">
            {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
            Registrar Abono
          </button>
        </div>
      </div>
    </div>
  )
}