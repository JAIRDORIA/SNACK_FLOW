import { useEffect, useState } from 'react'
import { usePrestamosStore } from '@/store/Useprestamosstore' 
import NuevoPrestamoModal from '@/components/nuevoprestamomodal'
import PagarPrestamoModal from '@/components/Pagarprestamomodal'
import { formatearFechaColombia } from '@/utils/formatearFecha'

export default function Prestamos() {
  const { prestamos, loading, error, filtroEstado, setFiltroEstado, fetchPrestamos } =
    usePrestamosStore()
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [prestamoAPagar, setPrestamoAPagar] = useState(null)

  useEffect(() => {
    fetchPrestamos()
  }, [])

  return (
    <div style={{padding:"24px"}} className="p-6">
      <div style={{marginBottom:"16px"}} className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Préstamos a clientes</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
          style={{padding:"8px 16px"}}
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

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th style={{padding:"8px 12px"}} className="text-left px-3 py-2">Cliente</th>
              <th style={{padding:"8px 12px"}}  className="text-left px-3 py-2">Monto</th>
              <th style={{padding:"8px 12px"}}  className="text-left px-3 py-2">Prestado en</th>
              <th style={{padding:"8px 12px"}}  className="text-left px-3 py-2">Estado</th>
              <th style={{padding:"8px 12px"}}  className="text-left px-3 py-2">Pagado en</th>
              <th style={{padding:"8px 12px"}}  className="text-left px-3 py-2">Fecha préstamo</th>
              <th style={{padding:"8px 12px"}}  className="text-left px-3 py-2">Fecha de pago</th>
              <th style={{padding:"8px 12px"}}  className="text-left px-3 py-2">Observación</th>
              <th style={{padding:"8px 12px"}}  className="text-right px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={{paddingTop:"16px",paddingBottom:"16px"}} className="text-center py-4">Cargando...</td></tr>
            )}
            {!loading && prestamos.length === 0 && (
              <tr><td colSpan={9} className="text-center py-4 text-gray-500">No hay préstamos registrados</td></tr>
            )}
            {prestamos.map((p) => (
              <tr key={p.id} className="border-t">
                <td style={{padding:"8px 12px"}}  className="px-3 py-2">{p.cliente_nombre}</td>
                <td style={{padding:"8px 12px"}}  className="px-3 py-2">${p.monto.toLocaleString('es-CO')}</td>
                <td style={{padding:"8px 12px"}}  className="px-3 py-2 capitalize">{p.medio_pago}</td>
                <td style={{padding:"8px 12px"}}  className="px-3 py-2">
                  <span style={{padding:"2px 8px"}}  className={`px-2 py-0.5 rounded text-xs ${
                    p.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.estado}
                  </span>
                </td>
                <td style={{padding:"8px 12px"}}  className="px-3 py-2 capitalize">{p.medio_pago_pago || '—'}</td>
                <td style={{padding:"8px 12px"}}  className="px-3 py-2">{formatearFechaColombia(p.fecha)}</td>
                <td style={{padding:"8px 12px"}}  className="px-3 py-2">{p.fecha_pago ? formatearFechaColombia(p.fecha_pago) : '—'}</td>
                <td style={{padding:"8px 12px"}}  className="px-3 py-2">{p.observacion || '—'}</td>
                <td style={{padding:"8px 12px"}}  className="px-3 py-2 text-right">
                  {p.estado === 'pendiente' && (
                    <button
                    style={{padding:"4px 12px"}} 
                      className="px-3 py-1 text-xs rounded bg-green-600 text-white"
                      onClick={() => setPrestamoAPagar(p)}
                    >
                      Marcar pagado
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

      {prestamoAPagar && (
        <PagarPrestamoModal
          prestamo={prestamoAPagar}
          onClose={() => setPrestamoAPagar(null)}
          onSuccess={fetchPrestamos}
        />
      )}
    </div>
  )
}