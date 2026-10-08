import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  LogOut,
  Search,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
  Users,
  X,
} from 'lucide-react';
import { useProduccionStore } from '@/store/useProduccionStore';
import RegistrarProduccionModal from './RegistrarProduccionModal';
import RegistrosProduccion from './RegistrosProduccion';

// Pantalla fija de la sala de producción: sin sidebar ni header del admin.
// Reutiliza el enfoque visual de /cocina (barra oscura + fondo claro).

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500';
const ETIQUETA = 'text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]';
const POLLING_MS = 5 * 60 * 1000;
const EXITO_MS = 5000;

const usuarioActual = () => {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  } catch {
    return null;
  }
};

const iniciales = (nombre = '') =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

// Fechas de hoy en hora Colombia (el navegador puede estar en otra zona).
const fechasBogota = () => {
  const hoy = new Date();
  const trabajo = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(hoy);
  const larga = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(hoy);
  return { trabajo, larga: larga.charAt(0).toUpperCase() + larga.slice(1) };
};

// Búsqueda sin distinguir mayúsculas ni tildes.
const normalizar = (texto = '') =>
  String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// "1 bandeja" / "2 bandejas"
const conPlural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export default function PanelProduccion() {
  const navigate = useNavigate();
  const usuario = useMemo(() => usuarioActual(), []);
  const fechas = useMemo(() => fechasBogota(), []);

  const empleados = useProduccionStore((s) => s.empleados);
  const productos = useProduccionStore((s) => s.productos);
  const cargando = useProduccionStore((s) => s.cargando);
  const error = useProduccionStore((s) => s.error);
  const cargar = useProduccionStore((s) => s.cargar);
  const refrescarEmpleados = useProduccionStore((s) => s.refrescarEmpleados);
  const limpiarError = useProduccionStore((s) => s.limpiarError);
  const limpiarErrorModal = useProduccionStore((s) => s.limpiarErrorModal);

  const [tab, setTab] = useState('empleados');
  const [busqueda, setBusqueda] = useState('');
  const [empleadoModal, setEmpleadoModal] = useState(null);
  const [exito, setExito] = useState(null);

  // Carga inicial de empleados y productos.
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Refresco silencioso de empleados cada 5 min, pausado si la pestaña está oculta.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      refrescarEmpleados();
    }, POLLING_MS);
    return () => clearInterval(t);
  }, [refrescarEmpleados]);

  // La confirmación se oculta sola.
  useEffect(() => {
    if (!exito) return;
    const t = setTimeout(() => setExito(null), EXITO_MS);
    return () => clearTimeout(t);
  }, [exito]);

  const q = normalizar(busqueda).trim();
  const empleadosFiltrados = q
    ? empleados.filter((e) => normalizar(e.nombre).includes(q))
    : empleados;

  const cerrarSesion = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    navigate('/login', { replace: true });
  };

  const abrirModal = (empleado) => {
    limpiarErrorModal();
    setEmpleadoModal(empleado);
  };

  const manejarGuardado = (res) => {
    const nombre = res?.empleado_nombre || empleadoModal?.nombre || 'Empleado';
    const bandejas = res?.bandejas ?? 0;
    const sueltas = res?.unidades_sueltas ?? 0;
    const producto = res?.producto_nombre || 'producto';
    setExito(
      `Producción enviada: ${nombre}, ${conPlural(bandejas, 'bandeja', 'bandejas')} y ${conPlural(sueltas, 'suelta', 'sueltas')} de ${producto}`,
    );
    setEmpleadoModal(null);
  };

  const tabs = [
    ['empleados', 'Empleados'],
    ['registros', 'Registros'],
  ];

  return (
    <div className="min-h-screen bg-[#eef0f8] font-sans text-[#0f1226]">
      <header className="sticky top-0 z-10 bg-[#0f1226] px-3.5 py-3 text-white sm:px-6">
        <div className="mx-auto grid max-w-[1400px] gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-orange-500 to-amber-400">
              <Factory size={18} aria-hidden="true" />
            </span>
            <div>
              <small className="mb-0.5 block text-[11px] text-[#8b93ff]">Snack Flow · Producción</small>
              <strong className="text-sm">Monitor de sala</strong>
            </div>
          </div>

          <nav aria-label="Secciones" className="flex justify-center">
            <div className="inline-flex rounded-xl bg-[#1b1f3b] p-1">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={tab === id ? 'page' : undefined}
                  className={`min-h-[44px] rounded-lg px-5 text-sm font-semibold ${FOCO} ${
                    tab === id ? 'bg-cyan-500 text-[#0f1226]' : 'text-indigo-200 hover:bg-[#232852]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="rounded-[10px] bg-[#1b1f3b] px-3 py-1.5 text-right">
              <span className="block text-[10px] uppercase tracking-wider text-[#8b93ff]">Fecha de trabajo</span>
              <strong className="text-sm tabular-nums">{fechas.trabajo}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-[11px] font-bold">
                {iniciales(usuario?.nombre)}
              </span>
              <strong className="max-w-[160px] truncate text-sm">{usuario?.nombre || 'Usuario'}</strong>
            </div>

            <button
              type="button"
              onClick={cerrarSesion}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-[#343a7a] px-3.5 py-2 text-[13px] text-indigo-200 hover:bg-[#1b1f3b] ${FOCO}`}
            >
              <LogOut size={16} aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-3.5 pb-10 pt-6 sm:px-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <span>{error}</span>
            <button type="button" onClick={limpiarError} className={`font-semibold ${FOCO}`}>Cerrar</button>
          </div>
        )}

        {tab === 'empleados' ? (
          <>
            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
              <div>
                <span className={ETIQUETA}>Operación del día</span>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Registrar producción</h1>
                <p className="mt-2 max-w-xl text-sm text-[#4b5163]">
                  Selecciona tu nombre para registrar bandejas y unidades sueltas del día.
                </p>
              </div>

              <aside className="rounded-2xl border border-[#e4e7f3] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-600">
                  <CalendarDays size={18} aria-hidden="true" />
                  <span className={ETIQUETA}>Fecha de hoy</span>
                </div>
                <p className="mt-2 text-lg font-bold">{fechas.larga}</p>
                <p className="mt-1 text-xs text-[#6b7280]">Monitor de sala de producción</p>
              </aside>
            </div>

            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-extrabold">
                  <Users size={18} aria-hidden="true" className="text-indigo-600" />
                  Empleados
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                    {empleados.length}
                  </span>
                </h2>

                <div className="relative w-full sm:w-72">
                  <Search
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0b5]"
                  />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar tu nombre"
                    aria-label="Buscar tu nombre"
                    className={`min-h-[44px] w-full rounded-xl border border-[#e4e7f3] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 ${FOCO}`}
                  />
                </div>
              </div>

              {cargando && empleados.length === 0 ? (
                <p className="py-16 text-center text-sm text-[#4b5163]">Cargando empleados…</p>
              ) : empleadosFiltrados.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[#c7cbe0] bg-white/70 px-6 py-16 text-center">
                  <p className="text-sm font-semibold text-[#4b5163]">
                    {q
                      ? `No hay empleados que coincidan con “${busqueda.trim()}”.`
                      : 'No hay empleados activos por ahora.'}
                  </p>
                  {q && (
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      className={`mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700 ${FOCO}`}
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {empleadosFiltrados.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => abrirModal(e)}
                      className={`group flex min-h-[150px] flex-col items-start gap-3 rounded-2xl border border-[#e4e7f3] bg-white p-4 text-left shadow-sm transition hover:border-cyan-400 hover:shadow-md ${FOCO}`}
                    >
                      <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-sm font-bold text-white">
                        {iniciales(e.nombre)}
                      </span>
                      <span className="min-w-0">
                        <strong className="block break-words text-base">{e.nombre}</strong>
                        <span className="text-xs text-[#6b7280]">Equipo de producción</span>
                      </span>
                      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                        Registrar producción
                        <ArrowRight size={16} aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <RegistrosProduccion />
        )}
      </main>

      {empleadoModal && (
        <RegistrarProduccionModal
          empleado={empleadoModal}
          productos={productos}
          onCerrar={() => setEmpleadoModal(null)}
          onGuardado={manejarGuardado}
        />
      )}

      {exito && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-4 z-[70] flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg"
        >
          <CheckCircle2 size={18} aria-hidden="true" className="flex-none text-emerald-600" />
          <span>{exito}</span>
          <button type="button" onClick={() => setExito(null)} aria-label="Cerrar confirmación" className={FOCO}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
