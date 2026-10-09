import { useEffect, useMemo, useState } from 'react';
import { X, Save, Package } from 'lucide-react';
import { useProduccionStore } from '@/store/useProduccionStore';

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';

const iniciales = (nombre = '') =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

// Solo dígitos, entero y con tope. Devuelve '' para el campo vacío.
const soloEnteros = (valor, tope) => {
  const limpio = String(valor ?? '').replace(/\D/g, '');
  if (limpio === '') return '';
  return String(Math.min(Number(limpio), tope));
};

const aNumero = (valor) => (valor === '' ? 0 : Number(valor));

// "1 bandeja" / "2 bandejas"
const conPlural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export default function RegistrarProduccionModal({ empleado, productos, onCerrar, onGuardado }) {
  const guardando = useProduccionStore((s) => s.guardando);
  const errorModal = useProduccionStore((s) => s.errorModal);
  const guardar = useProduccionStore((s) => s.guardar);
  const limpiarErrorModal = useProduccionStore((s) => s.limpiarErrorModal);

  const [productoId, setProductoId] = useState('');
  const [bandejas, setBandejas] = useState('');
  const [sueltas, setSueltas] = useState('');

  useEffect(() => {
    limpiarErrorModal();
  }, [limpiarErrorModal]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !guardando) onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar, guardando]);

  const producto = useMemo(
    () => productos.find((p) => String(p.id) === String(productoId)) || null,
    [productos, productoId],
  );

  const nBandejas = aNumero(bandejas);
  const nSueltas = aNumero(sueltas);
  const sinCantidad = nBandejas === 0 && nSueltas === 0;
  const puedeGuardar = !!productoId && !sinCantidad && !guardando;

  // Vista previa informativa: la conversión real la hace el backend.
  const upb = Number(producto?.unidades_por_bandeja) || 0;
  const prevBandejas = upb > 0 ? nBandejas + Math.floor(nSueltas / upb) : nBandejas;
  const prevSueltas = upb > 0 ? nSueltas % upb : nSueltas;

  const enviar = async (e) => {
    e.preventDefault();
    if (!puedeGuardar) return;
    const resultado = await guardar({
      empleado_id: empleado.id,
      producto_id: Number(productoId),
      bandejas: nBandejas,
      unidades_sueltas: nSueltas,
    });
    if (resultado) onGuardado(resultado);
  };

  const campo = 'min-h-[44px] w-full rounded-xl border border-[#e4e7f3] bg-[#fafbff] px-3.5 py-2.5 text-base text-[#0f1226] outline-none transition focus:border-indigo-500';
  const etiquetaCampo = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={() => !guardando && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Registrar producción"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="h-1 bg-gradient-to-r from-indigo-600 to-cyan-500" />

        <form onSubmit={enviar} className="flex flex-col gap-4 px-5 pb-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                Nuevo registro
              </span>
              <h2 className="text-xl font-extrabold leading-tight text-[#0f1226]">Registrar producción</h2>
              <p className="mt-1 text-sm text-[#4b5163]">Indica el producto y las cantidades elaboradas.</p>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              aria-label="Cerrar"
              className={`grid h-11 w-11 flex-none place-items-center rounded-full text-[#6b7280] hover:bg-[#f1f2f9] disabled:opacity-50 ${FOCO}`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[#e4e7f3] bg-[#fafbff] px-4 py-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-sm font-bold text-white">
              {iniciales(empleado?.nombre)}
            </span>
            <strong className="min-w-0 break-words text-sm text-[#0f1226]">
              {empleado?.nombre || 'Empleado'}
            </strong>
          </div>

          <div>
            <label htmlFor="prod-producto" className={etiquetaCampo}>Producto</label>
            <select
              id="prod-producto"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className={`${campo} cursor-pointer`}
            >
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prod-bandejas" className={etiquetaCampo}>Cantidad de bandejas</label>
              <input
                id="prod-bandejas"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={bandejas}
                onChange={(e) => setBandejas(soloEnteros(e.target.value, 9999))}
                placeholder="0"
                className={campo}
              />
            </div>
            <div>
              <label htmlFor="prod-sueltas" className={etiquetaCampo}>Unidades sueltas</label>
              <input
                id="prod-sueltas"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={sueltas}
                onChange={(e) => setSueltas(soloEnteros(e.target.value, 99999))}
                placeholder="0"
                className={campo}
              />
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
              <Package size={16} aria-hidden="true" />
              Se guardará: {conPlural(prevBandejas, 'bandeja', 'bandejas')} y {conPlural(prevSueltas, 'suelta', 'sueltas')}
            </p>
            <p className="mt-1 text-xs text-indigo-700/80">
              Si las unidades sueltas completan una o más bandejas, se sumarán automáticamente a las bandejas.
            </p>
          </div>

          {errorModal && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorModal}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className={`min-h-[44px] flex-1 rounded-xl border border-[#e4e7f3] bg-white px-4 py-3 text-sm font-semibold text-[#0f1226] hover:bg-[#f6f7fc] disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeGuardar}
              className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
            >
              <Save size={16} aria-hidden="true" />
              {guardando ? 'Guardando…' : 'Guardar producción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
