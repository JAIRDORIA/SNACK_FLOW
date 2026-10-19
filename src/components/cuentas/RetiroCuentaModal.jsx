import { useEffect, useId, useState } from 'react';
import { AlertCircle, Loader2, PiggyBank, X } from 'lucide-react';
import { crearRetiro } from '@/api/medios_pago_api';
import { formatoMoneda } from '@/utils/formatoCifras';

// Modal "Retirar a ahorros" de una cuenta de transferencia.
//
// El backend descuenta el monto del saldo de la cuenta y registra un egreso
// con concepto "retiro". El usuario sale del token: no se envía usuario_id.
//
// El padre remonta el modal en cada apertura, por eso el monto se inicializa
// con el saldo completo de la cuenta sin efectos de sincronización.

const mensajeError = (err, porDefecto) =>
  err?.response?.data?.mensaje || err?.response?.data?.error || porDefecto;

export default function RetiroCuentaModal({ cuenta, onClose, onExito }) {
  const baseId = useId();
  const montoId = `${baseId}-monto`;
  const descripcionId = `${baseId}-descripcion`;
  const errorId = `${baseId}-error`;

  const saldo = Number(cuenta?.saldo_actual ?? cuenta?.saldo ?? 0);

  const [monto, setMonto] = useState(String(saldo));
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Cierre con Esc (salvo mientras guarda).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !guardando) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [guardando, onClose]);

  const montoNum = Number(monto);
  const montoValido = Number.isFinite(montoNum) && montoNum > 0 && montoNum <= saldo;
  const montoResumen = Number.isFinite(montoNum) && montoNum > 0 ? montoNum : 0;
  const restante = Math.max(0, saldo - montoResumen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando) return;

    setError('');

    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    if (montoNum > saldo) {
      setError(`El monto no puede superar el saldo actual ($${formatoMoneda(saldo)}).`);
      return;
    }

    const payload = { monto: montoNum };
    const descripcionLimpia = descripcion.trim();
    if (descripcionLimpia) payload.descripcion = descripcionLimpia;

    setGuardando(true);
    try {
      const res = await crearRetiro(cuenta.id, payload);
      setGuardando(false);
      onExito?.(res.data);
    } catch (err) {
      setGuardando(false);
      setError(mensajeError(err, 'No se pudo registrar el retiro.'));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={() => !guardando && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-retiro-cuenta"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* ── Encabezado ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
              <PiggyBank size={18} color="#818cf8" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="titulo-retiro-cuenta" className="text-base font-bold text-slate-800 m-0">
                Retirar a ahorros
              </h3>
              <p className="text-xs text-slate-500 m-0 truncate">
                {cuenta?.nombre || 'Cuenta de transferencia'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto">
          {/* Cuenta y saldo actual */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 m-0 leading-tight">
              Saldo actual
            </p>
            <p className="text-sm font-semibold text-slate-800 m-0 mt-0.5 tabular-nums">
              ${formatoMoneda(saldo)}
            </p>
          </div>

          {/* Monto */}
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <label
                htmlFor={montoId}
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Monto <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setMonto(String(saldo));
                  setError('');
                }}
                disabled={guardando || saldo <= 0}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded cursor-pointer"
              >
                Todo el saldo
              </button>
            </div>
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none"
              >
                $
              </span>
              <input
                id={montoId}
                type="number"
                min="0"
                max={saldo}
                step="0.01"
                inputMode="decimal"
                value={monto}
                onChange={(e) => {
                  setMonto(e.target.value);
                  setError('');
                }}
                autoFocus
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? errorId : undefined}
                className={`w-full min-h-[44px] border rounded-xl text-sm pl-8 pr-3.5 py-2.5 outline-none text-slate-700 bg-white transition-all placeholder:text-slate-400 focus:ring-3 tabular-nums ${
                  error
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-50'
                    : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'
                }`}
              />
            </div>
            {!montoValido && monto.trim() !== '' && (
              <p className="text-[11px] text-slate-400 mt-1.5 m-0">
                Debe ser mayor a 0 y no superar el saldo actual.
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor={descripcionId}
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Descripción <span className="text-slate-400 font-medium normal-case">(opcional)</span>
            </label>
            <input
              id={descripcionId}
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={200}
              autoComplete="off"
              placeholder="Retiro a ahorros"
              className="w-full min-h-[44px] border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 outline-none text-slate-700 bg-white transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 m-0">
              Por defecto: Retiro a ahorros
            </p>
          </div>

          {error && (
            <div
              id={errorId}
              role="alert"
              className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3"
            >
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-rose-700 m-0">{error}</p>
            </div>
          )}

          <div className="flex items-stretch gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 min-h-[44px] border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all py-2.5 px-3 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-[1.6] min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold leading-snug hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/30 disabled:opacity-50 py-2.5 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              {guardando ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Retirando...
                </>
              ) : (
                `Retirar $${formatoMoneda(montoResumen)} de ${cuenta?.nombre || 'la cuenta'}; quedará $${formatoMoneda(restante)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
