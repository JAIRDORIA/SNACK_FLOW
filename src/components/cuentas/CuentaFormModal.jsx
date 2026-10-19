import { useEffect, useId, useState } from 'react';
import { AlertCircle, AlertTriangle, Landmark, Loader2, X } from 'lucide-react';

// Modal "Nueva cuenta" / "Editar cuenta" de transferencia.
//
// El guardado NO se hace aquí: el padre recibe `onGuardar(payload)` y devuelve
// `{ ok, mensaje, campo }`. Así un 409 de nombre duplicado se muestra bajo el
// campo Nombre sin cerrar el modal.
//
// El padre remonta este modal con un `key` distinto en cada apertura, por eso el
// estado se inicializa desde el prop `cuenta` sin efectos de sincronización.
//
// Diseño (ui-ux-pro-max): etiquetas visibles, ayudas bajo el campo, error junto
// al campo con `role="alert"` y `aria-describedby`, foco visible y 44px de alto
// mínimo en los controles.

const MAX_NOMBRE = 80;
const MAX_TITULAR = 100;

export default function CuentaFormModal({ open, cuenta, onClose, onGuardar }) {
  const esEdicion = Boolean(cuenta);
  const baseId = useId();
  const nombreId = `${baseId}-nombre`;
  const titularId = `${baseId}-titular`;
  const saldoId = `${baseId}-saldo`;
  const ayudaSaldoId = `${baseId}-ayuda-saldo`;
  const errorNombreId = `${baseId}-error-nombre`;
  const errorSaldoId = `${baseId}-error-saldo`;

  const [nombre, setNombre] = useState(cuenta?.nombre || '');
  const [titular, setTitular] = useState(cuenta?.titular || '');
  const [saldoInicial, setSaldoInicial] = useState(
    cuenta?.saldo_inicial !== undefined && cuenta?.saldo_inicial !== null
      ? String(cuenta.saldo_inicial)
      : '',
  );
  const [guardando, setGuardando] = useState(false);
  const [errorNombre, setErrorNombre] = useState('');
  const [errorSaldo, setErrorSaldo] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  // Cierre con Esc (salvo mientras guarda).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !guardando) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, guardando, onClose]);

  if (!open) return null;

  const saldoNum = saldoInicial.trim() === '' ? 0 : Number(saldoInicial);
  // Aviso solo en edición y solo si el saldo inicial cambia respecto al original.
  const saldoCambiado =
    esEdicion && saldoNum !== Number(cuenta?.saldo_inicial ?? 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando) return;

    const nombreLimpio = nombre.trim();
    const titularLimpio = titular.trim();
    const errores = {};

    if (!nombreLimpio) {
      errores.nombre = 'Escribe el nombre de la cuenta.';
    }
    if (Number.isNaN(saldoNum) || saldoNum < 0) {
      errores.saldo = 'El saldo inicial debe ser un número mayor o igual a 0.';
    }

    setErrorNombre(errores.nombre || '');
    setErrorSaldo(errores.saldo || '');
    setErrorGeneral('');
    if (errores.nombre || errores.saldo) return;

    // Al crear NO se envía "orden": lo asigna el backend.
    // Al editar se conserva el orden actual de la cuenta.
    const payload = {
      nombre: nombreLimpio,
      titular: titularLimpio,
      saldo_inicial: saldoNum,
    };
    if (esEdicion) payload.orden = cuenta?.orden ?? 0;

    setGuardando(true);
    const res = await onGuardar(payload);
    setGuardando(false);

    if (!res?.ok) {
      if (res?.campo === 'nombre') setErrorNombre(res.mensaje);
      else if (res?.campo === 'saldo') setErrorSaldo(res.mensaje);
      else setErrorGeneral(res?.mensaje || 'No se pudo guardar la cuenta.');
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={() => !guardando && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cuenta-form"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
              <Landmark size={18} color="#818cf8" aria-hidden="true" />
            </div>
            <div>
              <h3 id="titulo-cuenta-form" className="text-base font-bold text-slate-800 m-0">
                {esEdicion ? 'Editar cuenta' : 'Nueva cuenta'}
              </h3>
              <p className="text-xs text-slate-500 m-0">
                {esEdicion
                  ? 'Actualiza los datos de la cuenta de transferencia'
                  : 'Cuenta de transferencia para registrar cobros'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto">
          {/* Nombre */}
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <label
                htmlFor={nombreId}
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Nombre <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {nombre.length}/{MAX_NOMBRE}
              </span>
            </div>
            <input
              id={nombreId}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={MAX_NOMBRE}
              autoComplete="off"
              placeholder="Ej. Nequi Miguel"
              aria-invalid={Boolean(errorNombre) || undefined}
              aria-describedby={errorNombre ? errorNombreId : undefined}
              className={`w-full min-h-[44px] border rounded-xl text-sm px-3.5 py-2.5 outline-none text-slate-700 bg-white transition-all placeholder:text-slate-400 focus:ring-3 ${
                errorNombre
                  ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-50'
                  : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'
              }`}
            />
            {errorNombre && (
              <p
                id={errorNombreId}
                role="alert"
                className="flex items-start gap-1.5 text-xs text-rose-600 mt-1.5 m-0"
              >
                <AlertCircle size={13} aria-hidden="true" className="shrink-0 mt-0.5" />
                {errorNombre}
              </p>
            )}
          </div>

          {/* Titular */}
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <label
                htmlFor={titularId}
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Titular <span className="text-slate-400 font-medium normal-case">(opcional)</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {titular.length}/{MAX_TITULAR}
              </span>
            </div>
            <input
              id={titularId}
              type="text"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              maxLength={MAX_TITULAR}
              autoComplete="off"
              placeholder="Ej. Miguel Cantillo"
              className="w-full min-h-[44px] border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 outline-none text-slate-700 bg-white transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50"
            />
          </div>

          {/* Saldo inicial */}
          <div>
            <label
              htmlFor={saldoId}
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Saldo inicial
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none"
              >
                $
              </span>
              <input
                id={saldoId}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                placeholder="0"
                aria-invalid={Boolean(errorSaldo) || undefined}
                aria-describedby={[ayudaSaldoId, errorSaldo ? errorSaldoId : null]
                  .filter(Boolean)
                  .join(' ')}
                className={`w-full min-h-[44px] border rounded-xl text-sm pl-8 pr-3.5 py-2.5 outline-none text-slate-700 bg-white transition-all placeholder:text-slate-400 focus:ring-3 tabular-nums ${
                  errorSaldo
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-50'
                    : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'
                }`}
              />
            </div>
            <p id={ayudaSaldoId} className="text-[11px] text-slate-400 mt-1.5 m-0">
              Escribe cuánto dinero tiene esta cuenta hoy. Desde ahora el sistema suma y resta los
              movimientos.
            </p>

            {saldoCambiado && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl mt-2 py-2 px-3">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[11px] text-amber-700 m-0 leading-relaxed">
                  Cambiar el saldo inicial modifica el saldo actual de la cuenta.
                </p>
              </div>
            )}

            {errorSaldo && (
              <p
                id={errorSaldoId}
                role="alert"
                className="flex items-start gap-1.5 text-xs text-rose-600 mt-1.5 m-0"
              >
                <AlertCircle size={13} aria-hidden="true" className="shrink-0 mt-0.5" />
                {errorSaldo}
              </p>
            )}
          </div>

          {errorGeneral && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3"
            >
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-rose-700 m-0">{errorGeneral}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 min-h-[44px] border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all py-2.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/30 disabled:opacity-50 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              {guardando ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                esEdicion ? 'Guardar cambios' : 'Crear cuenta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
