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
    <div style={{padding:"32px"}} className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-auto">
      {/* Header */}
      <div style={{marginBottom:"32px"}} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#1B1D2E]">Abonos</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Gestión de pagos de ventas</p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          style={{padding:"10px 20px"}}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus size={16} />
          Nuevo Abono
        </button>
      </div>

      {/* Buscador */}
      <div style={{marginBottom:"16px"}} className="relative w-full sm:w-80 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por ID, cliente o medio..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{padding:"4px 16px 4px 36px"}}
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
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
                  <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">ID</th>
                  <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Fecha</th>
                  <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Cliente</th>
                  <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs text-slate-500 uppercase whitespace-nowrap">Monto</th>
                  <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Medio</th>
                  <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Observación</th>
                  <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs text-slate-500 uppercase whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonosFiltrados.length === 0 ? (
                  <tr>
                    <td style={{paddingTop:"40px",paddingBottom:"40px"}} colSpan={7} className="text-center py-10 text-gray-400 text-sm">No se encontraron abonos</td>
                  </tr>
                ) : (
                  abonosFiltrados.map(abono => (
                    <tr key={abono.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-indigo-600 text-xs sm:text-sm whitespace-nowrap">#{abono.id}</td>
                      <td style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-xs sm:text-sm whitespace-nowrap">{formatearFechaCorta(abono.fecha)}</td>
                      <td style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-gray-700 text-xs sm:text-sm whitespace-nowrap">{abono.nombre_cliente}</td>
                      <td style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-right font-semibold text-xs sm:text-sm whitespace-nowrap">${abono.monto.toLocaleString('es-CO')}</td>
                      <td style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className={`text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap ${
                          abono.medio_pago === 'efectivo' ? 'bg-emerald-50 text-emerald-600' :
                          abono.medio_pago === 'transferencia' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {abono.medio_pago}
                        </span>
                      </td>
                      <td style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-xs sm:text-sm max-w-[120px] sm:max-w-[200px] truncate">{abono.observacion || '—'}</td>
                      <td style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-center">
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
          <div style={{padding:"16px 24px"}} className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
            <span className="text-xs sm:text-sm">Mostrando {abonosFiltrados.length} de {total} abonos</span>
            {totalPaginas > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => fetchAbonos(pagina - 1)}
                  disabled={pagina === 1}
                  style={{padding:"4px 12px"}} 
                  className="px-2 sm:px-3 py-1 border rounded-lg text-xs sm:text-sm disabled:opacity-30 hover:bg-gray-100"
                >
                  Anterior
                </button>
                <span style={{padding:"4px 12px"}} className="px-2 sm:px-3 py-1 text-xs sm:text-sm">{pagina} / {totalPaginas}</span>
                <button
                  onClick={() => fetchAbonos(pagina + 1)}
                  disabled={pagina === totalPaginas}
                  style={{padding:"4px 12px"}} 
                  className="px-2 sm:px-3 py-1 border rounded-lg text-xs sm:text-sm disabled:opacity-30 hover:bg-gray-100"
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
        <div style={{padding:"16px"}} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div style={{padding:"32px"}} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 sm:p-8 text-center">
            <div style={{marginBottom:"32px",marginLeft:"auto" ,marginRight:"auto"}} className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <AlertCircle size={28} className="sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <p style={{marginBottom:"12px"}} className="font-bold text-lg sm:text-xl text-slate-800 mb-2 sm:mb-3">¿Eliminar abono?</p>
            <p style={{marginBottom:"32px"}} className="text-sm text-slate-500 mb-6 sm:mb-8">
              El abono <strong>#{eliminarId}</strong> será eliminado y se revertirá su monto de la venta correspondiente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEliminarId(null)} disabled={eliminando}
                className="flex-1 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleEliminar} disabled={eliminando}
              style={{paddingTop:"12px",paddingBottom:"12px"}}
                className="flex-1 py-2.5 sm:py-3 border-none rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50">
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