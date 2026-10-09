import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, UserRoundMinus } from 'lucide-react';

// Confirmación para DESACTIVAR un empleado.
//
// Se pide confirmación porque el efecto no es obvio: el empleado desaparece de
// la pantalla de producción (ya no podrá registrar), aunque su historial se
// conserva. Activar NO pide confirmación, así que este modal no se usa para eso.
//
// Diseño (ui-ux-pro-max): acción destructiva con confirmación explícita,
// lenguaje que explica la consecuencia, foco visible y 44px de alto mínimo.
export default function ConfirmarDesactivarModal({ open, empleado, onClose, onConfirmar }) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  // Cierre con Esc (salvo mientras procesa).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !procesando) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, procesando, onClose]);

  if (!open) return null;

  const handleConfirmar = async () => {
    if (procesando) return;
    setProcesando(true);
    setError('');
    const res = await onConfirmar();
    setProcesando(false);
    if (!res?.ok) {
      setError(res?.mensaje || 'No se pudo desactivar el empleado');
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={() => !procesando && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-desactivar-empleado"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-7 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <UserRoundMinus size={26} className="text-amber-600" aria-hidden="true" />
        </div>

        <p id="titulo-desactivar-empleado" className="font-bold text-lg text-slate-800 m-0 mb-2">
          ¿Desactivar empleado?
        </p>
        <p className="text-sm text-slate-500 leading-relaxed m-0 mb-1">
          <strong className="text-slate-700">{empleado?.nombre}</strong>
        </p>
        <p className="text-sm text-slate-500 leading-relaxed m-0 mb-6">
          El empleado dejará de aparecer en la pantalla de producción. Su historial se
          conserva.
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3 mb-5 text-left"
          >
            <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-rose-700 m-0">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={procesando}
            className="flex-1 min-h-[44px] border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={procesando}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all shadow-md shadow-amber-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 cursor-pointer"
          >
            {procesando ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                Desactivando...
              </>
            ) : (
              'Sí, desactivar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
