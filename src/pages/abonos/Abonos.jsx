import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Loader2, AlertCircle, Info, X } from 'lucide-react'
import useAbonosModuleStore from '@/store/useAbonosModuleStore'
import useBalanceStore from '@/store/useBalanceStore'
import NuevoAbonoModal from '@/components/NuevoAbonoModal'
import { formatearFechaCorta } from '@/utils/formatearFecha'

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

  const abonosFiltrados = abonos.filter(a => {
    const q = busqueda.toLowerCase()
    return (
      String(a.id).includes(q) ||
      a.nombre_cliente?.toLowerCase().includes(q) ||
      a.medio_pago?.toLowerCase().includes(q)
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
                      <td className="sm:px-4 sm:py-3 text-right font-semibold text-xs sm:text-sm whitespace-nowrap py-3 px-4">${abono.monto.toLocaleString('es-CO')}</td>
                      <td className="sm:px-4 sm:py-3 py-3 px-4">
                        <span className={`text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap ${
                          abono.medio_pago === 'efectivo' ? 'bg-emerald-50 text-emerald-600' :
                          abono.medio_pago === 'transferencia' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {abono.medio_pago}
                        </span>
                      </td>
                      <td className="sm:px-4 sm:py-3 text-gray-500 text-xs sm:text-sm max-w-[120px] sm:max-w-[200px] truncate py-3 px-4">{abono.observacion || '—'}</td>
                      <td className="sm:px-4 sm:py-3 text-center py-3 px-4">
                        <button
                          onClick={() => setEliminarId(abono.id)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={14} className="text-rose-500" />
                        </button>
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