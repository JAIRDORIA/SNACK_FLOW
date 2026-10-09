import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Power,
  PowerOff,
  AlertTriangle,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import useEmpleadosStore from '@/store/useEmpleadosStore';
import Toast from '@/components/Toast';
import EmpleadoFormModal from '@/components/empleados/EmpleadoFormModal';
import ConfirmarDesactivarModal from '@/components/empleados/ConfirmarDesactivarModal';

// Gestión de empleados de la sala de producción (solo admin).
//
// Los empleados no tienen usuario ni contraseña: eligen su nombre en la pantalla
// de producción. Aquí se listan, se crean, se renombran y se activan o
// desactivan. Nunca se borran (no existe DELETE).
//
// Diseño (ui-ux-pro-max), siguiendo el patrón de las demás páginas de gestión:
// encabezado + acción primaria, KPIs, tarjeta con buscador y filtro, tabla densa
// con cabecera sticky y hover por fila, estados vacío/error/cargando claros.

// Normaliza para buscar sin distinguir mayúsculas ni tildes:
// "María" y "maria" deben coincidir.
const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// `activo` llega como 1 o 0 (a veces string). Se trata como booleano en la UI.
const esActivo = (empleado) =>
  empleado?.activo === 1 || empleado?.activo === '1' || empleado?.activo === true;

const FILTROS = [
  { valor: 1, label: 'Activos' },
  { valor: 0, label: 'Inactivos' },
  { valor: '', label: 'Todos' },
];

