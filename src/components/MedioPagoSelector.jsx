/* eslint-disable react-refresh/only-export-components */
// Este archivo exporta, además del componente, los helpers `medioPagoValido` y
// `payloadMedioPago`. Se piden en el mismo archivo a propósito para que los
// módulos importen todo desde un solo lugar; por eso se desactiva la regla de
// Fast Refresh solo aquí.

import { useEffect, useId } from 'react'
import {
  Banknote,
  ArrowLeftRight,
  Check,
  ChevronDown,
  Loader2,
  Info,
  AlertCircle,
} from 'lucide-react'
import useMediosPagoStore from '@/store/useMediosPagoStore'

const OPCIONES = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
]

const VALOR_INICIAL = { medio_pago: 'efectivo', medio_pago_id: null }

// "nombre — titular" si hay titular; si no, solo el nombre.
const etiquetaCuenta = (cuenta) => {
  const nombre = (cuenta?.nombre || '').trim() || `Cuenta #${cuenta?.id ?? ''}`
  const titular = (cuenta?.titular || '').trim()
  return titular ? `${nombre} — ${titular}` : nombre
}

const tieneCuenta = (value) =>
  value?.medio_pago_id !== null &&
  value?.medio_pago_id !== undefined &&
  value?.medio_pago_id !== ''

/**
 * ¿El medio de pago elegido está completo?
 * - Efectivo: siempre válido.
 * - Transferencia: requiere `medio_pago_id`, salvo que se acepte histórico.
 *
 * @param {{ medio_pago?: string, medio_pago_id?: number|null }} value
 * @param {boolean} permitirHistorico
 * @returns {boolean}
 */
export function medioPagoValido(value, permitirHistorico = false) {
  if (value?.medio_pago !== 'transferencia') return true
  return tieneCuenta(value) || permitirHistorico === true
}

/**
 * Normaliza el medio de pago para enviarlo a la API.
 * Devuelve `{ medio_pago }` y añade `medio_pago_id` solo cuando es
 * transferencia con cuenta elegida. En transferencia sin cuenta (histórico)
 * devuelve solo `{ medio_pago: 'transferencia' }`, para que el backend
 * conserve la cuenta original.
 *
 * @param {{ medio_pago?: string, medio_pago_id?: number|null }} value
 * @returns {{ medio_pago: 'efectivo'|'transferencia', medio_pago_id?: number }}
 */
export function payloadMedioPago(value) {
  const esTransferencia = value?.medio_pago === 'transferencia'
  if (esTransferencia && tieneCuenta(value)) {
    return { medio_pago: 'transferencia', medio_pago_id: Number(value.medio_pago_id) }
  }
  return { medio_pago: esTransferencia ? 'transferencia' : 'efectivo' }
}

/**
 * Selector de medio de pago (Efectivo / Transferencia) con cuenta de destino.
 *
 * Props:
 * @param {{ medio_pago: 'efectivo'|'transferencia', medio_pago_id: number|null }} value
 * @param {(value: { medio_pago: 'efectivo'|'transferencia', medio_pago_id: number|null }) => void} onChange
 * @param {boolean} disabled
 * @param {string} error  Mensaje de validación del campo (se muestra debajo).
 * @param {boolean} permitirHistorico  Acepta transferencias sin cuenta asignada.
 */
