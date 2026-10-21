import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, PowerOff, Trash2 } from 'lucide-react';

// Confirmación de acciones sobre una cuenta de transferencia:
//   • accion="desactivar": deja de estar disponible para nuevas transferencias,
//     pero conserva saldo e historial.
//   • accion="eliminar": irreversible. Si el backend responde 409 (la cuenta
//     tiene movimientos) se muestra su mensaje y se sugiere desactivarla.
//
// El padre remonta el modal con un `key` distinto en cada apertura, por eso el
// estado local (procesando / error) arranca limpio.
//
// Diseño (ui-ux-pro-max): confirmación explícita antes de una acción destructiva,
// consecuencia explicada, contraste suficiente, foco visible y 44px mínimos.

const CONFIG = {
  desactivar: {
    Icono: PowerOff,
    titulo: '¿Desactivar cuenta?',
    descripcion:
      'La cuenta dejará de estar disponible para nuevas transferencias. Su saldo y sus movimientos se conservan.',
    confirmar: 'Sí, desactivar',
    procesando: 'Desactivando...',
    iconoClases: 'bg-amber-50 border-amber-200 text-amber-600',
    botonClases:
      'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 shadow-amber-500/30',
  },
  eliminar: {
    Icono: Trash2,
    titulo: '¿Eliminar cuenta?',
    descripcion:
      'Esta acción no se puede deshacer. Si la cuenta tiene movimientos, el sistema no permitirá eliminarla.',
    confirmar: 'Sí, eliminar',
    procesando: 'Eliminando...',
    iconoClases: 'bg-rose-50 border-rose-200 text-rose-600',
    botonClases:
      'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 shadow-rose-500/30',
  },
};

export default function ConfirmarCuentaModal({
  open,
  cuenta,
  accion = 'desactivar',
  onClose,
  onConfirmar,
}) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [estadoError, setEstadoError] = useState(null);

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

  const cfg = CONFIG[accion] || CONFIG.desactivar;
  const { Icono } = cfg;
  const esEliminar = accion === 'eliminar';

  const handleConfirmar = async () => {
    if (procesando) return;
    setProcesando(true);
    setError('');
    setEstadoError(null);

    const res = await onConfirmar();
    setProcesando(false);

    if (!res?.ok) {
      setError(res?.mensaje || 'No se pudo completar la acción.');
      setEstadoError(res?.status ?? null);
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
        aria-labelledby="titulo-confirmar-cuenta"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-7 text-center"
      >
        <div
          className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${cfg.iconoClases}`}
        >
          <Icono size={26} aria-hidden="true" />
        </div>

        <p id="titulo-confirmar-cuenta" className="font-bold text-lg text-slate-800 m-0 mb-2">
          {cfg.titulo}
        </p>
        <p className="text-sm text-slate-500 leading-relaxed m-0 mb-1">
          <strong className="text-slate-700">{cuenta?.nombre}</strong>
          {cuenta?.titular ? ` — ${cuenta.titular}` : ''}
        </p>
        <p className="text-sm text-slate-500 leading-relaxed m-0 mb-6">{cfg.descripcion}</p>

        {error && (
          <div
            role="alert"
            className="text-left flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3 mb-5"
          >
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-rose-700 m-0">{error}</p>
              {esEliminar && estadoError === 409 && (
                <p className="text-xs text-rose-600 mt-1 m-0">
                  Puedes desactivarla para dejar de usarla sin borrar sus movimientos.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={procesando}
            className="flex-1 min-h-[44px] py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={procesando}
            className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer ${cfg.botonClases}`}
          >
            {procesando ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                {cfg.procesando}
              </>
            ) : (
              cfg.confirmar
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
