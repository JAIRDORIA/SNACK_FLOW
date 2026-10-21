import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  History,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { obtenerMovimientos } from '@/api/medios_pago_api';
import { formatearFechaColombia } from '@/utils/formatearFecha';
import { formatoMoneda } from '@/utils/formatoCifras';

// Modal "Movimientos de la cuenta".
//
// Lista paginada (20 por página) de los movimientos de una cuenta de
// transferencia, con filtros por rango de fechas (hasta inclusivo).
//
// Fechas: el backend envía "YYYY-MM-DD HH:mm:ss" en UTC. Se usa
// `formatearFechaColombia`, que interpreta esa cadena como UTC y la muestra en
// America/Bogota (misma convención que Ventas, Abonos y Balance), en lugar de
// dejar que el navegador la lea como hora local.
//
// Carrera de peticiones: cada fetch lleva un id incremental en un ref. Si llega
// una respuesta de una petición vieja (el usuario cambió de página o de filtro),
// se descarta y no pisa la lista actual.

const LIMITE = 20;

const CONCEPTO = {
  abono: 'Abono a venta',
  compra: 'Compra',
  prestamo: 'Préstamo',
  pago_prestamo: 'Abono a préstamo',
  retiro: 'Retiro a ahorros',
};

const etiquetaConcepto = (concepto) => CONCEPTO[concepto] || concepto || '—';

// "18/10/2026, 14:37:01" → { dia, hora }
const partesFecha = (fecha) => {
  const texto = formatearFechaColombia(fecha);
  const [dia, hora] = String(texto).split(', ');
  return { dia, hora: hora || '' };
};

const claseMonto = (tipo) =>
  tipo === 'ingreso'
    ? 'text-emerald-700'
    : tipo === 'egreso'
      ? 'text-rose-700'
      : 'text-slate-600';

const signoMonto = (tipo) => (tipo === 'ingreso' ? '+' : tipo === 'egreso' ? '−' : '');

