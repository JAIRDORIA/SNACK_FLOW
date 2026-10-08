import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Clock, RefreshCw, Inbox, ClipboardList, AlertCircle } from 'lucide-react';
import { useProduccionStore } from '@/store/useProduccionStore';

// Registros recientes de producción: una sola tabla con los últimos 5
// registros de cada empleado activo (el backend ya los ordena y los limita).

const POLLING_MS = 60000;
const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500';

const fmtBogota = (opciones) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', ...opciones });

// "YYYY-MM-DD HH:mm:ss" viene en UTC: se arma la ISO con T/Z antes de parsear.
const parsearUTC = (valor) => {
  const texto = String(valor);
  const iso = texto.includes('T') ? texto : `${texto.replace(' ', 'T')}Z`;
  return new Date(iso);
};

const claveDia = (fecha) => fmtBogota({ year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);

// Hoy en Colombia -> "Hoy HH:mm"; otro día -> "dd/MM HH:mm".
const formatearFecha = (valor) => {
  if (!valor) return '—';
  const fecha = parsearUTC(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  const hora = fmtBogota({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(fecha);
  if (claveDia(fecha) === claveDia(new Date())) return `Hoy ${hora}`;

  const partes = fmtBogota({ day: '2-digit', month: '2-digit' }).formatToParts(fecha);
  const dd = (partes.find((p) => p.type === 'day')?.value || '').padStart(2, '0');
  const mm = (partes.find((p) => p.type === 'month')?.value || '').padStart(2, '0');
  return `${dd}/${mm} ${hora}`;
};

const ESTADOS = {
  pendiente: { texto: 'Pendiente', Icono: Clock, clases: 'border-amber-200 bg-amber-50 text-amber-800' },
  aceptada: { texto: 'Aceptada', Icono: CheckCircle2, clases: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  rechazada: { texto: 'Rechazada', Icono: XCircle, clases: 'border-rose-200 bg-rose-50 text-rose-800' },
};

function InsigniaEstado({ estado }) {
  const config = ESTADOS[String(estado || '').toLowerCase()] || {
    texto: estado || '—',
    Icono: Inbox,
    clases: 'border-[#e4e7f3] bg-[#f6f7fc] text-[#4b5163]',
  };
  const Icono = config.Icono;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${config.clases}`}>
      <Icono size={14} aria-hidden="true" />
      {config.texto}
    </span>
  );
}

const COLUMNAS = ['Fecha y hora', 'Empleado', 'Producto', 'Bandejas', 'Unidades sueltas', 'Estado'];
const TH = 'whitespace-nowrap px-4 py-3.5 text-sm font-bold text-[#4b5163]';
const TD = 'whitespace-nowrap px-4 py-3.5 text-[15px] text-[#0f1226]';
const TH_NUM = `${TH} text-right`;
const TD_NUM = `${TD} text-right tabular-nums font-semibold`;

export default function RegistrosProduccion() {
  const registros = useProduccionStore((s) => s.registros);
  const cargando = useProduccionStore((s) => s.cargandoRegistros);
  const error = useProduccionStore((s) => s.errorRegistros);
  const ultimaCarga = useProduccionStore((s) => s.ultimaCargaRegistros);
  const cargarRegistros = useProduccionStore((s) => s.cargarRegistros);

  // Si ya hubo una carga previa (p. ej. tras guardar), se refresca en silencio
  // para no mostrar el esqueleto al volver a la pestaña.
  const yaCargadoRef = useRef(ultimaCarga != null);

  useEffect(() => {
    cargarRegistros({ silencioso: yaCargadoRef.current });
  }, [cargarRegistros]);

  // Refresco silencioso cada 60 s, pausado si la pestaña del navegador está oculta.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      cargarRegistros({ silencioso: true });
    }, POLLING_MS);
    return () => clearInterval(t);
  }, [cargarRegistros]);

  // Esqueleto solo cuando aún no hay nada que mostrar (primera carga o recarga
  // sin datos). El estado vacío real requiere al menos una carga terminada.
  const mostrarEsqueleto = registros.length === 0 && !error && (cargando || ultimaCarga == null);

  return (
    <section>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <ClipboardList size={18} aria-hidden="true" className="text-indigo-600" />
          Registros recientes
        </h2>
        <p className="mt-1 text-sm text-[#4b5163]">Últimos 5 registros de cada empleado</p>
      </div>

      {mostrarEsqueleto ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#e4e7f3] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-[#f6f7fc]">
                <tr>
                  {COLUMNAS.map((c, i) => (
                    <th key={c} scope="col" className={`${TH} ${i >= 3 && i <= 4 ? 'text-right' : ''}`}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f8]">
                {Array.from({ length: 4 }).map((_, fila) => (
                  <tr key={fila} className="animate-pulse motion-reduce:animate-none">
                    {COLUMNAS.map((c) => (
                      <td key={c} className="px-4 py-3.5">
                        <span className="block h-4 w-24 rounded bg-[#eef0f8]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
          <AlertCircle size={28} aria-hidden="true" className="mx-auto text-rose-500" />
          <p className="mt-3 text-sm font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => cargarRegistros()}
            className={`mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-700 ${FOCO}`}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : registros.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#c7cbe0] bg-white/70 px-6 py-20 text-center">
          <Inbox size={28} aria-hidden="true" className="mx-auto text-[#9aa0b5]" />
          <p className="mt-3 text-sm font-semibold text-[#4b5163]">Aún no hay registros</p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#e4e7f3] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-[#f6f7fc]">
                <tr>
                  <th scope="col" className={TH}>Fecha y hora</th>
                  <th scope="col" className={TH}>Empleado</th>
                  <th scope="col" className={TH}>Producto</th>
                  <th scope="col" className={TH_NUM}>Bandejas</th>
                  <th scope="col" className={TH_NUM}>Unidades sueltas</th>
                  <th scope="col" className={TH}>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f8]">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fafbff]">
                    <td className={`${TD} tabular-nums`}>{formatearFecha(r.created_at)}</td>
                    <td className={`${TD} font-semibold`}>{r.empleado_nombre || '—'}</td>
                    <td className={TD}>{r.producto_nombre || '—'}</td>
                    <td className={TD_NUM}>{r.bandejas ?? 0}</td>
                    <td className={TD_NUM}>{r.unidades_sueltas ?? 0}</td>
                    <td className={TD}><InsigniaEstado estado={r.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
