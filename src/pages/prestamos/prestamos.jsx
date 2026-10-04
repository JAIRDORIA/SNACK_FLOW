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
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#1B1D2E]">Préstamos a clientes</h1>
        <button

          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap py-2 px-4"
          onClick={() => setModalNuevoAbierto(true)}
        >
          + Nuevo préstamo
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'pendiente', 'pagado'].map((estado) => (
          <button
            key={estado}

            className={`px-3 py-1 text-sm rounded border ${filtroEstado === estado ? 'bg-gray-200' : ''}`}
            onClick={() => setFiltroEstado(estado)}
          >
            {estado === '' ? 'Todos' : estado === 'pendiente' ? 'Pendientes' : 'Pagados'}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Cliente</th>
                <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Monto prestado</th>
                <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Abonado</th>
                <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Saldo pendiente</th>
                <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Observacion</th>
                <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Estado</th>
                <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Fecha préstamo</th>
                <th className="sm:px-4 sm:py-3 text-left text-xs text-slate-500 uppercase whitespace-nowrap py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-4 px-0">Cargando...</td></tr>
              )}
              {!loading && prestamos.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-500 py-4 px-0">No hay préstamos registrados</td></tr>
              )}
              {prestamos.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-2 px-3">{p.cliente_nombre}</td>
                  <td className="py-2 px-3">${p.monto.toLocaleString('es-CO')}</td>
                  <td className="text-green-700 py-2 px-3">${p.total_abonado.toLocaleString('es-CO')}</td>
                  <td className="font-medium py-2 px-3">${p.saldo_pendiente.toLocaleString('es-CO')}</td>
                  <td className="text-gray-500 py-2 px-3 max-w-[200px] truncate">{p.observacion || '—'}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      p.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">{formatearFechaColombia(p.fecha)}</td>
                  <td className="text-right py-2 px-3">
                    {p.estado === 'pendiente' && (
                      <button

                        className="text-xs rounded bg-blue-600 text-white py-1 px-3 whitespace-nowrap"
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