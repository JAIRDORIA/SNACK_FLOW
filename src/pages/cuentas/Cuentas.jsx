import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  History,
  Landmark,
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  actualizarMedioPago,
  cambiarEstadoMedioPago,
  crearMedioPago,
  eliminarMedioPago,
  listarMediosPago,
  obtenerSaldos,
} from '@/api/medios_pago_api';
import useMediosPagoStore from '@/store/useMediosPagoStore';
import { formatoMoneda } from '@/utils/formatoCifras';
import Toast from '@/components/Toast';
import CuentaFormModal from '@/components/cuentas/CuentaFormModal';
import ConfirmarCuentaModal from '@/components/cuentas/ConfirmarCuentaModal';
import RetiroCuentaModal from '@/components/cuentas/RetiroCuentaModal';
import MovimientosCuentaModal from '@/components/MovimientosCuentaModal';

// Gestión de cuentas de transferencia (solo admin).
//
// La lista sale de dos endpoints:
//   • GET /medios-pago/        → TODAS las cuentas (incluye inactivas y la de sistema)
//   • GET /medios-pago/saldos  → saldo / ingresos / egresos por cuenta + total
// Se muestran solo las de tipo transferencia con es_sistema = 0 y se unen por id.
// Si una cuenta no viene en /saldos, su saldo actual es 0.
//
// Diseño (ui-ux-pro-max), siguiendo el patrón de Empleados/Proveedores:
// encabezado con acción primaria, tarjeta con buscador, tabla densa con cabecera
// sticky, degradado a tarjetas en móvil y estados vacío / error / cargando.

const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// `activo` y `es_sistema` llegan como 1/0 (a veces string).
const esActiva = (cuenta) =>
  cuenta?.activo === 1 || cuenta?.activo === '1' || cuenta?.activo === true;

const esDeSistema = (cuenta) => Number(cuenta?.es_sistema) === 1;

const mensajeError = (err, porDefecto) =>
  err?.response?.data?.mensaje || err?.response?.data?.error || porDefecto;

