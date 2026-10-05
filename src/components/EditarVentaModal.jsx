import { useEffect, useRef, useMemo, useState } from 'react'
import {
  X, Plus, Trash2, AlertCircle, Loader2, CheckCircle2, Layers
} from 'lucide-react'
import useEditarVentaStore from '@/store/useEditarVentaStore'
import useNuevaVentaStore from '@/store/useNuevaVentaStore' // para acceder a la lista de productos

export default function EditarVentaModal({ open, onClose, onVentaEditada }) {
  const {
    ventaId, fechaEntrega, horaEntrega, detalle,
    cargando, error, exito,
    cargarVenta, setFechaEntrega, setHoraEntrega,
    modificarProducto, eliminarProducto,
    totalActual, guardarCambios, reset, agregarItem,
    actualizarComposicionCombo
  } = useEditarVentaStore()

  // Para el selector de productos (usamos el store de nueva venta que ya tiene los productos)
  const { productos, combos, cargarDatos, cargarCombos } = useNuevaVentaStore()
  const selectProductoRef = useRef(null)
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1)
  const [selectValue, setSelectValue] = useState('');

  // ── Sub-modal de composición de combo ──
  const [compoIndex, setCompoIndex] = useState(null)      // índice de la fila que se edita
  const [compoProductos, setCompoProductos] = useState([]) // [{ producto_id, cantidad_unidades }]
  const [compoError, setCompoError] = useState('')

  const cerrarComposicion = () => {
    setCompoIndex(null)
    setCompoProductos([])
    setCompoError('')
  }

  useEffect(() => {
    if (open) {
      cargarDatos()
      cargarCombos()// para tener productos disponibles
    }
  }, [open])

  useEffect(() => {
    if (open && ventaId) {
      cargarVenta(ventaId)
    } else if (!open) {
      reset()
    }
  }, [open, ventaId])
  const handleAgregarProducto = (item) => {
  if (!item) return;

  const cantidadFinal = cantidad || 1;
  const precioUnitario = parseFloat(item.precio_venta || item.precio);

  agregarItem({
    tipo: item.tipo,  // ¡Esto ahora es correcto!
    producto_id: item.tipo === 'producto' ? item.id : null,
    combo_id: item.tipo === 'combo' ? item.id : null,
    nombre_producto: item.nombre,
    cantidad: cantidadFinal,
    precio_unitario: precioUnitario,
  });

  // Limpiar selección
  setCantidad(1);
  setItemSeleccionado(null);
  if (selectProductoRef.current) selectProductoRef.current.value = '';
};
  const handleGuardar = async () => {
    const ok = await guardarCambios()
    if (ok) {
      onVentaEditada?.()
      setTimeout(() => {
        cerrarComposicion()
        onClose()
      }, 1000)
    }
  }

  const todosLosItems = useMemo(() => {
    const prods = productos.map(p => ({ ...p, tipo: 'producto' }))
    const combs = combos.map(c => ({ ...c, tipo: 'combo', precio_venta: c.precio }))
    return [...prods, ...combs]
  }, [productos, combos])

  // ── Composición de combos ──
  // Una línea es "personalizada" cuando trae su propia composición (array).
  // Si `productos` es null/undefined es de catálogo: su composición vive en
  // el catálogo de combos y hay que resolverla por `combo_id`.
  const esComboPersonalizado = (item) => Array.isArray(item.productos)

  // composición de catálogo: combos[i].productos trae
  // { producto_id, cantidad_unidades, nombre | nombre_producto }
  const composicionDeCatalogo = (comboId) => {
    const combo = combos.find(c => c.id === comboId)
    return Array.isArray(combo?.productos) ? combo.productos : []
  }

  // Normaliza cualquier composición a [{ producto_id: Number, cantidad_unidades: Number }]
  const normalizarComposicion = (lista) =>
    (lista || [])
      .filter(p => p && p.producto_id)
      .map(p => ({
        producto_id: Number(p.producto_id),
        cantidad_unidades: Number(p.cantidad_unidades),
      }))

  const abrirComposicion = (index) => {
    const item = detalle[index]
    if (!item) return
    const base = esComboPersonalizado(item)
      ? item.productos
      : composicionDeCatalogo(item.combo_id)
    setCompoProductos(
      normalizarComposicion(base).map(p => ({ ...p })),
    )
    setCompoError('')
    setCompoIndex(index)
  }

  // Compara dos composiciones como mapa producto_id -> suma de unidades,
  // sin importar el orden ni filas repetidas.
  const composicionesEquivalentes = (a, b) => {
    const mapa = (lista) =>
      normalizarComposicion(lista).reduce((acc, p) => {
        acc[p.producto_id] = (acc[p.producto_id] || 0) + p.cantidad_unidades
        return acc
      }, {})
    const ma = mapa(a)
    const mb = mapa(b)
    const clavesA = Object.keys(ma)
    const clavesB = Object.keys(mb)
    if (clavesA.length !== clavesB.length) return false
    return clavesA.every(k => ma[k] === mb[k])
  }

  const guardarComposicion = () => {
    const item = detalle[compoIndex]
    if (!item) return

    const editada = normalizarComposicion(compoProductos)

    if (editada.length === 0 || editada.some(p => !Number.isInteger(p.cantidad_unidades) || p.cantidad_unidades < 1)) {
      setCompoError('Agrega al menos un producto con cantidad de unidades entera mayor o igual a 1.')
      return
    }

    // Combo de catálogo que no se modificó: se queda como catálogo.
    if (!esComboPersonalizado(item)) {
      const catalogo = composicionDeCatalogo(item.combo_id)
      if (composicionesEquivalentes(editada, catalogo)) {
        actualizarComposicionCombo(compoIndex, null)
        cerrarComposicion()
        return
      }
    }

    // Se modificó (o ya era personalizado): pasa a personalizado con combo_id = null.
    actualizarComposicionCombo(compoIndex, editada)
    cerrarComposicion()
  }

  const itemEnComposicion = compoIndex !== null ? detalle[compoIndex] : null

  // Cierra el modal principal limpiando también el sub-modal de composición,
  // para que no queden restos entre una venta y otra.
  const cerrarTodo = () => {
    cerrarComposicion()
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-indigo-50 py-4 px-6">
          <h2 className="text-lg font-bold text-slate-800">
            Editar Venta #{String(ventaId).padStart(3, '0')}
          </h2>
          <button
            onClick={cerrarTodo}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto p-6">

          {/* Sección Fecha de entrega */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Datos generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Fecha de entrega *</label>
                <input
                  type="date"
                  value={fechaEntrega}
                  onChange={e => setFechaEntrega(e.target.value)}

                  className="w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Hora de entrega</label>
                <input
                  type="time"
                  value={horaEntrega}
                  onChange={e => setHoraEntrega(e.target.value)}

                  className="w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                />
              </div>
            </div>
          </div>

          {/* Sección Productos */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Productos</h3>

            {/* Agregar nuevo producto */}
            {/* Agregar nuevo producto */}
            <div className="flex flex-wrap items-end gap-2 mb-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-slate-500 mb-1">Producto</label>
                <select
                  ref={selectProductoRef}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Buscamos el item completo usando el string compuesto tipo-id
                    const item = todosLosItems.find(i => `${i.tipo}-${i.id}` === value);
                    setItemSeleccionado(item);
                  }}

                  className="w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2">
                  <option value="">Seleccionar producto o combo...</option>
                  {todosLosItems.map(item => (
                    <option key={`${item.tipo}-${item.id}`} value={`${item.tipo}-${item.id}`}>
                      {item.nombre} ({item.tipo === 'combo' ? 'Combo' : 'Producto'})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleAgregarProducto(itemSeleccionado)}
                disabled={!itemSeleccionado}

                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors py-2 px-4"
              >
                <Plus size={16} /> Agregar
              </button>
            </div>

            {/* Tabla editable */}
            {detalle.length > 0 ? (
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-slate-500 py-2 px-4">Producto</th>
                      <th className="text-center text-slate-500 py-2 px-4">Cantidad</th>
                      <th className="text-right text-slate-500 py-2 px-4">Precio unit.</th>
                      <th className="text-right text-slate-500 py-2 px-4">Subtotal</th>
                      <th className="py-2 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((item, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-indigo-50/30">
                        <td className="text-slate-700 py-2 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.nombre_producto}
                              onChange={e => modificarProducto(i, 'nombre_producto', e.target.value)}
                              className="w-full border-none bg-transparent focus:outline-none"
                            />
                            {item.tipo === 'combo' && (
                              <span
                                className={`shrink-0 inline-flex items-center text-[10px] rounded-full font-medium border py-0.5 px-2 ${esComboPersonalizado(item)
                                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}
                              >
                                {esComboPersonalizado(item) ? 'Personalizado' : 'Catálogo'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-2 px-4">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={e => modificarProducto(i, 'cantidad', Number(e.target.value))}

                            className="w-16 text-center border border-slate-300 rounded text-slate-600 p-1"
                          />
                        </td>
                        <td className="text-right py-2 px-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={e => modificarProducto(i, 'precio_unitario', parseFloat(e.target.value) || 0)}

                            className="w-24 text-right border border-slate-300 rounded text-slate-600 p-1"
                          />
                        </td>
                        <td className="text-right text-slate-700 font-medium py-2 px-4">
                          ${(item.cantidad * item.precio_unitario).toLocaleString('es-CO')}
                        </td>
                        <td className="text-center py-2 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {item.tipo === 'combo' && (
                              <button
                                type="button"
                                title="Ver / editar composición"
                                onClick={() => abrirComposicion(i)}
                                className="text-slate-500 hover:bg-slate-100 p-1 rounded"
                              >
                                <Layers size={14} />
                              </button>
                            )}
                            <button className="p-1" onClick={() => eliminarProducto(i)} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">No hay productos. Agrega al menos uno.</p>
            )}
          </div>

          {/* Total */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Nuevo total</span>
              <span className="font-bold text-slate-800">${totalActual().toLocaleString('es-CO')}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3">
              <CheckCircle2 size={16} /> Venta actualizada correctamente
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-300 bg-slate-50/50 flex justify-between items-center py-4 px-6">
          <span className="text-sm text-slate-500">
            {detalle.length} producto(s) · Total: ${totalActual().toLocaleString('es-CO')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={cerrarTodo}
              disabled={cargando}

              className="border border-slate-300 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors py-2 px-5"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={cargando || exito}

              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all py-2 px-6"
            >
              {cargando && <Loader2 size={16} className="animate-spin" />}
              {exito ? 'Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* ═══ SUB-MODAL: COMPOSICIÓN DEL COMBO ═══ */}
      {itemEnComposicion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Composición de {itemEnComposicion.nombre_producto}
              </h3>
              <button
                onClick={cerrarComposicion}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">
                Las cantidades son en <strong>unidades</strong> por combo.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCompoProductos([
                    ...compoProductos,
                    { producto_id: '', cantidad_unidades: 1 },
                  ])
                }}
                className="text-indigo-600 text-sm hover:underline"
              >
                + Agregar producto
              </button>
            </div>

            {compoProductos.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left text-xs text-slate-500 uppercase py-2 px-3">Producto</th>
                      <th className="text-center text-xs text-slate-500 uppercase w-24 py-2 px-3">Unidades</th>
                      <th className="w-10 py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {compoProductos.map((prod, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1 px-3">
                          <select
                            value={prod.producto_id || ''}
                            onChange={(e) => {
                              const nuevos = [...compoProductos]
                              nuevos[i] = { ...nuevos[i], producto_id: e.target.value ? Number(e.target.value) : '' }
                              setCompoProductos(nuevos)
                            }}
                            className="w-full border border-slate-200 rounded text-sm p-1.5"
                          >
                            <option value="">Seleccionar producto...</option>
                            {productos.map(p => (
                              <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 px-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={prod.cantidad_unidades}
                            onChange={(e) => {
                              const nuevos = [...compoProductos]
                              nuevos[i] = { ...nuevos[i], cantidad_unidades: Number(e.target.value) }
                              setCompoProductos(nuevos)
                            }}
                            className="w-20 text-center border border-slate-200 rounded text-sm p-1.5"
                          />
                        </td>
                        <td className="text-center py-1 px-3">
                          <button
                            type="button"
                            title="Eliminar fila"
                            onClick={() => setCompoProductos(compoProductos.filter((_, j) => j !== i))}
                            className="text-rose-500 hover:bg-rose-100 p-1 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No hay productos en la composición.</p>
            )}

            {compoError && (
              <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg mt-3 p-2.5">
                <AlertCircle size={16} /> {compoError}
              </div>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={cerrarComposicion}
                className="border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 py-2 px-4"
              >
                Cancelar
              </button>
              <button
                onClick={guardarComposicion}
                className="bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 py-2 px-4"
              >
                Guardar composición
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}