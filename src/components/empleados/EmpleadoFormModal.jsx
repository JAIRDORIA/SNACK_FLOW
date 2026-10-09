import { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Check, UserRoundPlus, UserRoundPen } from 'lucide-react';

// Modal "Nuevo empleado" / "Editar empleado" (solo admin).
//
// Un único campo obligatorio: Nombre. Se recorta al guardar (sin espacios al
// inicio ni al final) y se limita a 100 caracteres con contador discreto.
//
// El guardado NO se hace aquí: el padre recibe `onGuardar(nombre)` y devuelve
// el resultado, de modo que un error del backend (409 nombre repetido, 400
// validación) se muestre dentro del modal sin cerrarlo.
//
// Diseño (ui-ux-pro-max): etiqueta visible, ayuda bajo el campo, foco visible,
// botón deshabilitado mientras guarda (sin dobles envíos) y objetivos táctiles
// de 44px.
const MAX_NOMBRE = 100;

export default function EmpleadoFormModal({ open, empleado, onClose, onGuardar }) {
  const esEdicion = Boolean(empleado);
  // El estado se inicializa desde el prop y el padre remonta este modal con un
  // `key` distinto cada vez que lo abre. Así no hace falta un efecto que
  // sincronice el estado con los props (patrón recomendado por React para
  // "resetear estado al abrir") y se evitan renders en cascada.
  const [nombre, setNombre] = useState(empleado?.nombre || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

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

  const nombreLimpio = nombre.trim();
  const puedeGuardar = nombreLimpio.length > 0 && !guardando;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeGuardar) return;

    setGuardando(true);
    setError('');
    const res = await onGuardar(nombreLimpio);
    setGuardando(false);

    if (!res?.ok) {
      // 409 / 400 u otro: se muestra el mensaje del backend sin cerrar el modal.
      setError(res?.mensaje || 'No se pudo guardar el empleado');
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
        aria-labelledby="titulo-empleado-form"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
              {esEdicion ? (
                <UserRoundPen size={18} color="#818cf8" aria-hidden="true" />
              ) : (
                <UserRoundPlus size={18} color="#818cf8" aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 id="titulo-empleado-form" className="text-base font-bold text-slate-800 m-0">
                {esEdicion ? 'Editar empleado' : 'Nuevo empleado'}
              </h3>
              <p className="text-xs text-slate-500 m-0">
                {esEdicion
                  ? 'Cambia el nombre que se muestra en producción'
                  : 'Aparecerá en la pantalla de producción de la sala'}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div>
            <label
              htmlFor="empleado-nombre"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              id="empleado-nombre"
              type="text"
              value={nombre}
              onChange={(e) => {
                // Se recorta el sobrante ya al escribir y se aplica el tope.
                setNombre(e.target.value.slice(0, MAX_NOMBRE));
                setError('');
              }}
              placeholder="Ej: María López"
              maxLength={MAX_NOMBRE}
              autoFocus
              autoComplete="off"
              disabled={guardando}
              aria-invalid={Boolean(error)}
              className="w-full mt-1.5 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none text-slate-700 bg-white transition-all focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 placeholder:text-slate-400 disabled:bg-slate-50"
            />
            {/* Contador discreto: solo se nota cuando el nombre es largo. */}
            <div className="flex items-center justify-between mt-1.5 gap-3">
              <p className="text-[11px] text-slate-400 m-0">Máximo {MAX_NOMBRE} caracteres.</p>
              <span
                className={`text-[11px] tabular-nums m-0 ${
                  nombre.length >= MAX_NOMBRE ? 'text-amber-600 font-semibold' : 'text-slate-400'
                }`}
              >
                {nombre.length}/{MAX_NOMBRE}
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3"
            >
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-rose-700 m-0">{error}</p>
            </div>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 min-h-[44px] py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeGuardar}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              {guardando ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check size={15} aria-hidden="true" />
                  {esEdicion ? 'Guardar cambios' : 'Crear empleado'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
