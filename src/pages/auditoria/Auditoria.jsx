import { useEffect, useState } from 'react'
import { Search, Loader2, AlertCircle, Eye, Clock, User, FileText, Tag } from 'lucide-react'
import useAuditoriaStore from '@/store/useAuditoriaStore'
import { formatearFechaColombia } from '@/utils/formatearFecha'
// Colores según tipo de acción
const ACCION_CONFIG = {
  INSERT: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Creación' },
  UPDATE: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Edición' },
  DELETE: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Eliminación' },
}

export default function Auditoria() {
  const {
    registros, total, pagina, totalPaginas, cargando, error,
    fetchAuditoria,
  } = useAuditoriaStore()

  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchAuditoria()
  }, [])

  const registrosFiltrados = registros.filter(r => {
    const q = busqueda.toLowerCase()
    return (
      String(r.id).includes(q) ||
      r.usuario_nombre?.toLowerCase().includes(q) ||
      r.accion?.toLowerCase().includes(q) ||
      r.tabla_afectada?.toLowerCase().includes(q) ||
      r.descripcion?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{padding:"16px"}} className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-auto">

      {/* Header */}
      <div style={{marginBottom:"24px"}} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#1B1D2E]">Auditoría</h1>
          <p style={{marginTop:"4px"}} className="text-xs sm:text-sm text-gray-400 mt-1">Registro de todas las operaciones del sistema</p>
        </div>
      </div>

      {/* Buscador */}
      <div style={{marginBottom:"16px"}} className="relative w-full sm:w-80 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por usuario, acción, tabla..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{padding:"8px 16px 8px 36px"}}
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
        />
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={{paddingTop:"80px",paddingBottom:"80px"}} className="flex justify-center py-20">
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
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50">
                  <th style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">ID</th>
                  <th style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Usuario</th>
                  <th style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Acción</th>
                  <th style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Tabla</th>
                  <th style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Descripción</th>
                  <th style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length === 0 ? (
                  <tr>
                    <td style={{paddingTop:"40px",paddingBottom:"40px"}}  colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                      No hay registros de auditoría
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map(registro => {
                    const accionCfg = ACCION_CONFIG[registro.accion] || { bg: 'bg-gray-50', text: 'text-gray-500', label: registro.accion }
                    return (
                      <tr key={registro.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-indigo-600 text-xs sm:text-sm whitespace-nowrap">
                          #{registro.id}
                        </td>
                        <td style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                              <User size={12} className="text-indigo-500" />
                            </div>
                            {registro.usuario_nombre}
                          </div>
                        </td>
                        <td style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                          <span style={{padding:"2px 8px"}} className={`inline-flex items-center gap-1 text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium ${accionCfg.bg} ${accionCfg.text}`}>
                            {accionCfg.label}
                          </span>
                        </td>
                        <td style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Tag size={12} className="text-gray-400" />
                            {registro.tabla_afectada}
                          </span>
                        </td>
                        <td style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm max-w-[200px] sm:max-w-[300px] truncate">
                          {registro.descripcion}
                        </td>
                        <td style={{padding:"8px 12px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {formatearFechaColombia(registro.fecha)}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div style={{padding:"12px 16px"}} className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
            <span className="text-xs sm:text-sm">
              Mostrando {registrosFiltrados.length} de {total} registros
            </span>
            {totalPaginas > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => fetchAuditoria(pagina - 1)}
                  disabled={pagina === 1}
                  style={{padding:"4px 8px"}}
                  className="px-2 sm:px-3 py-1 border rounded-lg text-xs sm:text-sm disabled:opacity-30 hover:bg-gray-100"
                >
                  Anterior
                </button>
                <span style={{padding:"4px 8px"}} className="px-2 sm:px-3 py-1 text-xs sm:text-sm">{pagina} / {totalPaginas}</span>
                <button
                  onClick={() => fetchAuditoria(pagina + 1)}
                  disabled={pagina === totalPaginas}
                  style={{padding:"4px 8px"}}
                  className="px-2 sm:px-3 py-1 border rounded-lg text-xs sm:text-sm disabled:opacity-30 hover:bg-gray-100"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}