export default function MedioPagoSelector({
  value = VALOR_INICIAL,
  onChange,
  disabled = false,
  error,
  permitirHistorico = false,
}) {
  const baseId = useId()
  const selectId = `${baseId}-cuenta`
  const errorId = `${baseId}-error`
  const historicoId = `${baseId}-historico`

  const { cuentas, cargando, cargado, error: errorCuentas, cargarCuentas } = useMediosPagoStore()

  // Las cuentas se comparten vía store: la primera vez pide y luego reutiliza.
  useEffect(() => {
    cargarCuentas()
  }, [cargarCuentas])

  const esTransferencia = value?.medio_pago === 'transferencia'
  const cuentaSeleccionada = esTransferencia && tieneCuenta(value) ? String(value.medio_pago_id) : ''

  // Transferencia antigua sin cuenta: se permite guardar/editando sin marcar error.
  const esHistorico = permitirHistorico && esTransferencia && !cuentaSeleccionada
  const mostrarError = Boolean(error) && !esHistorico
  const sinCuentas = cargado && !cargando && !errorCuentas && cuentas.length === 0

  const seleccionarMedio = (medio) => {
    if (disabled) return
    if (medio === 'efectivo') {
      onChange?.({ medio_pago: 'efectivo', medio_pago_id: null })
      return
    }
    // Al pasar de efectivo a transferencia se limpia la cuenta.
    // Si ya era transferencia, se conserva la cuenta elegida.
    onChange?.({
      medio_pago: 'transferencia',
      medio_pago_id: esTransferencia ? value?.medio_pago_id ?? null : null,
    })
  }

  const seleccionarCuenta = (e) => {
    const id = e.target.value ? Number(e.target.value) : null
    onChange?.({ medio_pago: 'transferencia', medio_pago_id: id })
  }

  const descrito = [mostrarError ? errorId : null, esHistorico ? historicoId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Medio de pago">
        {OPCIONES.map((opcion) => {
          const Icono = opcion.icon
          const activo = esTransferencia
            ? opcion.value === 'transferencia'
            : opcion.value === 'efectivo'

          return (
            <button
              key={opcion.value}
              type="button"
              aria-pressed={activo}
              disabled={disabled}
              onClick={() => seleccionarMedio(opcion.value)}
              className={`flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                activo
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icono size={15} aria-hidden="true" />
              {opcion.label}
            </button>
          )
        })}
      </div>

      {esTransferencia && (
        <div className="mt-2">
          <label
            htmlFor={selectId}
            className="block text-xs text-slate-500 mb-1"
          >
            Cuenta
          </label>

          <div className="relative">
            <select
              id={selectId}
              value={cuentaSeleccionada}
              onChange={seleccionarCuenta}
              disabled={disabled || cargando || cuentas.length === 0}
              aria-invalid={mostrarError || undefined}
              aria-describedby={descrito || undefined}
              className="w-full appearance-none border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed py-2 pr-9 pl-3"
            >
              <option value="">Selecciona la cuenta</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {etiquetaCuenta(cuenta)}
                </option>
              ))}
            </select>

            {cargando ? (
              <Loader2
                size={16}
                aria-hidden="true"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin pointer-events-none"
              />
            ) : (
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            )}
          </div>

          {errorCuentas && (
            <p
              role="alert"
              className="flex items-start gap-1.5 text-xs text-rose-600 mt-2 m-0"
            >
              <AlertCircle size={13} aria-hidden="true" className="shrink-0 mt-0.5" />
              {errorCuentas}
            </p>
          )}

          {esHistorico && (
            <span
              id={historicoId}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 mt-2 py-1 px-2.5"
            >
              <Check size={12} aria-hidden="true" />
              Cuenta sin asignar (histórico)
            </span>
          )}
        </div>
      )}

      {/* Sin cuentas asignables: se avisa aunque el medio elegido sea efectivo,
          para que el usuario sepa por qué no puede usar transferencia. */}
      {sinCuentas && !errorCuentas && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg mt-2 py-2 px-2.5 m-0">
          <Info size={13} aria-hidden="true" className="shrink-0 mt-0.5" />
          No hay cuentas de transferencia creadas. Créalas en la sección Cuentas.
        </p>
      )}

      {mostrarError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs text-rose-600 mt-2 m-0"
        >
          <AlertCircle size={13} aria-hidden="true" className="shrink-0 mt-0.5" />
          {error}
        </p>
      )}
    </div>
  )
}