export default function MovimientosCuentaModal({ cuenta, onClose }) {
  const [pagina, setPagina] = useState(1);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  // Contador para el botón "Reintentar" (vuelve a disparar el efecto).
  const [recarga, setRecarga] = useState(0);

  // Los datos se guardan junto a la "clave" de la consulta que los produjo.
  // Así el estado de carga y de error se DERIVAN de la clave actual, sin
  // llamar a setState al inicio del efecto (que dispararía renders en cascada).
  const [datos, setDatos] = useState({ clave: null, movimientos: [], total: 0 });
  const [error, setError] = useState({ clave: null, mensaje: null });

  const peticionRef = useRef(0);
  const panelRef = useRef(null);

  const clave = `${cuenta?.id ?? 'sin-cuenta'}|${pagina}|${desde}|${hasta}|${recarga}`;
  const movimientos = datos.movimientos;
  const total = datos.total;
  const errorActual = error.clave === clave ? error.mensaje : null;
  const cargando = datos.clave !== clave && !errorActual;

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));
  const hayFiltros = Boolean(desde || hasta);

  // Cierre con Esc.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Foco inicial en el diálogo (lectores de pantalla y teclado).
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // Carga de movimientos. `peticionRef` evita que una respuesta vieja pise
  // a la más reciente.
  useEffect(() => {
    if (!cuenta?.id) return;

    const idPeticion = ++peticionRef.current;
    const params = { pagina, limite: LIMITE };
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    obtenerMovimientos(cuenta.id, params)
      .then((res) => {
        if (idPeticion !== peticionRef.current) return;
        const data = res.data || {};
        setDatos({
          clave,
          movimientos: Array.isArray(data.movimientos) ? data.movimientos : [],
          total: Number(data.total ?? 0),
        });
        setError({ clave: null, mensaje: null });
      })
      .catch((err) => {
        if (idPeticion !== peticionRef.current) return;
        setDatos({ clave, movimientos: [], total: 0 });
        setError({
          clave,
          mensaje:
            err?.response?.data?.mensaje ||
            err?.response?.data?.error ||
            'No se pudieron cargar los movimientos.',
        });
      });
  }, [clave, cuenta?.id, pagina, desde, hasta]);

  const cambiarDesde = (e) => {
    setDesde(e.target.value);
    setPagina(1);
  };

  const cambiarHasta = (e) => {
    setHasta(e.target.value);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setDesde('');
    setHasta('');
    setPagina(1);
  };

  const resumen = [
    { label: 'Saldo inicial', valor: Number(cuenta?.saldo_inicial ?? 0), clase: 'text-slate-700' },
    {
      label: 'Ingresos',
      valor: Number(cuenta?.ingresos ?? 0),
      clase: 'text-emerald-700',
      signo: '+',
    },
    {
      label: 'Egresos',
      valor: Number(cuenta?.egresos ?? 0),
      clase: 'text-rose-700',
      signo: '−',
    },
    {
      label: 'Saldo actual',
      valor: Number(cuenta?.saldo ?? cuenta?.saldo_actual ?? 0),
      clase: 'text-indigo-600',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-movimientos"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] outline-none"
      >
        {/* ── Encabezado ── */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
              <History size={18} color="#818cf8" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="titulo-movimientos" className="text-base font-bold text-slate-800 m-0">
                Movimientos de la cuenta
              </h3>
              <p className="text-xs text-slate-500 m-0 truncate">
                {cuenta?.nombre}
                {cuenta?.titular ? ` — ${cuenta.titular}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Resumen ── */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {resumen.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 min-w-0"
              >
                <p className="text-[10px] uppercase tracking-wide text-slate-500 m-0 leading-tight">
                  {item.label}
                </p>
                <p
                  className={`text-sm sm:text-base font-bold tabular-nums m-0 leading-tight break-words ${item.clase}`}
                  title={`${item.signo || ''}$${formatoMoneda(item.valor)}`}
                >
                  {item.signo || ''}${formatoMoneda(item.valor)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="mov-desde"
              className="block text-[11px] font-semibold text-slate-500 mb-1"
            >
              Desde
            </label>
            <input
              id="mov-desde"
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={cambiarDesde}
              className="min-h-[44px] border border-slate-200 rounded-xl text-sm text-slate-700 bg-white px-3 py-2 outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="mov-hasta"
              className="block text-[11px] font-semibold text-slate-500 mb-1"
            >
              Hasta
            </label>
            <input
              id="mov-hasta"
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={cambiarHasta}
              className="min-h-[44px] border border-slate-200 rounded-xl text-sm text-slate-700 bg-white px-3 py-2 outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
            className="min-h-[44px] flex items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Limpiar
          </button>

          {cargando && movimientos.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 pb-2">
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              Actualizando...
            </span>
          )}
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto" aria-busy={cargando}>
          {cargando && movimientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 size={26} className="animate-spin text-indigo-500" aria-hidden="true" />
              <p className="text-sm text-slate-500 m-0">Cargando movimientos...</p>
            </div>
          ) : errorActual ? (
            <div className="m-5 sm:m-6 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-rose-700 m-0">Error al cargar los movimientos</p>
                <p className="text-xs text-rose-600 mt-1 m-0">{errorActual}</p>
                <button
                  type="button"
                  onClick={() => setRecarga((n) => n + 1)}
                  className="mt-3 min-h-[44px] flex items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 bg-white hover:bg-rose-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <History size={26} className="text-slate-300" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-600 m-0">
                Esta cuenta aún no tiene movimientos
              </p>
              <p className="text-xs text-slate-500 m-0">
                {hayFiltros
                  ? 'Prueba con otro rango de fechas o pulsa "Limpiar".'
                  : 'Aparecerán aquí a medida que se registren abonos, compras y préstamos.'}
              </p>
            </div>
          ) : (
            <>
              {/* Tabla (md y superior) */}
              <div className={`hidden md:block overflow-x-auto ${cargando ? 'opacity-60' : ''}`}>
                <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      {['Fecha', 'Concepto', 'Descripción', 'Monto'].map((label, i) => (
                        <th
                          key={label}
                          scope="col"
                          className={`sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 ${
                            i === 3 ? 'text-right' : 'text-left'
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov, i) => {
                      const { dia, hora } = partesFecha(mov.fecha);
                      return (
                        <tr
                          key={`${mov.referencia_id}-${mov.fecha}-${i}`}
                          className={`transition-colors ${
                            i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                          } hover:bg-indigo-50/50`}
                        >
                          <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">
                            <p className="text-[13px] text-slate-700 m-0 tabular-nums">{dia}</p>
                            {hora && (
                              <p className="text-[11px] text-slate-500 m-0 tabular-nums">{hora}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-[11px] rounded-full font-semibold border border-slate-200 bg-slate-50 text-slate-600 py-1 px-2.5">
                              {mov.tipo === 'ingreso' ? (
                                <ArrowDownLeft size={11} aria-hidden="true" />
                              ) : (
                                <ArrowUpRight size={11} aria-hidden="true" />
                              )}
                              {etiquetaConcepto(mov.concepto)}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-slate-100 text-[13px] text-slate-500 max-w-[320px]">
                            <span className="block truncate" title={mov.descripcion || ''}>
                              {mov.descripcion || '—'}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 border-b border-slate-100 text-right text-[13px] font-semibold tabular-nums whitespace-nowrap ${claseMonto(mov.tipo)}`}
                          >
                            {signoMonto(mov.tipo)}${formatoMoneda(Math.abs(Number(mov.monto) || 0))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards (móvil) */}
              <div className={`md:hidden divide-y divide-slate-100 ${cargando ? 'opacity-60' : ''}`}>
                {movimientos.map((mov, i) => {
                  const { dia, hora } = partesFecha(mov.fecha);
                  return (
                    <div key={`${mov.referencia_id}-${mov.fecha}-${i}`} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 m-0">
                            {etiquetaConcepto(mov.concepto)}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 m-0 tabular-nums">
                            <Calendar size={11} aria-hidden="true" className="inline mr-1 align-[-1px]" />
                            {dia}
                            {hora ? ` · ${hora}` : ''}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-bold tabular-nums m-0 shrink-0 ${claseMonto(mov.tipo)}`}
                        >
                          {signoMonto(mov.tipo)}${formatoMoneda(Math.abs(Number(mov.monto) || 0))}
                        </p>
                      </div>
                      {mov.descripcion && (
                        <p className="text-xs text-slate-500 mt-2 m-0">{mov.descripcion}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Paginación ── */}
        {!errorActual && (
          <div className="border-t border-slate-200 bg-slate-50/60 px-5 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[13px] text-slate-500 m-0">
              Página <strong className="text-slate-700 tabular-nums">{pagina}</strong> de{' '}
              <strong className="text-slate-700 tabular-nums">{totalPaginas}</strong> (
              <strong className="text-slate-700 tabular-nums">{total}</strong>{' '}
              {total === 1 ? 'movimiento' : 'movimientos'})
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1 || cargando}
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina >= totalPaginas || cargando}
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