export default function Empleados() {
  const {
    empleados,
    filtroActivo,
    cargando,
    error,
    fetchEmpleados,
    setFiltroActivo,
    crearEmpleado,
    renombrarEmpleado,
    cambiarEstadoEmpleado,
  } = useEmpleadosStore();

  const [busqueda, setBusqueda] = useState('');
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);
  const [empleadoDesactivar, setEmpleadoDesactivar] = useState(null);
  const [toast, setToast] = useState(null);
  // Contador que se incrementa en cada apertura del formulario. Se usa como
  // `key` para forzar un montaje nuevo: crear dos veces seguidas debe abrir un
  // modal limpio, no reutilizar el anterior con su estado residual.
  const [formKey, setFormKey] = useState(0);

  // Carga inicial (el filtro por defecto es "Activos").
  useEffect(() => {
    fetchEmpleados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscador en el cliente: se filtra la lista que ya trajo el servidor.
  const lista = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return empleados;
    return empleados.filter((e) => normalizar(e.nombre).includes(q));
  }, [empleados, busqueda]);

  // Conteos para las tarjetas. Salen de la lista cargada (ya filtrada por el
  // servidor), así que "activos" solo es exacto cuando el filtro no es Activos.
  const activos = empleados.filter(esActivo).length;
  const inactivos = empleados.length - activos;

  const abrirCrear = () => {
    setEmpleadoEditar(null);
    setFormKey((k) => k + 1);
    setModalFormOpen(true);
  };

  const abrirEditar = (empleado) => {
    setEmpleadoEditar(empleado);
    setFormKey((k) => k + 1);
    setModalFormOpen(true);
  };

  // El modal decide si crear o renombrar según si recibió un empleado.
  const handleGuardar = async (nombre) => {
    const res = empleadoEditar
      ? await renombrarEmpleado(empleadoEditar.id, nombre)
      : await crearEmpleado(nombre);

    if (res.ok) {
      setToast({
        mensaje: empleadoEditar ? 'Empleado actualizado' : 'Empleado creado',
        tipo: 'success',
      });
    }
    return res;
  };

  // Activar no pide confirmación; desactivar sí (ver ConfirmarDesactivarModal).
  const handleActivar = async (empleado) => {
    const res = await cambiarEstadoEmpleado(empleado.id, true);
    setToast(
      res.ok
        ? { mensaje: 'Empleado activado', tipo: 'success' }
        : { mensaje: res.mensaje, tipo: 'error' },
    );
  };

  const handleDesactivar = async () => {
    const res = await cambiarEstadoEmpleado(empleadoDesactivar.id, false);
    if (res.ok) setToast({ mensaje: 'Empleado desactivado', tipo: 'success' });
    return res;
  };

  // ── Estados de carga / error ──
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4 max-w-2xl">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-rose-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-rose-700 font-semibold text-sm mb-1 m-0">
              Error al cargar los empleados
            </p>
            <p className="text-rose-500 text-sm m-0 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchEmpleados()}
              className="min-h-[44px] flex items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 bg-white hover:bg-rose-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Mostrando',
      value: lista.length,
      icon: Users,
      color: '#818cf8',
      ring: 'ring-indigo-400/40',
    },
    {
      label: 'Activos',
      value: activos,
      icon: UserCheck,
      color: '#34d399',
      ring: 'ring-emerald-400/40',
    },
    {
      label: 'Inactivos',
      value: inactivos,
      icon: UserX,
      color: '#fb7185',
      ring: 'ring-rose-400/40',
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ═══ ENCABEZADO ═══ */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
            <Users size={20} color="#818cf8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B1D2E] truncate m-0">
              Empleados
            </h1>
            <p className="text-xs text-slate-500 m-0">
              Personas que registran producción en la sala
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/30 active:scale-95 transition-all whitespace-nowrap py-2.5 px-4 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
        >
          <Plus size={16} aria-hidden="true" />
          Nuevo empleado
        </button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icono = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[#1B1D2E] rounded-2xl flex items-center gap-3 p-3 sm:p-4 transition-transform hover:scale-[1.02]"
            >
              <div
                className={`bg-[#13152280] ring-2 ${kpi.ring} w-9 h-9 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center shrink-0`}
              >
                <Icono size={18} color={kpi.color} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg lg:text-xl font-bold text-white truncate tabular-nums m-0">
                  {kpi.value}
                </p>
                <p className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5 m-0">
                  {kpi.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ TABLA ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible">
        {/* barra de búsqueda + filtro */}
        <div className="border-b border-slate-100 flex gap-3 items-center flex-wrap p-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search
              size={16}
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar empleado por nombre..."
              aria-label="Buscar empleados por nombre"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* El filtro se aplica en el SERVIDOR (?activo=) */}
          <div
            role="group"
            aria-label="Filtrar por estado"
            className="flex items-center gap-1 bg-slate-100 rounded-xl p-1"
          >
            {FILTROS.map((f) => {
              const activo = filtroActivo === f.valor;
              return (
                <button
                  key={f.label}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setFiltroActivo(f.valor)}
                  className={`min-h-[40px] rounded-lg text-[13px] font-semibold transition-all py-2 px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                    activo
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tabla (md y superior) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {[
                  { label: 'Nombre', align: 'left' },
                  { label: 'Estado', align: 'left' },
                  { label: 'Acciones', align: 'right' },
                ].map((col) => (
                  <th
                    key={col.label}
                    scope="col"
                    className={`sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-24">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Users size={26} className="text-slate-300" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 m-0">
                        {busqueda
                          ? 'Ningún empleado coincide con la búsqueda'
                          : filtroActivo === 0
                            ? 'No hay empleados inactivos'
                            : 'No hay empleados registrados'}
                      </p>
                      <p className="text-xs text-slate-400 m-0">
                        {busqueda
                          ? 'Prueba con otro nombre'
                          : 'Crea el primer empleado con el botón "Nuevo empleado"'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                lista.map((empleado, i) => {
                  const activo = esActivo(empleado);
                  return (
                    <tr
                      key={empleado.id}
                      className={`group transition-colors ${
                        i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      } hover:bg-indigo-50/50`}
                    >
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            aria-hidden="true"
                            className={`w-7 h-7 shrink-0 rounded-full text-[11px] font-bold flex items-center justify-center uppercase ${
                              activo
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {String(empleado.nombre || '?').trim().charAt(0)}
                          </span>
                          {/* El nombre se muestra EXACTAMENTE como viene del backend. */}
                          <span
                            className={`text-[13px] font-medium truncate ${
                              activo ? 'text-slate-700' : 'text-slate-500'
                            }`}
                            title={empleado.nombre}
                          >
                            {empleado.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">
                        {/* Insignia con texto, no solo color. */}
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] rounded-full font-semibold border py-1 px-2.5 ${
                            activo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {activo ? (
                            <UserCheck size={12} aria-hidden="true" />
                          ) : (
                            <UserX size={12} aria-hidden="true" />
                          )}
                          {activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirEditar(empleado)}
                            title="Editar"
                            aria-label={`Editar a ${empleado.nombre}`}
                            className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-amber-500 hover:border-amber-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 cursor-pointer"
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          {activo ? (
                            <button
                              type="button"
                              onClick={() => setEmpleadoDesactivar(empleado)}
                              title="Desactivar"
                              aria-label={`Desactivar a ${empleado.nombre}`}
                              className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-amber-600 hover:border-amber-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-1 cursor-pointer"
                            >
                              <PowerOff size={16} aria-hidden="true" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivar(empleado)}
                              title="Activar"
                              aria-label={`Activar a ${empleado.nombre}`}
                              className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-emerald-600 hover:border-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 cursor-pointer"
                            >
                              <Power size={16} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Tarjetas (móvil) ── */}
        <div className="md:hidden divide-y divide-slate-100">
          {lista.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Users size={26} className="text-slate-300" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-600 m-0">
                {busqueda ? 'Ningún empleado coincide con la búsqueda' : 'No hay empleados'}
              </p>
            </div>
          )}

          {lista.map((empleado) => {
            const activo = esActivo(empleado);
            return (
              <div key={empleado.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className={`w-8 h-8 shrink-0 rounded-full text-xs font-bold flex items-center justify-center uppercase ${
                      activo ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {String(empleado.nombre || '?').trim().charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate m-0">
                      {empleado.nombre}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] rounded-full font-semibold border py-0.5 px-2 mt-1 ${
                        activo
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirEditar(empleado)}
                    aria-label={`Editar a ${empleado.nombre}`}
                    className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-amber-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  {activo ? (
                    <button
                      type="button"
                      onClick={() => setEmpleadoDesactivar(empleado)}
                      aria-label={`Desactivar a ${empleado.nombre}`}
                      className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-amber-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 cursor-pointer"
                    >
                      <PowerOff size={16} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivar(empleado)}
                      aria-label={`Activar a ${empleado.nombre}`}
                      className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                    >
                      <Power size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* pie */}
        {lista.length > 0 && (
          <div className="border-t border-slate-200 flex justify-between items-center gap-3 flex-wrap text-[13px] text-slate-500 bg-slate-50/60 px-5 py-4">
            <span>
              Mostrando{' '}
              <strong className="text-slate-700 font-semibold tabular-nums">{lista.length}</strong>{' '}
              {lista.length === 1 ? 'empleado' : 'empleados'}
              {busqueda && ' (filtrados)'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={12} className="text-slate-300" aria-hidden="true" />
              Los empleados no se eliminan, solo se desactivan
            </span>
          </div>
        )}
      </div>

      {/* ═══ MODALES ═══ */}
      {/* El `key` remonta el modal en cada apertura, así su estado interno
          (nombre, error, guardando) arranca limpio sin un efecto que sincronice
          props -> estado. */}
      <EmpleadoFormModal
        key={formKey}
        open={modalFormOpen}
        empleado={empleadoEditar}
        onClose={() => {
          setModalFormOpen(false);
          setEmpleadoEditar(null);
        }}
        onGuardar={handleGuardar}
      />

      <ConfirmarDesactivarModal
        key={empleadoDesactivar ? `desactivar-${empleadoDesactivar.id}` : 'desactivar-cerrado'}
        open={Boolean(empleadoDesactivar)}
        empleado={empleadoDesactivar}
        onClose={() => setEmpleadoDesactivar(null)}
        onConfirmar={handleDesactivar}
      />

      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
