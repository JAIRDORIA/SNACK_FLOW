import { useState, useEffect, useRef } from 'react';
import {
  X,
  ClipboardCheck,
  AlertTriangle,
  Loader2,
  Check,
  XCircle,
  Package,
  User,
  Info,
  RefreshCw,
} from 'lucide-react';
import { usePorValidarProduccionStore } from '@/store/usePorValidarProduccionStore';
import useInventarioStore from '@/store/useInventarioStore';

// Modal "Producciones por validar" (solo admin).
//
// Los empleados registran bandejas/unidades sueltas que quedan `pendiente` y NO
// entran al inventario hasta que un admin las valida aquí. Aceptar SUMA al
// inventario, así que cada fila pide confirmación explícita y muestra antes una
// vista previa de lo que realmente va a entrar (el backend normaliza las
// sueltas que completan bandeja; replicamos ese cálculo para la previsualización).
//
// Diseño (ui-ux-pro-max): densidad media, etiquetas visibles en los campos,
// objetivos táctiles >=44px, foco visible, confirmación antes de acciones
// irreversibles y feedback breve de éxito.

// Topes del contrato del backend.
const MAX_BANDEJAS = 9999;
const MAX_SUELTAS = 99999;

// ── Helpers de formato ──

// `created_at` llega como UTC sin zona: "YYYY-MM-DD HH:mm:ss". Se convierte a
// America/Bogota (regla del proyecto: la conversión se hace solo al presentar).
//
// El formato es fijo, así que se parsean los componentes a mano y se construye
// el Date como UTC explícito. No se usa `new Date("YYYY-MM-DD HH:mm:ss")` porque
// eso se interpreta como hora LOCAL (y en un navegador de Bogotá daría un
// resultado desplazado). Si algún día llega un ISO con zona (Z / +00:00) se
// respeta su offset.
const formatearHoraColombia = (fechaUtc) => {
  if (!fechaUtc) return '';
  const s = String(fechaUtc).trim();

  let fecha;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    fecha = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
  } else {
    fecha = new Date(s);
  }
  if (isNaN(fecha.getTime())) return s;

  const hora = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha);

  // Clave de día en Colombia para decidir "Hoy" vs fecha corta.
  const claveDia = (d) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

  if (claveDia(fecha) === claveDia(new Date())) return `Hoy ${hora}`;

  const fechaCorta = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
  }).format(fecha);

  return `${fechaCorta} ${hora}`;
};

// Pluraliza de forma simple: 1 bandeja / 2 bandejas.
const plural = (cantidad, singular, pluralForma) =>
  `${cantidad} ${cantidad === 1 ? singular : pluralForma}`;

// Vista previa en cliente: las sueltas que completan una bandeja se suman a las
// bandejas y dejan el residuo. Misma normalización que hace el backend.
const normalizar = (bandejas, sueltas, unidadesPorBandeja) => {
  const porBandeja = Number(unidadesPorBandeja) || 0;
  const b = Number(bandejas) || 0;
  const s = Number(sueltas) || 0;
  if (porBandeja <= 0) return { bandejas: b, sueltas: s };
  return {
    bandejas: b + Math.floor(s / porBandeja),
    sueltas: s % porBandeja,
  };
};

// Convierte a entero dentro de rango. Devuelve '' para vacío (campo en edición).
const aEntero = (valor, max) => {
  if (valor === '') return '';
  const n = Number(valor);
  if (!Number.isFinite(n)) return '';
  return Math.min(Math.max(Math.floor(n), 0), max);
};

// ── Fila ──

