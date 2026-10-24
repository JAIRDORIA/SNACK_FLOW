import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Loader2, AlertCircle, Info, X, Receipt, Printer } from 'lucide-react'
import useAbonosModuleStore from '@/store/useAbonosModuleStore'
import useBalanceStore from '@/store/useBalanceStore'
import NuevoAbonoModal from '@/components/NuevoAbonoModal'
import MedioPagoBadge from '@/components/MedioPagoBadge'
import { getReciboAbono } from '@/api/abonos_api'
import { formatearFechaCorta } from '@/utils/formatearFecha'

const escapeHtml = (texto) =>
  String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export default function Abonos() {
  const {
    abonos, total, pagina, totalPaginas, cargando, error,
    fetchAbonos, eliminarAbono,
  } = useAbonosModuleStore()
  const { balance, fetchBalance } = useBalanceStore()

  const [busqueda, setBusqueda] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [eliminarId, setEliminarId] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [recibo, setRecibo] = useState(null)
  const [reciboCargandoId, setReciboCargandoId] = useState(null)
  const [reciboError, setReciboError] = useState('')

  useEffect(() => {
    fetchAbonos()
    if (!balance) fetchBalance()
  }, [])

  const handleEliminar = async () => {
    if (!eliminarId) return
    setEliminando(true)
    try {
      await eliminarAbono(eliminarId)
      fetchAbonos(pagina)
      setEliminarId(null)
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al eliminar abono')
    } finally {
      setEliminando(false)
    }
  }

  const verRecibo = async (id) => {
    setReciboError('')
    setReciboCargandoId(id)
    try {
      const res = await getReciboAbono(id)
      setRecibo(res.data)
    } catch (err) {
      setReciboError(err.response?.data?.mensaje || 'Error al cargar el recibo')
    } finally {
      setReciboCargandoId(null)
    }
  }

  const imprimirRecibo = (data) => {
    const concepto = data.es_domicilio ? 'Abono de domicilio' : 'Abono de venta'
    const conDomicilio = Number(data.valor_domicilio) > 0
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recibo ${escapeHtml(data.numero_recibo)}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
        h2 { color: #4f46e5; }
        .info p { margin: 6px 0; }
        .monto { margin-top: 20px; padding: 12px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; }
        .pendientes { margin-top: 20px; background: #f5f3ff; border: 1px solid #ddd6fe; padding: 12px; border-radius: 8px; }
        .pendientes p { margin: 4px 0; display: flex; justify-content: space-between; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <button onclick="window.print()" style="margin-bottom:20px;padding:8px 16px;background:#4f46e5;color:white;border:none;border-radius:8px;cursor:pointer;">
        Imprimir recibo
      </button>
      <h2>RECIBO ${escapeHtml(data.numero_recibo)}</h2>
      <div class="info">
        <p><strong>Cliente:</strong> ${escapeHtml(data.nombre_cliente) || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${formatearFechaCorta(data.fecha)}</p>
        <p><strong>Concepto:</strong> ${concepto}</p>
        <p><strong>Medio de pago:</strong> ${escapeHtml(data.medio_pago_nombre || data.medio_pago)}</p>
      </div>
      <div class="monto">
        <span>Monto</span>
        <strong>$${Number(data.monto || 0).toLocaleString('es-CO')}</strong>
      </div>
      ${conDomicilio ? `
      <div class="pendientes">
        <p><span>Productos pendientes</span><strong>$${Number(data.productos_pendiente || 0).toLocaleString('es-CO')}</strong></p>
        <p><span>Domicilio pendiente</span><strong>$${Number(data.domicilio_pendiente || 0).toLocaleString('es-CO')}</strong></p>
      </div>
      ` : ''}
    </body>
    </html>
  `

    const ventana = window.open('', '_blank', 'width=800,height=600')
    ventana.document.write(html)
    ventana.document.close()
  }

  const abonosFiltrados = abonos.filter(a => {
    const q = busqueda.toLowerCase()
    return (
      String(a.id).includes(q) ||
      a.nombre_cliente?.toLowerCase().includes(q) ||
      a.medio_pago?.toLowerCase().includes(q) ||
      a.medio_pago_nombre?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex-1 bg-gray-50 sm:p-6 lg:p-8 overflow-auto p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:mb-8 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#1B1D2E]">Abonos</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Gestión de pagos de ventas</p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}

          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap py-2.5 px-5"
        >
          <Plus size={16} />
          Nuevo Abono
        </button>
      </div>

      {/* Buscador */}
      <div className="relative w-full sm:w-80 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por ID, cliente o medio..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}

          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all pt-1 pr-4 pb-1 pl-9"
        />
      </div>

      {reciboError && (
        <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-sm text-rose-700">
          <AlertCircle size={16} /> {reciboError}
        </div>
      )}

      {/* Tabla */}
      {cargando ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-rose-500" />
          <span className="text-sm text-rose-700">{error}</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">ID</th>
                  <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Fecha</th>
                  <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Cliente</th>
                  <th className="sm:px-4 sm:py-3 text-right text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Monto</th>
                  <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Medio</th>
                  <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Observación</th>
                  <th className="sm:px-4 sm:py-3 text-center text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 text-sm pt-10 pb-10">No se encontraron abonos</td>
                  </tr>
                ) : (
                  abonosFiltrados.map(abono => (
                    <tr key={abono.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="sm:px-4 sm:py-3 font-medium text-indigo-600 text-xs sm:text-sm whitespace-nowrap py-3 px-4">#{abono.id}</td>
                      <td className="sm:px-4 sm:py-3 text-gray-500 text-xs sm:text-sm whitespace-nowrap py-3 px-4">{formatearFechaCorta(abono.fecha)}</td>
                      <td className="sm:px-4 sm:py-3 text-gray-700 text-xs sm:text-sm whitespace-nowrap py-3 px-4">{abono.nombre_cliente}</td>
                      <td className="sm:px-4 sm:py-3 text-right text-xs sm:text-sm whitespace-nowrap py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <span className="font-semibold">${abono.monto.toLocaleString('es-CO')}</span>
                          {abono.es_domicilio && (
                            <span className="inline-flex items-center text-[10px] rounded-full font-semibold bg-violet-50 text-violet-700 border border-violet-200 py-0.5 px-2">
                              Domicilio
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="sm:px-4 sm:py-3 py-3 px-4">
                        <MedioPagoBadge
                          medioPago={abono.medio_pago}
                          nombre={abono.medio_pago_nombre}
                        />
                      </td>
                      <td className="sm:px-4 sm:py-3 text-gray-500 text-xs sm:text-sm max-w-[120px] sm:max-w-[200px] truncate py-3 px-4">{abono.observacion || '—'}</td>
                      <td className="sm:px-4 sm:py-3 text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => verRecibo(abono.id)}
                            disabled={reciboCargandoId !== null}
                            title="Ver recibo"
                            aria-label={`Ver recibo del abono ${abono.id}`}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {reciboCargandoId === abono.id
                              ? <Loader2 size={14} className="animate-spin text-indigo-500" />
                              : <Receipt size={14} className="text-indigo-500" />}
                          </button>
                          <button
                            onClick={() => setEliminarId(abono.id)}
                            title="Eliminar abono"
                            aria-label={`Eliminar abono ${abono.id}`}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={14} className="text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="sm:px-6 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500 py-4 px-6">
            <span className="text-xs sm:text-sm">Mostrando {abonosFiltrados.length} de {total} abonos</span>
            {totalPaginas > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => fetchAbonos(pagina - 1)}
                  disabled={pagina === 1}
 
                  className="sm:px-3 border rounded-lg text-xs sm:text-sm disabled:opacity-30 hover:bg-gray-100 py-1 px-3"
                >
                  Anterior
                </button>
                <span className="sm:px-3 text-xs sm:text-sm py-1 px-3">{pagina} / {totalPaginas}</span>
                <button
                  onClick={() => fetchAbonos(pagina + 1)}
                  disabled={pagina === totalPaginas}
 
                  className="sm:px-3 border rounded-lg text-xs sm:text-sm disabled:opacity-30 hover:bg-gray-100 py-1 px-3"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {eliminarId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl sm:p-8 text-center p-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-50 rounded-2xl flex items-center justify-center sm:mb-6 mb-8 m-auto m-auto">
              <AlertCircle size={28} className="sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <p className="font-bold text-lg sm:text-xl text-slate-800 sm:mb-3 mb-3">¿Eliminar abono?</p>
            <p className="text-sm text-slate-500 sm:mb-8 mb-8">
              El abono <strong>#{eliminarId}</strong> será eliminado y se revertirá su monto de la venta correspondiente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEliminarId(null)} disabled={eliminando}
                className="flex-1 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleEliminar} disabled={eliminando}

                className="flex-1 sm:py-3 border-none rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 pt-3 pb-3">
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recibo de abono */}
      {recibo && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recibo-titulo"
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 py-4 px-6">
              <div>
                <h2 id="recibo-titulo" className="text-lg font-bold text-slate-800">
                  Recibo {recibo.numero_recibo}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Comprobante de abono</p>
              </div>
              <button
                onClick={() => setRecibo(null)}
                aria-label="Cerrar recibo"
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Cliente</span>
                <span className="font-medium text-slate-800 text-right">{recibo.nombre_cliente}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Fecha</span>
                <span className="font-medium text-slate-700">{formatearFechaCorta(recibo.fecha)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Concepto</span>
                <span className="font-semibold text-violet-700">
                  {recibo.es_domicilio ? 'Abono de domicilio' : 'Abono de venta'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4 text-sm">
                <span className="text-slate-500">Medio de pago</span>
                <MedioPagoBadge
                  medioPago={recibo.medio_pago}
                  nombre={recibo.medio_pago_nombre}
                />
              </div>

              <div className="flex items-center justify-between border-y border-slate-200 py-3">
                <span className="text-sm text-slate-500">Monto</span>
                <span className="text-2xl font-bold text-indigo-600">
                  ${Number(recibo.monto || 0).toLocaleString('es-CO')}
                </span>
              </div>

              {Number(recibo.valor_domicilio) > 0 && (
                <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Productos pendientes</span>
                    <span className="font-semibold text-slate-800">
                      ${Number(recibo.productos_pendiente || 0).toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Domicilio pendiente</span>
                    <span className="font-semibold text-violet-700">
                      ${Number(recibo.domicilio_pendiente || 0).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 py-4 px-6">
              <button
                onClick={() => setRecibo(null)}
                className="border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 py-2 px-4"
              >
                Cerrar
              </button>
              <button
                onClick={() => imprimirRecibo(recibo)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md py-2 px-4"
              >
                <Printer size={16} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Abono */}
      <NuevoAbonoModal
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onAbonoCreado={() => {
          fetchAbonos(pagina)
          setModalNuevo(false)
        }}
      />
    </div>
  )
}