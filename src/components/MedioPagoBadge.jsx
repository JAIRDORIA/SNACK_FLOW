// Insignia reutilizable del medio de pago.
//
// - efectivo      → verde, "Efectivo"
// - transferencia → azul, nombre de la cuenta (o "Transferencia" si no hay)
// - otro valor    → gris, texto capitalizado
//
// Mismo tamaño y estilo que la insignia que usaba la tabla de Abonos.

const ESTILO_EFECTIVO = 'bg-emerald-50 text-emerald-600'
const ESTILO_TRANSFERENCIA = 'bg-blue-50 text-blue-600'
const ESTILO_OTRO = 'bg-gray-100 text-gray-600'

const capitalizar = (texto) => {
  const valor = String(texto ?? '').trim()
  if (!valor) return '—'
  return valor.charAt(0).toUpperCase() + valor.slice(1)
}

export default function MedioPagoBadge({ medioPago, nombre }) {
  const esEfectivo = medioPago === 'efectivo'
  const esTransferencia = medioPago === 'transferencia'

  const etiqueta = esEfectivo
    ? 'Efectivo'
    : esTransferencia
      ? (nombre || '').trim() || 'Transferencia'
      : capitalizar(medioPago)

  const estilo = esEfectivo
    ? ESTILO_EFECTIVO
    : esTransferencia
      ? ESTILO_TRANSFERENCIA
      : ESTILO_OTRO

  return (
    <span
      className={`inline-flex items-center max-w-[200px] text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap ${estilo}`}
      title={etiqueta}
    >
      <span className="truncate min-w-0">{etiqueta}</span>
    </span>
  )
}