function FilaProduccion({ item, onResultado }) {
  const { aceptar, rechazar } = usePorValidarProduccionStore();

  const porBandeja = Number(item.unidades_por_bandeja) || 0;
  const bandejasOriginal = Number(item.bandejas) || 0;
  const sueltasOriginal = Number(item.unidades_sueltas) || 0;

  const [bandejas, setBandejas] = useState(String(bandejasOriginal));
  const [sueltas, setSueltas] = useState(String(sueltasOriginal));
  const [confirmandoAceptar, setConfirmandoAceptar] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const b = Number(bandejas) || 0;
  const s = Number(sueltas) || 0;

  const ambosEnCero = b === 0 && s === 0;
  const modificado = b !== bandejasOriginal || s !== sueltasOriginal;
  const previa = normalizar(b, s, porBandeja);

  const handleAceptar = async () => {
    if (enviando) return;
    setEnviando(true);
    setError('');

    // Sin cambios -> PUT sin body (entra lo registrado tal cual).
    // Con cambios -> se mandan AMBOS campos, como exige el backend.
    const body = modificado ? { bandejas: b, unidades_sueltas: s } : null;
    const res = await aceptar(item.id, body);
    setEnviando(false);

    if (res.ok) {
      onResultado?.('aceptada', 'Producción aceptada');
      return;
    }
    if (res.conflicto) {
      onResultado?.('conflicto', res.mensaje);
      return;
    }
    // 400/404 u otro: se muestra el mensaje del backend en la fila, sin cerrar.
    setError(res.mensaje);
    setConfirmandoAceptar(false);
  };

  const handleRechazar = async () => {
    if (enviando) return;
    setEnviando(true);
    setError('');
    const res = await rechazar(item.id, motivo.trim() || null);
    setEnviando(false);

    if (res.ok) {
      onResultado?.('rechazada', 'Producción rechazada');
      return;
    }
    if (res.conflicto) {
      onResultado?.('conflicto', res.mensaje);
      return;
    }
    setError(res.mensaje);
  };

  return (
    <div className="shrink-0 border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="p-4 flex flex-col gap-4">
        {/* ── Encabezado de la fila: empleado, producto, hora ── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <User size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-800 truncate">
                {item.empleado_nombre || 'Empleado'}
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                {formatearHoraColombia(item.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Package size={14} className="text-indigo-500 shrink-0" aria-hidden="true" />
              <span className="text-sm text-slate-600 truncate">
                {item.producto_nombre || 'Producto'}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center text-[11px] rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 py-1 px-2.5 shrink-0">
            Registrado: {plural(bandejasOriginal, 'bandeja', 'bandejas')} y{' '}
            {plural(sueltasOriginal, 'suelta', 'sueltas')}
          </span>
        </div>

        {/* ── Campos editables ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`bandejas-${item.id}`}
              className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
            >
              Bandejas
            </label>
            <input
              id={`bandejas-${item.id}`}
              type="number"
              min="0"
              max={MAX_BANDEJAS}
              step="1"
              inputMode="numeric"
              disabled={enviando}
              value={bandejas}
              onChange={(e) => setBandejas(aEntero(e.target.value, MAX_BANDEJAS))}
              onBlur={(e) => setBandejas(aEntero(e.target.value, MAX_BANDEJAS) === '' ? '0' : aEntero(e.target.value, MAX_BANDEJAS))}
              className="w-full min-h-[44px] border border-slate-200 rounded-xl px-3 text-sm font-semibold tabular-nums text-slate-700 outline-none bg-white transition-all focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label
              htmlFor={`sueltas-${item.id}`}
              className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
            >
              Unidades sueltas
            </label>
            <input
              id={`sueltas-${item.id}`}
              type="number"
              min="0"
              max={MAX_SUELTAS}
              step="1"
              inputMode="numeric"
              disabled={enviando}
              value={sueltas}
              onChange={(e) => setSueltas(aEntero(e.target.value, MAX_SUELTAS))}
              onBlur={(e) => setSueltas(aEntero(e.target.value, MAX_SUELTAS) === '' ? '0' : aEntero(e.target.value, MAX_SUELTAS))}
              className="w-full min-h-[44px] border border-slate-200 rounded-xl px-3 text-sm font-semibold tabular-nums text-slate-700 outline-none bg-white transition-all focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* ── Vista previa de lo que entrará al inventario ── */}
        <div className="flex items-start gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5">
          <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[13px] text-indigo-900 m-0">
            {ambosEnCero ? (
              'Usa Rechazar si no hay nada para ingresar'
            ) : (
              <>
                Entrarán al inventario:{' '}
                <strong className="font-semibold">
                  {plural(previa.bandejas, 'bandeja', 'bandejas')} y{' '}
                  {plural(previa.sueltas, 'suelta', 'sueltas')}
                </strong>{' '}
                de {item.producto_nombre || 'el producto'}
              </>
            )}
          </p>
        </div>

        {/* ── Error de la fila (400/404 u otro) ── */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5"
          >
            <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[13px] text-rose-700 m-0">{error}</p>
          </div>
        )}

        {/* ── Campo de motivo (solo al rechazar) ── */}
        {rechazando && (
          <div className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/50 p-3">
            <label
              htmlFor={`motivo-${item.id}`}
              className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
            >
              Motivo (opcional)
            </label>
            <input
              id={`motivo-${item.id}`}
              type="text"
              maxLength={255}
              disabled={enviando}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: cantidades incorrectas"
              autoFocus
              className="w-full min-h-[44px] border border-slate-200 rounded-xl px-3 text-sm outline-none text-slate-700 bg-white transition-all focus:border-rose-400 focus:ring-3 focus:ring-rose-50 placeholder:text-slate-400 disabled:bg-slate-50"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={enviando}
                onClick={() => {
                  setRechazando(false);
                  setMotivo('');
                }}
                className="flex-1 min-h-[44px] border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviando}
                onClick={handleRechazar}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 cursor-pointer"
              >
                {enviando ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <XCircle size={15} aria-hidden="true" />
                )}
                Confirmar rechazo
              </button>
            </div>
          </div>
        )}

        {/* ── Acciones ── */}
        {!rechazando && (
          <div className="flex flex-col sm:flex-row gap-2">
            {confirmandoAceptar ? (
              <>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setConfirmandoAceptar(false)}
                  className="flex-1 min-h-[44px] border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={handleAceptar}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer"
                >
                  {enviando ? (
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check size={15} aria-hidden="true" />
                  )}
                  Confirmar y agregar al inventario
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setRechazando(true)}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 text-sm font-semibold transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  <XCircle size={15} aria-hidden="true" />
                  Rechazar
                </button>
                <button
                  type="button"
                  disabled={enviando || ambosEnCero}
                  onClick={() => setConfirmandoAceptar(true)}
                  title={ambosEnCero ? 'Usa Rechazar si no hay nada para ingresar' : undefined}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
                >
                  <Check size={15} aria-hidden="true" />
                  Aceptar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal ──

export default function ModalValidarProduccion({ open, onClose }) {
  const {
    producciones,
    cargando,
    error,
    fetchProducciones,
  } = usePorValidarProduccionStore();

  // Mensaje breve de éxito (se limpia solo).
  const [aviso, setAviso] = useState('');
  // Marca si alguna producción se aceptó (afecta al inventario) para refrescarlo
  // una sola vez, al cerrar el modal.
  const huboCambiosRef = useRef(false);

  // Al abrir, se recarga la lista (no se confía solo en el último polling).
  useEffect(() => {
    if (!open) return;
    fetchProducciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cierre con Esc. Se usa un ref al handler para que el listener siempre
  // invoque la versión más reciente (que refresca el inventario si hubo
  // cambios) sin tener que re-suscribirse en cada render.
  const handleCloseRef = useRef(() => onClose());
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Autolimpieza del aviso de éxito.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 3000);
    return () => clearTimeout(t);
  }, [aviso]);

  // Tras aceptar, el inventario ya cambió en el backend. El refresco se hace con
  // la acción SILENCIOSA (no `fetchInventario`): esa activa `cargando: true` y
  // `Inventario.jsx` hace `if (cargando) return <spinner/>`, lo que desmontaría
  // la página entera y cerraría este modal.
  //
  // Además se difiere hasta que el modal se cierre, para que la tabla de
  // inventario no cambie mientras el admin sigue revisando otras filas.
  const refrescarInventario = () => {
    const inv = useInventarioStore.getState();
    if (inv.inventario?.length > 0) {
      inv.refrescarInventarioSilencioso(inv.pagina, inv.limite);
    }
  };

  // Cierre del modal. Si hubo alguna aceptación, el inventario se refresca aquí
  // (una sola vez) y no antes: así la tabla no cambia mientras se revisa.
  const handleClose = () => {
    if (huboCambiosRef.current) {
      huboCambiosRef.current = false;
      refrescarInventario();
    }
    onClose();
  };

  // Mantiene el listener de Esc apuntando al handler actual.
  handleCloseRef.current = handleClose;

  if (!open) return null;


  // Mantiene el listener de Esc apuntando al handler actual.
  handleCloseRef.current = handleClose;

  const handleResultado = (tipo, mensaje) => {
    setAviso(mensaje);
    if (tipo === 'conflicto') {
      // Otro admin ya lo revisó: el store ya quitó la fila; se refresca para
      // reconciliar el conteo con el servidor.
      fetchProducciones({ silent: true });
      return;
    }
    // Éxito. Rechazar no toca inventario; aceptar sí. En vez de refrescar el
    // inventario ahora (alteraría la tabla mientras el admin sigue revisando),
    // se marca el cambio y se refresca una sola vez al cerrar el modal.
    if (tipo === 'aceptada') huboCambiosRef.current = true;
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[55] p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-validar-produccion"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} color="#818cf8" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="titulo-validar-produccion"
                className="text-base font-bold text-slate-800 m-0"
              >
                Producciones por validar
              </h2>
              <p className="text-xs text-slate-500 m-0">
                Revisa lo registrado por los empleados antes de sumarlo al inventario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* aviso breve de éxito / conflicto */}
        {aviso && (
          <div
            role="status"
            className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 shrink-0"
          >
            <Check size={15} className="text-emerald-600 shrink-0" aria-hidden="true" />
            <p className="text-[13px] text-emerald-800 m-0">{aviso}</p>
          </div>
        )}

        {/* cuerpo */}
        {/* `min-h-0` es necesario para que este hijo flex pueda encogerse y
            active su propio scroll; sin él, el contenido desborda el modal en
            lugar de desplazarse. `shrink-0` en cada fila evita que las tarjetas
            se compriman (que era lo que ocultaba sus botones) cuando hay muchas
            producciones. */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
          {cargando && (
            <div className="flex flex-col items-center gap-3 py-16 shrink-0">
              <Loader2 size={28} className="animate-spin text-indigo-500" aria-hidden="true" />
              <p className="text-sm text-slate-500 font-medium m-0">Cargando producciones...</p>
            </div>
          )}

          {!cargando && error && (
            <div className="flex flex-col items-center gap-3 py-14 text-center shrink-0">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={26} className="text-rose-400" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-700 m-0">
                No se pudieron cargar las producciones
              </p>
              <p className="text-xs text-slate-500 m-0 max-w-sm">{error}</p>
              <button
                type="button"
                onClick={() => fetchProducciones()}
                className="min-h-[44px] flex items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <RefreshCw size={15} aria-hidden="true" />
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && producciones.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center shrink-0">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <ClipboardCheck size={26} className="text-slate-300" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-600 m-0">
                No hay producciones por validar
              </p>
              <p className="text-xs text-slate-400 m-0">
                Cuando un empleado registre bandejas aparecerán aquí
              </p>
            </div>
          )}

          {!cargando &&
            !error &&
            producciones.map((item) => (
              <FilaProduccion
                key={item.id}
                item={item}
                onResultado={handleResultado}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
