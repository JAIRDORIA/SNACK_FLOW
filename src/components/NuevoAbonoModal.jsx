import { useState, useEffect, useRef } from 'react'
import { X, Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '@/api/axios'
import useAbonosModuleStore from '@/store/useAbonosModuleStore'
import useBalanceStore from '@/store/useBalanceStore'

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

  useEffect(() => {
    if (open) {
      api.get('/clientes/').then(res => setClientes(res.data.items || res.data.datos || []))
      if (!balance) fetchBalance()
      if (!resumenFuturo) fetchResumenFuturo()
    } else {
      // Limpiar al cerrar
      setBusquedaCliente('')
      setClienteSeleccionado(null)
      setVentasCliente([])
      setVentaSeleccionada(null)
      setMonto(0)
      setMedioPago('efectivo')
      setObservacion('')
      setError('')
      setExito(false)
    }
  }, [open])

  const clientesFiltrados = busquedaCliente
    ? clientes.filter(c => c.Cli_Nombre?.toLowerCase().includes(busquedaCliente.toLowerCase()))
    : []

  const seleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente)
    setBusquedaCliente('')
    setVentaSeleccionada(null)
    setMonto(0)
    setCargandoVentas(true)
    try {
      // Obtener ventas pendientes de ese cliente
      const res = await api.get('/ventas/?limite=100')
      let todas = res.data.datos || []
      console.log(resumenFuturo)
      if (resumenFuturo?.id) {
      try {
        const resFuturo = await api.get(`/ventas/?corte_id=${resumenFuturo.id}&limite=100/`)
        const ventasFuturo = resFuturo.data.datos || []
        todas = [...todas, ...ventasFuturo]
      } catch (err) {
        // Si falla, al menos tenemos las actuales
        console.warn('No se pudieron cargar ventas del corte futuro', err)
      }
    }




      const pendientes = todas.filter(v =>
        v.cliente_id === cliente.ID_Cliente &&
        v.saldo_pendiente > 0 &&
        v.estado !== 'anulada'
      )
      setVentasCliente(pendientes)
    } catch (err) {
      setError('Error al cargar ventas del cliente')
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
    <div style={{padding:"16px"}}  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div style={{padding:"16px 24px"}}  className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-indigo-50">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Abono</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200">
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div style={{padding:"24px"}}  className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
          {/* Buscar cliente */}
          {!clienteSeleccionado ? (
            <div>
              <label style={{marginBottom:"4px"}}    className="text-sm font-semibold text-slate-700 mb-2 block">Buscar cliente</label>
              <input
                type="text"
                value={busquedaCliente}
                onChange={e => setBusquedaCliente(e.target.value)}
                placeholder="Escriba el nombre del cliente..."
                style={{padding:"8px"}} 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-400"
              />
              {busquedaCliente && clientesFiltrados.length > 0 && (
                <div style={{marginTop:"8px",overflowY:"auto",maxHeight:"160px"}}  className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {clientesFiltrados.map(c => (
                    <div
                      key={c.ID_Cliente}
                      onClick={() => seleccionarCliente(c)}
                      style={{padding:"8px 16px"}} 
                      className="px-4 py-2 hover:bg-indigo-100 cursor-pointer text-sm"
                    >
                      {c.Cli_Nombre}
                    </div>
                  ))}
                </div>
              )}
              {busquedaCliente && clientesFiltrados.length === 0 && (
      <div style={{marginTop:"8px",padding:"8px 16px"}} className="mt-2 border rounded-lg px-4 py-2 text-sm text-slate-400">
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
                <div style={{paddingTop:"16px",paddingBottom:"16px"}}  className="flex justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
              ) : ventasCliente.length === 0 ? (
                <p style={{marginTop:"8px"}}  className="text-sm text-gray-500 mt-2">No hay ventas pendientes para este cliente.</p>
              ) : (
                <div style={{marginTop:"12px"}} className="mt-3">
                  <label style={{marginBottom:"4px"}} className="text-sm font-semibold text-slate-700 mb-1 block">Seleccione venta</label>
                  <select
                    value={ventaSeleccionada?.id_venta || ''}
                    onChange={e => {
                      const v = ventasCliente.find(v => v.id_venta == e.target.value)
                      setVentaSeleccionada(v)
                      setMonto(v.saldo_pendiente) // por defecto el total pendiente
                    }}
                    style={{padding:"8px"}}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
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
                <div style={{marginTop:"16px",padding:"16px"}} className="mt-4 p-4 bg-indigo-50 rounded-xl space-y-3">
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
                    style={{padding:"8px"}} 
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  />

                  <label className="block text-xs text-slate-500">Medio de pago</label>
                  <select value={medioPago} onChange={e => setMedioPago(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm">
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="otro">Otro</option>
                  </select>

                  <label className="block text-xs text-slate-500">Observación (opcional)</label>
                  <input
                    type="text"
                    value={observacion}
                    onChange={e => setObservacion(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
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
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
              <CheckCircle2 size={16} /> Abono registrado correctamente
            </div>
          )}
        </div>

        <div style={{padding:"16px 24px"}}  className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button onClick={onClose} disabled={enviando}
            className="px-5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={!ventaSeleccionada || enviando || monto <= 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-md disabled:opacity-50">
            {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
            Registrar Abono
          </button>
        </div>
      </div>
    </div>
  )
}