export default function Cuentas() {
  const { cargarCuentas } = useMediosPagoStore();

  const [cuentas, setCuentas] = useState([]);
  const [totalTransferencia, setTotalTransferencia] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const [modalForm, setModalForm] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const [confirmacion, setConfirmacion] = useState(null); // { accion, cuenta }
  const [confirmKey, setConfirmKey] = useState(0);

  // Cuenta cuyos movimientos se están viendo (null = modal cerrado).
  const [cuentaMovimientos, setCuentaMovimientos] = useState(null);

  // Cuenta desde la que se está retirando a ahorros (null = modal cerrado).
  const [cuentaRetiro, setCuentaRetiro] = useState(null);

  const [toast, setToast] = useState(null);

  // Carga y une cuentas con saldos.
  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [resCuentas, resSaldos] = await Promise.all([
        listarMediosPago({ tipo: 'transferencia' }),
        obtenerSaldos(),
      ]);

      const todas = Array.isArray(resCuentas.data)
        ? resCuentas.data
        : resCuentas.data?.datos || [];
      const saldosData = resSaldos.data || {};
      const saldosPorId = new Map(
        (saldosData.cuentas || []).map((c) => [Number(c.medio_pago_id), c]),
      );

      const lista = todas
        // La de sistema nunca se gestiona aquí.
        .filter((c) => (!c.tipo || c.tipo === 'transferencia') && !esDeSistema(c))
        .map((c) => {
          const saldoInfo = saldosPorId.get(Number(c.id));
          const saldo = Number(saldoInfo?.saldo ?? 0);
          return {
            ...c,
            // Se usan en la tabla y en el modal de movimientos.
            saldo_actual: saldo,
            saldo,
            ingresos: Number(saldoInfo?.ingresos ?? 0),
            egresos: Number(saldoInfo?.egresos ?? 0),
          };
        });

      setCuentas(lista);
      setTotalTransferencia(Number(saldosData.total_transferencia ?? 0));
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las cuentas.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Tras cada acción: refresca la lista y la caché de cuentas asignables que
  // usarán los selectores de medio de pago en otros módulos.
  const refrescar = useCallback(async () => {
    await Promise.all([cargar(), cargarCuentas(true)]);
  }, [cargar, cargarCuentas]);

  const lista = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return cuentas;
    return cuentas.filter(
      (c) => normalizar(c.nombre).includes(q) || normalizar(c.titular).includes(q),
    );
  }, [cuentas, busqueda]);

  // ── Modales ──
  const abrirCrear = () => {
    setCuentaEditando(null);
    setFormKey((k) => k + 1);
    setModalForm(true);
  };

  const abrirEditar = (cuenta) => {
    setCuentaEditando(cuenta);
    setFormKey((k) => k + 1);
    setModalForm(true);
  };

  const cerrarForm = () => {
    setModalForm(false);
    setCuentaEditando(null);
  };

  const abrirConfirmacion = (accion, cuenta) => {
    setConfirmacion({ accion, cuenta });
    setConfirmKey((k) => k + 1);
  };

  // ── Acciones ──
  const guardarCuenta = async (payload) => {
    const esEdicion = Boolean(cuentaEditando);
    try {
      if (esEdicion) await actualizarMedioPago(cuentaEditando.id, payload);
      else await crearMedioPago(payload);

      setToast({
        mensaje: esEdicion ? 'Cuenta actualizada' : 'Cuenta creada',
        tipo: 'success',
      });
      await refrescar();
      return { ok: true };
    } catch (err) {
      const status = err.response?.status;
      return {
        ok: false,
        mensaje: mensajeError(err, 'No se pudo guardar la cuenta.'),
        // 409 = nombre duplicado: el modal lo muestra bajo el campo Nombre.
        campo: status === 409 ? 'nombre' : null,
        status,
      };
    }
  };

  // Activar no pide confirmación; desactivar sí.
  const activarCuenta = async (cuenta) => {
    try {
      await cambiarEstadoMedioPago(cuenta.id, true);
      setToast({ mensaje: 'Cuenta activada', tipo: 'success' });
      await refrescar();
    } catch (err) {
      setToast({
        mensaje: mensajeError(err, 'No se pudo activar la cuenta.'),
        tipo: 'error',
      });
    }
  };

  const confirmarAccion = async () => {
    if (!confirmacion) return { ok: false };
    const { accion, cuenta } = confirmacion;
    try {
      if (accion === 'eliminar') await eliminarMedioPago(cuenta.id);
      else await cambiarEstadoMedioPago(cuenta.id, false);

      setToast({
        mensaje: accion === 'eliminar' ? 'Cuenta eliminada' : 'Cuenta desactivada',
        tipo: 'success',
      });
      await refrescar();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        mensaje: mensajeError(
          err,
          accion === 'eliminar'
            ? 'No se pudo eliminar la cuenta.'
            : 'No se pudo desactivar la cuenta.',
        ),
        status: err.response?.status,
      };
    }
  };

  // El modal ya registró el retiro: se cierra, se avisa y se refresca la lista,
  // el total y la caché de cuentas asignables.
  const retiroExitoso = async (data) => {
    setCuentaRetiro(null);
    setToast({
      mensaje: data?.mensaje || 'Retiro registrado',
      tipo: 'success',
    });
    await refrescar();
  };

  const accionesFila = (cuenta) => {
    const activa = esActiva(cuenta);
    const saldoActual = Number(cuenta?.saldo_actual ?? 0);
    return (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setCuentaRetiro(cuenta)}
          disabled={saldoActual <= 0}
          title={saldoActual > 0 ? 'Retirar a ahorros' : 'Sin saldo disponible'}
          aria-label={`Retirar a ahorros de la cuenta ${cuenta.nombre}`}
          className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-emerald-600 hover:border-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500 cursor-pointer"
        >
          <PiggyBank size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setCuentaMovimientos(cuenta)}
          title="Ver movimientos"
          aria-label={`Ver movimientos de la cuenta ${cuenta.nombre}`}
          className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-indigo-600 hover:border-indigo-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 cursor-pointer"
        >
          <History size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(cuenta)}
          title="Editar"
          aria-label={`Editar la cuenta ${cuenta.nombre}`}
          className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-amber-500 hover:border-amber-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 cursor-pointer"
        >
          <Pencil size={16} aria-hidden="true" />
        </button>

        {activa ? (
          <button
            type="button"
            onClick={() => abrirConfirmacion('desactivar', cuenta)}
            title="Desactivar"
            aria-label={`Desactivar la cuenta ${cuenta.nombre}`}
            className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-amber-600 hover:border-amber-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-1 cursor-pointer"
          >
            <PowerOff size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => activarCuenta(cuenta)}
            title="Activar"
            aria-label={`Activar la cuenta ${cuenta.nombre}`}
            className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-emerald-600 hover:border-emerald-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 cursor-pointer"
          >
            <Power size={16} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={() => abrirConfirmacion('eliminar', cuenta)}
          title="Eliminar"
          aria-label={`Eliminar la cuenta ${cuenta.nombre}`}
          className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 transition-all hover:bg-rose-600 hover:border-rose-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 cursor-pointer"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    );
  };

  // ── Estados de carga / error inicial ──
  if (cargando && cuentas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Cargando cuentas...</p>
        </div>
      </div>
    );
  }

  if (error && cuentas.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4 max-w-2xl">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-rose-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-rose-700 font-semibold text-sm mb-1 m-0">
              Error al cargar las cuentas
            </p>
            <p className="text-rose-500 text-sm m-0 mb-4">{error}</p>
            <button
              type="button"
              onClick={cargar}
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

  return (
    <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ═══ ENCABEZADO ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#1B1D2E] flex items-center justify-center shrink-0">
            <Landmark size={20} color="#818cf8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B1D2E] truncate m-0">Cuentas</h1>
            <p className="text-xs text-slate-500 m-0">
              Cuentas de transferencia y su saldo actual
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-[#1B1D2E] rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <Wallet size={17} className="text-indigo-300 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-white/50 m-0 leading-tight">
                Total en cuentas
              </p>
              <p className="text-base sm:text-lg font-bold text-white tabular-nums m-0 leading-tight">
                ${formatoMoneda(totalTransferencia)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirCrear}
            className="w-full sm:w-auto justify-center flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/30 active:scale-95 transition-all whitespace-nowrap py-2.5 px-4 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
          >
            <Plus size={16} aria-hidden="true" />
            Nueva cuenta
          </button>
        </div>
      </div>

      {error && cuentas.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4"
        >
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-amber-700 m-0">
            {error}{' '}
            <button
              type="button"
              onClick={cargar}
              className="font-semibold underline hover:no-underline cursor-pointer"
            >
              Reintentar
            </button>
          </p>
        </div>
      )}

      {/* ═══ TABLA ═══ */}
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-sm"
        aria-busy={cargando}
      >
        {/* barra de búsqueda */}
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
              placeholder="Buscar por nombre o titular..."
              aria-label="Buscar cuentas por nombre o titular"
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
          </div>

          {cargando && cuentas.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              Actualizando...
            </span>
          )}
        </div>

        {/* ── Tabla (md y superior) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {[
                  { label: 'Nombre', align: 'left' },
                  { label: 'Titular', align: 'left' },
                  { label: 'Saldo inicial', align: 'right' },
                  { label: 'Saldo actual', align: 'right' },
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
                  <td colSpan={6} className="px-4 py-24">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Landmark size={26} className="text-slate-300" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 m-0">
                        {busqueda
                          ? 'Ninguna cuenta coincide con la búsqueda'
                          : 'Aún no hay cuentas de transferencia'}
                      </p>
                      <p className="text-xs text-slate-400 m-0">
                        {busqueda
                          ? 'Prueba con otro nombre o titular'
                          : 'Crea la primera cuenta con el botón "Nueva cuenta"'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                lista.map((cuenta, i) => {
                  const activa = esActiva(cuenta);
                  return (
                    <tr
                      key={cuenta.id}
                      className={`transition-colors ${
                        i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      } hover:bg-indigo-50/50`}
                    >
                      <td className="px-4 py-3 border-b border-slate-100 max-w-[240px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            aria-hidden="true"
                            className={`w-7 h-7 shrink-0 rounded-full text-[11px] font-bold flex items-center justify-center uppercase ${
                              activa
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {String(cuenta.nombre || '?').trim().charAt(0)}
                          </span>
                          <span
                            className={`text-[13px] font-medium truncate ${
                              activa ? 'text-slate-700' : 'text-slate-500'
                            }`}
                            title={cuenta.nombre}
                          >
                            {cuenta.nombre}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 border-b border-slate-100 text-[13px] text-slate-500 max-w-[200px]">
                        <span className="block truncate" title={cuenta.titular || ''}>
                          {cuenta.titular || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3 border-b border-slate-100 text-right text-[13px] text-slate-500 tabular-nums whitespace-nowrap">
                        ${formatoMoneda(cuenta.saldo_inicial)}
                      </td>

                      <td className="px-4 py-3 border-b border-slate-100 text-right text-[13px] font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        ${formatoMoneda(cuenta.saldo_actual)}
                      </td>

                      <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] rounded-full font-semibold border py-1 px-2.5 ${
                            activa
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`w-1.5 h-1.5 rounded-full ${
                              activa ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>

                      <td className="px-4 py-3 border-b border-slate-100">
                        {accionesFila(cuenta)}
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
                <Landmark size={26} className="text-slate-300" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-600 m-0">
                {busqueda ? 'Ninguna cuenta coincide con la búsqueda' : 'Aún no hay cuentas'}
              </p>
              <p className="text-xs text-slate-400 m-0">
                {busqueda ? 'Prueba con otro nombre o titular' : 'Crea la primera con "Nueva cuenta"'}
              </p>
            </div>
          )}

          {lista.map((cuenta) => {
            const activa = esActiva(cuenta);
            return (
              <div key={cuenta.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`w-8 h-8 shrink-0 rounded-full text-xs font-bold flex items-center justify-center uppercase ${
                        activa ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {String(cuenta.nombre || '?').trim().charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate m-0">
                        {cuenta.nombre}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5 m-0">
                        {cuenta.titular || 'Sin titular'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] rounded-full font-semibold border py-0.5 px-2 shrink-0 ${
                      activa
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 m-0">
                      Saldo inicial
                    </p>
                    <p className="text-sm text-slate-600 tabular-nums m-0">
                      ${formatoMoneda(cuenta.saldo_inicial)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 m-0">
                      Saldo actual
                    </p>
                    <p className="text-sm font-bold text-slate-800 tabular-nums m-0">
                      ${formatoMoneda(cuenta.saldo_actual)}
                    </p>
                  </div>
                </div>

                <div className="mt-3">{accionesFila(cuenta)}</div>
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
              {lista.length === 1 ? 'cuenta' : 'cuentas'}
              {busqueda && ' (filtradas)'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Landmark size={12} className="text-slate-300" aria-hidden="true" />
              El saldo actual se calcula con los movimientos registrados
            </span>
          </div>
        )}
      </div>

      {/* ═══ MODALES ═══ */}
      <CuentaFormModal
        key={formKey}
        open={modalForm}
        cuenta={cuentaEditando}
        onClose={cerrarForm}
        onGuardar={guardarCuenta}
      />

      <ConfirmarCuentaModal
        key={confirmKey}
        open={Boolean(confirmacion)}
        cuenta={confirmacion?.cuenta || null}
        accion={confirmacion?.accion || 'desactivar'}
        onClose={() => setConfirmacion(null)}
        onConfirmar={confirmarAccion}
      />

      {cuentaMovimientos && (
        <MovimientosCuentaModal
          cuenta={cuentaMovimientos}
          onClose={() => setCuentaMovimientos(null)}
        />
      )}

      {cuentaRetiro && (
        <RetiroCuentaModal
          cuenta={cuentaRetiro}
          onClose={() => setCuentaRetiro(null)}
          onExito={retiroExitoso}
        />
      )}

      {toast && (
        <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
