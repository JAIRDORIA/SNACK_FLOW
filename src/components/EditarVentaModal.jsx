import { useEffect, useRef, useMemo,useState } from 'react'
import {
  X, Plus, Trash2, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react'
import useEditarVentaStore from '@/store/useEditarVentaStore'
import useNuevaVentaStore from '@/store/useNuevaVentaStore' // para acceder a la lista de productos

export default function EditarVentaModal({ open, onClose, onVentaEditada }) {
  const {
    ventaId, fechaEntrega, horaEntrega, detalle,
    cargando, error, exito,
    cargarVenta, setFechaEntrega, setHoraEntrega,
    modificarProducto, eliminarProducto,
    totalActual, guardarCambios, reset, agregarItem
  } = useEditarVentaStore()

  // Para el selector de productos (usamos el store de nueva venta que ya tiene los productos)
  const { productos, combos, cargarDatos, cargarCombos } = useNuevaVentaStore()
  const selectProductoRef = useRef(null)
  const [itemSeleccionadoId, setItemSeleccionadoId] = useState(null)

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

  const handleAgregarProducto = (id) => {
    if (!id) return

    const item = todosLosItems.find(i => i.id === id)
    if (!item) return

    const cantidad = Number(document.getElementById('cantidad-producto').value) || 1
    const precioUnitario = parseFloat(item.precio_venta || item.precio)

    agregarItem({
      tipo: item.tipo,
      producto_id: item.tipo === 'producto' ? item.id : null,
      combo_id: item.tipo === 'combo' ? item.id : null,
      nombre_producto: item.nombre,
      cantidad: cantidad,
      precio_unitario: precioUnitario,
    })

    // Limpiar
    document.getElementById('cantidad-producto').value = '1'
    setItemSeleccionadoId(null)
    if (selectProductoRef.current) selectProductoRef.current.value = ''
  }
  const handleGuardar = async () => {
    const ok = await guardarCambios()
    if (ok) {
      onVentaEditada?.()
      setTimeout(() => {
        onClose()
      }, 1000)
    }
  }

  const todosLosItems = useMemo(() => {
    const prods = productos.map(p => ({ ...p, tipo: 'producto' }))
    const combs = combos.map(c => ({ ...c, tipo: 'combo', precio_venta: c.precio }))
    return [...prods, ...combs]
  }, [productos, combos])

  if (!open) return null

  return (
    <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 ">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div style={{ padding: "16px 24px" }} className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50">
          <h2 className="text-lg font-bold text-slate-800">
            Editar Venta #{String(ventaId).padStart(3, '0')}
          </h2>
          <button
            onClick={() => { reset(); onClose() }}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div style={{ padding: "24px" }} className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">

          {/* Sección Fecha de entrega */}
          <div>
            <h3 style={{ marginBottom: "12px" }} className="text-sm font-semibold text-slate-600 ">Datos generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 mb-1">Fecha de entrega *</label>
                <input
                  type="date"
                  value={fechaEntrega}
                  onChange={e => setFechaEntrega(e.target.value)}
                  style={{ padding: "8px" }}
                  className="w-full border border-slate-300 rounded-lg  text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 mb-1">Hora de entrega</label>
                <input
                  type="time"
                  value={horaEntrega}
                  onChange={e => setHoraEntrega(e.target.value)}
                  style={{ padding: "8px" }}
                  className="w-full border border-slate-300 rounded-lg  text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Sección Productos */}
          <div>
            <h3 style={{ marginBottom: "12px" }} className="text-sm font-semibold text-slate-600 mb-3">Productos</h3>

            {/* Agregar nuevo producto */}
            <div style={{ marginBottom: "12px" }} className="flex flex-wrap items-end gap-2 ">
              <div className="flex-1 min-w-[160px]">
                <label style={{ marginBottom: "4px" }} className="block text-xs text-slate-500 mb-1">Producto</label>
                <select 
                ref={selectProductoRef} 
                onChange={(e) => setItemSeleccionadoId(Number(e.target.value))}
                style={{ padding: "8px" }}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400">
                  <option value="">Seleccionar producto o combo...</option>
                  {todosLosItems.map(item => (
                    <option key={`${item.tipo}-${item.id}`} value={item.id}>
                      {item.nombre} ({item.tipo === 'combo' ? 'Combo' : 'Producto'})
                    </option>
                  ))}
                </select>
              </div>
              <button
              onClick={() => handleAgregarProducto(itemSeleccionadoId)}
              disabled={!itemSeleccionadoId}

                style={{ padding: "8px 16px" }}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
                      <th style={{ padding: "8px 16px" }} className="px-3 py-2 text-left text-slate-500">Producto</th>
                      <th style={{ padding: "8px 16px" }} className="px-3 py-2 text-center text-slate-500">Cantidad</th>
                      <th style={{ padding: "8px 16px" }} className="px-3 py-2 text-right text-slate-500">Precio unit.</th>
                      <th style={{ padding: "8px 16px" }} className="px-3 py-2 text-right text-slate-500">Subtotal</th>
                      <th style={{ padding: "8px 16px" }} className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((item, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-indigo-50/30">
                        <td style={{ padding: "8px 16px" }} className="px-3 py-2 text-slate-700">
                          <input
                            type="text"
                            value={item.nombre_producto}
                            onChange={e => modificarProducto(i, 'nombre_producto', e.target.value)}
                            className="w-full border-none bg-transparent focus:outline-none"
                          />
                        </td>
                        <td style={{ padding: "8px 16px" }} className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={e => modificarProducto(i, 'cantidad', Number(e.target.value))}
                            style={{ padding: "4px" }}
                            className="w-16 text-center border border-slate-300 rounded p-1 text-slate-600"
                          />
                        </td>
                        <td style={{ padding: "8px 16px" }} className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={e => modificarProducto(i, 'precio_unitario', parseFloat(e.target.value) || 0)}
                            style={{ padding: "4px" }}
                            className="w-24 text-right border border-slate-300 rounded p-1 text-slate-600"
                          />
                        </td>
                        <td style={{ padding: "8px 16px" }} className="px-3 py-2 text-right text-slate-700 font-medium">
                          ${(item.cantidad * item.precio_unitario).toLocaleString('es-CO')}
                        </td>
                        <td style={{ padding: "8px 16px" }} className="px-3 py-2 text-center">
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
              <p style={{ marginTop: "8px" }} className="text-xs text-slate-400 mt-2">No hay productos. Agrega al menos uno.</p>
            )}
          </div>

          {/* Total */}
          <div style={{ padding: "16px" }} className="bg-indigo-50 p-4 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Nuevo total</span>
              <span className="font-bold text-slate-800">${totalActual().toLocaleString('es-CO')}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "12px" }} className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div style={{ padding: "12px" }} className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
              <CheckCircle2 size={16} /> Venta actualizada correctamente
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px" }} className="px-6 py-4 border-t border-slate-300 bg-slate-50/50 flex justify-between items-center">
          <span className="text-sm text-slate-500">
            {detalle.length} producto(s) · Total: ${totalActual().toLocaleString('es-CO')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { reset(); onClose() }}
              disabled={cargando}
              style={{ padding: "8px 20px" }}
              className="px-5 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={cargando || exito}
              style={{ padding: "8px 24px" }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {cargando && <Loader2 size={16} className="animate-spin" />}
              {exito ? 'Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}