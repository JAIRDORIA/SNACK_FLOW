import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, PiggyBank, X } from 'lucide-react';
import { vaciarCuentas } from '@/api/medios_pago_api';
import { formatoMoneda } from '@/utils/formatoCifras';

// Confirmación de "Vaciar todas a ahorros".
//
// Envía POST /medios-pago/retiros/vaciar y muestra el resultado devuelto por
// el backend. El usuario sale del token: no se envía usuario_id.
//
// Si el backend responde 400 (por ejemplo, sin saldo), el mensaje se muestra
// dentro de este modal sin cerrarlo.

const mensajeError = (err, porDefecto) =>
  err?.response?.data?.mensaje || err?.response?.data?.error || porDefecto;

export default function VaciarCuentasModal({ cantidad, total, onClose, onExito }) {
  const [descripcion, setDescripcion] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  // Cierre con Esc (salvo mientras procesa).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !procesando) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [procesando, onClose]);

  const handleConfirmar = async () => {
    if (procesando) return;

    setError('');
    setProcesando(true);
    try {
      const descripcionLimpia = descripcion.trim();
      const payload = descripcionLimpia ? { descripcion: descripcionLimpia } : {};
      const res = await vaciarCuentas(payload);
      const data = res.data || {};

      setResultado({
        cantidad: Number(data.cantidad ?? cantidad ?? 0),
        total: Number(data.total ?? total ?? 0),
      });
      onExito?.(data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron vaciar las cuentas.'));
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={() => !procesando && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-vaciar-cuentas"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
              <PiggyBank size={18} color="#818cf8" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="titulo-vaciar-cuentas" className="text-base font-bold text-slate-800 m-0">
                Vaciar todas a ahorros
              </h3>
              <p className="text-xs text-slate-500 m-0 truncate">
                Retiro total de las cuentas de transferencia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={procesando}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {resultado ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} className="text-emerald-600" aria-hidden="true" />
            </div>
            <p className="text-base font-bold text-slate-800 m-0 mb-2">Cuentas vaciadas</p>
            <p className="text-sm text-slate-600 m-0">
              Se retiraron ${formatoMoneda(resultado.total)} de {resultado.cantidad}{' '}
              {resultado.cantidad === 1 ? 'cuenta' : 'cuentas'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full min-h-[44px] rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 m-0 leading-tight">
                  Cuentas con saldo
                </p>
                <p className="text-lg font-bold text-slate-800 m-0 mt-0.5 tabular-nums">
                  {cantidad}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-right">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 m-0 leading-tight">
                  Total a retirar
                </p>
                <p className="text-lg font-bold text-indigo-600 m-0 mt-0.5 tabular-nums">
                  ${formatoMoneda(total)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3 mt-4">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-amber-800 m-0 leading-relaxed">
                Este dinero dejará de contar en el dinero de caja.
              </p>
            </div>

            <div className="mt-4">
              <label
                htmlFor="descripcion-vaciar-cuentas"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Descripción{' '}
                <span className="text-slate-400 font-medium normal-case">(opcional)</span>
              </label>
              <input
                id="descripcion-vaciar-cuentas"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={200}
                autoComplete="off"
                placeholder="Retiro a ahorros"
                className="w-full min-h-[44px] border border-slate-200 rounded-xl text-sm px-3.5 py-2.5 outline-none text-slate-700 bg-white transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3 mt-4"
              >
                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-rose-700 m-0">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="flex-1 min-h-[44px] border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all py-2.5 px-3 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={procesando}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/30 disabled:opacity-50 py-2.5 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
              >
                {procesando ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    Vaciando...
                  </>
                ) : (
                  'Confirmar retiro'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
