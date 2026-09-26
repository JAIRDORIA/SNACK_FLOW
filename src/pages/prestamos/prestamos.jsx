import { useEffect, useState } from 'react'
import { usePrestamosStore } from '../../store/Useprestamosstore'
import NuevoPrestamoModal from '../../components/nuevoprestamomodal'
import AbonarPrestamoModal from '../../components/Pagarprestamomodal'
import { formatearFechaColombia } from '../../utils/formatearFecha'

export default function Prestamos() {
  const { prestamos, loading, error, filtroEstado, setFiltroEstado, fetchPrestamos } =
    usePrestamosStore()
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [prestamoAAbonar, setPrestamoAAbonar] = useState(null)

  useEffect(() => {
    fetchPrestamos()
  }, [])

  return (
    <div style={{padding:"24px"}} className="p-6">
      <div style={{marginBottom:"16px"}} className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#1B1D2E]">Préstamos a clientes</h1>
        <button
        style={{padding:"8px 16px"}}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap"
          onClick={() => setModalNuevoAbierto(true)}
        >
          + Nuevo préstamo
        </button>
      </div>

      <div style={{marginBottom:"16px"}} className="flex gap-2 mb-4">
        {['', 'pendiente', 'pagado'].map((estado) => (
          <button
            key={estado}
            style={{padding:"4px 12px"}}
            className={`px-3 py-1 text-sm rounded border ${filtroEstado === estado ? 'bg-gray-200' : ''}`}
            onClick={() => setFiltroEstado(estado)}
          >
            {estado === '' ? 'Todos' : estado === 'pendiente' ? 'Pendientes' : 'Pagados'}
          </button>
        ))}
      </div>

      {error && <p style={{marginBottom:"8px"}} className="text-red-600 text-sm mb-2">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead className="bg-slate-50">
            <tr>
              <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Cliente</th>
              <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Monto prestado</th>
              <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Abonado</th>
              <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Saldo pendiente</th>
              <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Observacion</th>
              <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Estado</th>
              <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Fecha préstamo</th>
              <th style={{padding:"12px 16px"}} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{padding:"16px 0px 16px 0px"}} className="text-center py-4">Cargando...</td></tr>
            )}
            {!loading && prestamos.length === 0 && (
              <tr><td colSpan={8} style={{padding:"16px 0px 16px 0px"}} className="text-center py-4 text-gray-500">No hay préstamos registrados</td></tr>
            )}
            {prestamos.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td style={{padding:"8px 12px"}} className="px-3 py-2">{p.cliente_nombre}</td>
                <td style={{padding:"8px 12px"}} className="px-3 py-2">${p.monto.toLocaleString('es-CO')}</td>
                <td style={{padding:"8px 12px"}} className="px-3 py-2 text-green-700">${p.total_abonado.toLocaleString('es-CO')}</td>
                <td style={{padding:"8px 12px"}} className="px-3 py-2 font-medium">${p.saldo_pendiente.toLocaleString('es-CO')}</td>
                <td style={{padding:"8px 12px"}} className="px-3 py-2 text-gray-500">{p.observacion || '—'}</td>
                <td style={{padding:"8px 12px"}} className="px-3 py-2">
                  <span style={{padding:"2px 8px"}} className={`px-2 py-0.5 rounded text-xs ${
                    p.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.estado}
                  </span>
                </td>
                <td style={{padding:"8px 12px"}} className="px-3 py-2">{formatearFechaColombia(p.fecha)}</td>
                <td style={{padding:"8px 12px"}} className="px-3 py-2 text-right">
                  {p.estado === 'pendiente' && (
                    <button
                    style={{padding:"4px 12px"}}
                      className="px-3 py-1 text-xs rounded bg-blue-600 text-white"
                      onClick={() => setPrestamoAAbonar(p)}
                    >
                      Abonar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NuevoPrestamoModal
        isOpen={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        onSuccess={fetchPrestamos}
      />

      {prestamoAAbonar && (
        <AbonarPrestamoModal
          prestamo={prestamoAAbonar}
          onClose={() => setPrestamoAAbonar(null)}
          onSuccess={fetchPrestamos}
        />
      )}
    </div>
  )
}