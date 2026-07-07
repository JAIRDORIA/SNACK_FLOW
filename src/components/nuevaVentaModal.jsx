import { useEffect, useRef, useState, useMemo } from 'react'
import {
  X, Plus, Trash2, AlertCircle, Loader2, CheckCircle2, Info
} from 'lucide-react'
import useNuevaVentaStore from '@/store/useNuevaVentaStore'
import useBalanceStore from '@/store/useBalanceStore'
import { formatearFechaColombia } from '@/utils/formatearFecha'

const MEDIOS_PAGO = ['efectivo', 'transferencia', 'otro']

export default function NuevaVentaModal({ open, onClose, onVentaCreada }) {
  const {
    clientes, cortes, productos,
    clienteId, corteId, fechaEntrega, horaEntrega,
    detalle, enviando, exito, errorMsg, cargandoDatos, errorDatos,
    cargarDatos, setClienteId, setCorteId, setFechaEntrega, setHoraEntrega,
    agregarProducto, eliminarProducto, pagarTotal, resetFormulario, registrarVenta,
    totalVenta, caso, saldoPendiente, cargarCombos, combos, agregarItem, abonosIniciales, agregarAbonoInicial, eliminarAbonoInicial, modificarAbonoInicial, totalAbonado
  } = useNuevaVentaStore()
  const { balance, fetchBalance } = useBalanceStore()

  const selectProductoRef = useRef(null)
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [cantidadItem, setCantidadItem] = useState(1);
  const [textoBusquedaCliente, setTextoBusquedaCliente] = useState('')
  const [clientesFiltrados, setClientesFiltrados] = useState([])
  const [seleccionado, setSeleccionado] = useState(false)
  const [mostrarInfoCombo, setMostrarInfoCombo] = useState(false)
  const [montosLocales, setMontosLocales] = useState([])
  useEffect(() => {
    setMontosLocales(abonosIniciales.map(a => a.monto?.toString() || ''))
  }, [abonosIniciales])

  const todosLosItems = useMemo(() => {
    const prods = productos.map(p => ({ ...p, tipo: 'producto', precio_detal: p.precio_detal,
    precio_almayor: p.precio_mayor }))
    console.log(productos)
    
    const combs = combos.map(c => ({ ...c, tipo: 'combo', precio_venta: c.precio })) // el backend usa 'precio' en GET /combos
    return [...prods, ...combs]
  }, [productos, combos])
  // Cargar datos al abrir
  useEffect(() => {
    if (open) {
      resetFormulario()
      cargarDatos()
      cargarCombos()
      fetchBalance()

    }
  }, [open])


  useEffect(() => {
    const productosFiltrados = productos
      .filter(p => p.nombre?.toLowerCase().includes(textoBusqueda.toLowerCase()))
      .map(p => ({ ...p, tipo: 'producto' }));

    const combosFiltrados = combos
      .filter(c => c.nombre?.toLowerCase().includes(textoBusqueda.toLowerCase()))
      .map(c => ({ ...c, tipo: 'combo' }));

    setItemsFiltrados([...productosFiltrados, ...combosFiltrados]);
  }, [textoBusqueda, productos, combos]);
  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setItemsFiltrados([])
      return
    }
    const q = textoBusqueda.toLowerCase()
    const filtrados = todosLosItems.filter(item =>
      item.nombre?.toLowerCase().includes(q) || item.Cli_identificacion?.includes(q)
    )
    setItemsFiltrados(filtrados)
  }, [textoBusqueda, todosLosItems])

  const handleAgregarProducto = () => {
    const select = selectProductoRef.current
    if (!select || !select.value) return

    const prodId = Number(select.value)
    const prod = productos.find(p => p.id === prodId)
    if (!prod) {
      console.error('Producto no encontrado con id:', prodId)
      return
    }

    const cantidad = Number(document.getElementById('cantidad-producto').value) || 1

    // Convertir precio_venta de string a número
    const precioUnitario = parseFloat(prod.precio_venta)

    agregarProducto(prod.id, prod.nombre, cantidad, precioUnitario)

    // Limpiar selección
    select.value = ''
    document.getElementById('cantidad-producto').value = '1'
  }

  const handleRegistrar = async () => {
    const ok = await registrarVenta()
    if (ok) {
      onVentaCreada?.()
      setTimeout(() => {
        resetFormulario()
        onClose()
      }, 1000)
    }
  }

  useEffect(() => {
    if (!textoBusquedaCliente.trim() || seleccionado) {
      setClientesFiltrados([])
      return
    }
    const q = textoBusquedaCliente.toLowerCase()
    const filtrados = clientes.filter(c =>
      c.Cli_Nombre?.toLowerCase().includes(q)
    )
    setClientesFiltrados(filtrados)
  }, [textoBusquedaCliente, clientes, seleccionado])
  const fechaMinimaEntrega = balance?.fecha_inicio
    ? formatearFechaColombia(balance.fecha_inicio, false).split('/').reverse().join('-')
    : ''

  if (!open) return null
  return (
    <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div style={{ padding: "16px 36px" }} className="flex items-center justify-between  border-b border-slate-100 bg-indigo-50">
          <h2 className="text-lg font-bold text-slate-800">Nueva Venta</h2>
          <button
            onClick={() => { resetFormulario(); onClose() }}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div style={{ padding: "24px" }} className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">

          {/* Error de carga */}
          {errorDatos && (
            <div style={{ padding: "12px" }} className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {errorDatos}
            </div>
          )}

          {/* Sección 1: Datos generales */}
          <div>
            <h3 style={{ marginBottom: "12px" }} className="text-sm font-semibold text-slate-600 mb-3">Datos generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 mb-1">Cliente *</label>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={textoBusquedaCliente}
                    onChange={(e) => {
                      const valor = e.target.value
                        .replace(/[0-9]/g, '')       // Elimina números
                        .slice(0, 30)                // Máximo 30 caracteres
                      setTextoBusquedaCliente(valor)
                      setSeleccionado(false)
                      if (clienteId) setClienteId('')
                    }}
                    style={{ padding: "8px" }}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                    disabled={cargandoDatos}
                  />

                  {/* Resultados de búsqueda - solo uno a la vez */}
                  {textoBusquedaCliente && !seleccionado && (
                    <>
                      {clientesFiltrados.length > 0 ? (
                        <ul style={{ marginTop: "4px" }} className="absolute z-20 bg-white border border-slate-200 rounded-lg mt-1 max-h-48 overflow-y-auto w-full shadow-lg">
                          {clientesFiltrados.map(c => (
                            <li
                              key={c.ID_Cliente}
                              onClick={() => {
                                setClienteId(c.ID_Cliente)
                                setTextoBusquedaCliente(`${c.Cli_Nombre} - ${c.Cli_identificacion || 'S/N'}`)
                                setSeleccionado(true)
                                setClientesFiltrados([])
                              }}
                              style={{ padding: "8px 12px" }}
                              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
                            >
                              <span>{c.Cli_Nombre} - </span>
                              <span className="text-xs text-slate-400 ml-2">{c.Cli_identificacion || 'S/N'}</span>

                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ padding: "8px 12px", marginTop: "4px" }} className="absolute z-20 bg-white border border-slate-200 rounded-lg mt-1 px-3 py-2 text-sm text-slate-400 w-full shadow-lg">
                          No se encontraron clientes
                        </div>
                      )}
                    </>
                  )}
                </div>

                {clienteId && (
                  <p className="text-xs text-indigo-600 mt-1">
                    Cliente seleccionado: {clientes.find(c => c.ID_Cliente == clienteId)?.Cli_Nombre}
                    ({clientes.find(c => c.ID_Cliente == clienteId)?.Cli_identificacion || 'S/N'})
                  </p>
                )}
              </div>
              <div>
                <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 mb-1">Corte *</label>
                <select
                  value={corteId}
                  onChange={e => setCorteId(e.target.value)}
                  style={{ padding: "8px" }}
                  className="w-full border border-slate-200 rounded-lg  text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                  disabled={cargandoDatos}
                >
                  <option value="">Seleccionar corte...</option>
                  {cortes.map(c => (
                    <option key={c.id} value={c.id}>{c.numero} - {c.estado}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 ">Fecha de entrega *</label>
                <input
                  type="date"
                  value={fechaEntrega}
                  onChange={e => setFechaEntrega(e.target.value)}
                  min={fechaMinimaEntrega}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                  style={{ padding: "8px" }}
                />
              </div>
              <div>
                <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 ">Hora de entrega</label>
                <input
                  type="time"
                  value={horaEntrega}
                  onChange={e => setHoraEntrega(e.target.value)}
                  style={{ padding: "8px" }}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Productos */}
          <div>
            <h3 style={{ marginBottom: "0px" }} className="text-sm font-semibold text-slate-600 ">Productos</h3>
            <div style={{ marginBottom: "12px" }} className="flex flex-wrap items-end gap-2 ">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Buscar producto o combo..."
                  value={textoBusqueda}
                  onChange={e => setTextoBusqueda(e.target.value)}
                  style={{ padding: "8px" }}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
                {itemSeleccionado && (
                  <div style={{ marginTop: "12px" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 flex-1">
                        {itemSeleccionado.nombre} ({itemSeleccionado.tipo})
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={cantidadItem}
                        onChange={e => setCantidadItem(Number(e.target.value))}
                        style={{ padding: "4px" }}
                        className="w-20 border border-slate-200 rounded-lg p-1 text-sm"
                      />
                      {itemSeleccionado.tipo === 'producto' ? (
                        <>
                          <button
                            onClick={() => {
                              const precio = parseFloat(itemSeleccionado.precio_detal)
                              agregarItem({
                                tipo: itemSeleccionado.tipo,
                                producto_id: itemSeleccionado.id,
                                combo_id: null,
                                nombre_producto: itemSeleccionado.nombre,
                                cantidad: cantidadItem,
                                precio_unitario: precio,
                              })
                              setTextoBusqueda('')
                              setItemSeleccionado(null)
                              setCantidadItem(1)
                            }}
                            style={{ padding: "8px 12px" }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-medium"
                          >
                            Al detal (${parseFloat(itemSeleccionado.precio_detal).toLocaleString('es-CO')})
                          </button>
                          <button
                            onClick={() => {
                              const precio = parseFloat(itemSeleccionado.precio_mayor)
                              agregarItem({
                                tipo: itemSeleccionado.tipo,
                                producto_id: itemSeleccionado.id,
                                combo_id: null,
                                nombre_producto: itemSeleccionado.nombre,
                                cantidad: cantidadItem,
                                precio_unitario: precio,
                              })
                              setTextoBusqueda('')
                              setItemSeleccionado(null)
                              setCantidadItem(1)
                            }}
                            style={{ padding: "8px 12px" }}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-xs font-medium"
                          >
                            Al mayor (${parseFloat(itemSeleccionado.precio_mayor).toLocaleString('es-CO')})
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            const precio = parseFloat(itemSeleccionado.precio_venta || itemSeleccionado.precio)
                            agregarItem({
                              tipo: itemSeleccionado.tipo,
                              producto_id: null,
                              combo_id: itemSeleccionado.id,
                              nombre_producto: itemSeleccionado.nombre,
                              cantidad: cantidadItem,
                              precio_unitario: precio,
                            })
                            setTextoBusqueda('')
                            setItemSeleccionado(null)
                            setCantidadItem(1)
                          }}
                          style={{ padding: "8px 16px" }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Agregar combo
                        </button>
                      )}
                    </div>

                    {/* Información adicional según el tipo */}
                    <div style={{ marginTop: "8px" }} className="mt-2 text-sm">
                      {itemSeleccionado.tipo === 'producto' ? (
                        <p className="text-slate-600">
                          📦 Unidades por bandeja: <strong>{itemSeleccionado.unidades_por_bandeja ?? 'N/D'}</strong>
                        </p>
                      ) : (
                        <button
                          onClick={() => setMostrarInfoCombo(true)}
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Info size={14} />
                          Ver productos del combo
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {textoBusqueda && itemsFiltrados.length > 0 && (
                  <ul style={{ marginTop: "4px" }} className="absolute z-20 bg-white border border-slate-200 rounded-lg mt-1 max-h-48 overflow-y-auto w-full shadow-lg">
                    {itemsFiltrados.map(item => (
                      <li
                        key={`${item.tipo}-${item.id}`}
                        onClick={() => {
                          // Al hacer clic, rellenamos el input y guardamos el item seleccionado
                          setTextoBusqueda(`${item.nombre} (${item.tipo})`)
                          setItemSeleccionado(item)
                          setItemsFiltrados([]) // ocultar lista
                        }}
                        style={{ padding: "8px 12px" }}
                        className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm flex justify-between items-center"
                      >
                        <span>{item.nombre}</span>
                        <span style={{ padding: "2px 8px" }} className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {item.tipo === 'combo' ? 'Combo' : 'Producto'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.tipo === 'producto' && (
                            <>
                              <span className="text-green-600">${parseFloat(item.precio_detal).toLocaleString('es-CO')}</span>
                              <span className="mx-1 text-slate-300">|</span>
                              <span className="text-orange-600">${parseFloat(item.precio_mayor).toLocaleString('es-CO')}</span>
                            </>
                          )}
                          {item.tipo === 'combo' && (
                            <span>${parseFloat(item.precio_venta || item.precio).toLocaleString('es-CO')}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>

            {detalle.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th style={{ padding: "8px 12px" }} className="px-3 py-2 text-left text-slate-500">Producto</th>
                      <th style={{ padding: "8px 12px" }} className="px-3 py-2 text-center text-slate-500">Cant</th>
                      <th style={{ padding: "8px 12px" }} className="px-3 py-2 text-right text-slate-500">Precio</th>
                      <th style={{ padding: "8px 12px" }} className="px-3 py-2 text-right text-slate-500">Subtotal</th>
                      <th style={{ padding: "8px 12px" }} className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((item, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-indigo-50/30">
                        <td style={{ padding: "8px 12px" }} className="px-3 py-2 text-slate-700">{item.nombre_producto}</td>
                        <td style={{ padding: "8px 12px" }} className="px-3 py-2 text-center text-slate-600">{item.cantidad}</td>
                        <td style={{ padding: "8px 12px" }} className="px-3 py-2 text-right text-slate-600">${item.precio_unitario.toLocaleString('es-CO')}</td>
                        <td style={{ padding: "8px 12px" }} className="px-3 py-2 text-right text-slate-700 font-medium">${(item.cantidad * item.precio_unitario).toLocaleString('es-CO')}</td>
                        <td style={{ padding: "8px 12px" }} className="px-3 py-2 text-center">
                          <button style={{ padding: "4px" }} onClick={() => eliminarProducto(i)} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ marginTop: "8px" }} className="text-xs text-slate-400 mt-2">No hay productos agregados.</p>
            )}
          </div>

          {/* Sección 3: Abono inicial */}
          {/* Sección 3: Abonos iniciales */}
          <div>
            <div style={{ marginBottom: "12px" }} className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-600">Abonos iniciales</h3>
              <button
                onClick={agregarAbonoInicial}
                style={{ padding: "6px 12px" }}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus size={14} />
                Agregar abono
              </button>
              {abonosIniciales.length === 0 && (
                <span className="text-xs text-slate-500">Sin abonos iniciales</span>
              )}
              {abonosIniciales.length > 0 && (
                <span className="text-xs text-slate-500">
                  {caso() === 'sin_abono' && 'Sin abono'}
                  {caso() === 'abono_parcial' && 'Abono parcial'}
                  {caso() === 'pago_completo' && 'Pago completo'}
                </span>
              )}
            </div>

            {abonosIniciales.map((abono, index) => (
              <div key={index} style={{ marginBottom: "8px", padding: "12px" }} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                <div>
                  <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 mb-1">Monto</label>
                  <input
                    type="number"
                    min="0"
                    max={totalVenta()}
                    value={montosLocales[index] ?? ''}
                    onChange={(e) => {
                      const nuevos = [...montosLocales]
                      nuevos[index] = e.target.value
                      setMontosLocales(nuevos)
                    }}
                    onBlur={() => {
                      const val = parseFloat(montosLocales[index]) || 0
                      const clamped = Math.min(Math.max(val, 0), totalVenta())
                      modificarAbonoInicial(index, 'monto', clamped)
                    }}
                    style={{ padding: "8px" }}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 mb-1">Medio de pago</label>
                  <select
                    value={abono.medio_pago}
                    onChange={e => modificarAbonoInicial(index, 'medio_pago', e.target.value)}
                    style={{ padding: "8px" }}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                  >
                    {MEDIOS_PAGO.map(medio => (
                      <option key={medio} value={medio}>{medio.charAt(0).toUpperCase() + medio.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 mb-1">Observación</label>
                    <input
                      type="text"
                      value={abono.observacion}
                      onChange={e => modificarAbonoInicial(index, 'observacion', e.target.value)}
                      placeholder="Opcional"
                      style={{ padding: "8px" }}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <button
                    onClick={() => eliminarAbonoInicial(index)}
                    style={{ padding: "8px" }}
                    className="text-rose-500 hover:bg-rose-100 p-2 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div style={{ padding: "16px" }} className="bg-indigo-50 p-4 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total venta</span>
              <span className="font-bold text-slate-800">${totalVenta().toLocaleString('es-CO')}</span>
              <span className="font-medium text-emerald-600">${(totalAbonado() || 0).toLocaleString('es-CO')}</span>
            </div>
            {abonosIniciales.length > 0 && (
              <div style={{ marginTop: "4px" }} className="flex justify-between text-sm mt-1">
                <span className="text-slate-600">Total abonado</span>
                <span className="font-medium text-emerald-600">
                  ${(totalAbonado() || 0).toLocaleString('es-CO')}
                </span>
              </div>
            )}
            {saldoPendiente() > 0 && (
              <div style={{ marginTop: "4px" }} className="flex justify-between text-sm mt-1">
                <span className="text-slate-600">Saldo pendiente</span>
                <span className="font-medium text-amber-600">
                  ${saldoPendiente().toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{ padding: "12px" }} className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div style={{ padding: "12px" }} className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
              <CheckCircle2 size={16} /> Venta registrada correctamente
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px" }} className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-sm text-slate-500">
            {detalle.length > 0 ? `${detalle.length} producto(s)` : 'Sin productos'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { resetFormulario(); onClose() }}
              disabled={enviando}
              style={{ padding: "6px 20px" }}
              className=" border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleRegistrar}
              disabled={enviando || totalVenta() <= 0 || exito}
              style={{ padding: "6px 24px" }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white  rounded-xl text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {enviando && <Loader2 size={16} className="animate-spin" />}
              {exito ? 'Registrada' : enviando ? 'Registrando...' : 'Registrar Venta'}
            </button>
          </div>
        </div>
      </div>
      {/* Modal info combo */}
      {mostrarInfoCombo && itemSeleccionado && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div style={{ padding: "24px" }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div style={{ marginBottom: "16px" }} className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{itemSeleccionado.nombre}</h3>
              <button
                onClick={() => setMostrarInfoCombo(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={18} color="#64748b" />
              </button>
            </div>
            {itemSeleccionado.productos && itemSeleccionado.productos.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th style={{ padding: "8px 12px" }} className="px-3 py-2 text-left text-xs text-slate-500 uppercase">Producto</th>
                    <th style={{ padding: "8px 12px" }} className="px-3 py-2 text-center text-xs text-slate-500 uppercase">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {itemSeleccionado.productos.map((prod, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td style={{ padding: "8px 12px" }} className="px-3 py-2 text-slate-700">{prod.nombre}</td>
                      <td style={{ padding: "8px 12px" }} className="px-3 py-2 text-center text-slate-600">{prod.cantidad_unidades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-400">No hay productos detallados.</p>
            )}
            <div style={{ marginTop: "16px" }} className="mt-4 flex justify-end">
              <button
                onClick={() => setMostrarInfoCombo(false)}
                style={{ padding: "8px 16px" }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  )
}

