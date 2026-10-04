import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePedidosCocinaStore } from '../../store/Usepedidoscocinastore';

const POLLING_MS = 30000;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0);

const iniciales = (nombre = '') =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

// "2026-09-29" -> { dia: '29', mes: 'sep' } (sin pasar por Date para evitar corrimientos de zona horaria)
const diaMes = (fechaLocal) => {
  if (!fechaLocal) return { dia: '', mes: '' };
  const [, m, d] = fechaLocal.split('-');
  return { dia: String(Number(d)), mes: MESES[Number(m) - 1] || '' };
};

// "14:30" / "14:30:00" / "2026-09-29 14:30:00" / "2026-09-29T14:30:00" -> "2:30 pm" (hora normal 12h)
const formatearHora12 = (hora) => {
  if (!hora) return '';
  const texto = String(hora).trim();

  // Busca el primer "HH:MM" en el texto, sin importar si viene solo, con ":SS" o dentro de una fecha ISO.
  const match = /(\d{1,2}):(\d{2})/.exec(texto);
  if (!match) return texto; // formato inesperado: se muestra tal cual

  let horas = Number(match[1]);
  const minutos = match[2];
  const sufijo = horas >= 12 ? 'pm' : 'am';

  horas = horas % 12;
  if (horas === 0) horas = 12; // 00:xx -> 12:xx am, 12:xx -> 12:xx pm

  return `${horas}:${minutos} ${sufijo}`;
};

const usuarioActual = () => {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  } catch {
    return null;
  }
};

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500';
const ETIQUETA = 'text-[10px] font-semibold uppercase tracking-wider text-[#8a90ad]';

/* ---------- Piezas pequeñas ---------- */

function Avatar({ nombre, chico = false }) {
  return chico ? (
    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-[9px] font-bold text-white">
      {iniciales(nombre)}
    </span>
  ) : (
    <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[11px] font-bold text-white">
      {iniciales(nombre)}
    </span>
  );
}

function DatosCliente({ pedido }) {
  return (
    <span className="flex min-w-0 flex-col">
      <strong className="text-sm">{pedido.nombre_cliente}</strong>
      {pedido.celular && <small className="text-xs text-[#8a90ad]">📞 {pedido.celular}</small>}
      {pedido.direccion && (
        <small className="break-words text-xs text-[#8a90ad]">📍 {pedido.direccion}</small>
      )}
    </span>
  );
}

function Hora({ pedido }) {
  const { dia, mes } = diaMes(pedido.fecha_entrega_local);
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="whitespace-nowrap text-[26px] font-extrabold leading-tight sm:text-[32px]">
        {formatearHora12(pedido.hora_entrega)}
      </span>
      <span className="whitespace-nowrap text-[13px] font-bold text-indigo-600">
        /{dia} /{mes}
      </span>
    </div>
  );
}

function Saldo({ valor, etiqueta, grande = false }) {
  const pagado = !valor || valor <= 0;
  if (pagado) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-green-100 px-3.5 py-3 text-[13px] text-green-800">
        <span>{etiqueta}</span>
        <strong className="text-base">Pagado</strong>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-3.5 py-3 text-[13px] text-white">
      <span>{etiqueta}</span>
      <strong className={grande ? 'text-[26px]' : 'text-xl'}>{fmtCOP(valor)}</strong>
    </div>
  );
}

/* ---------- Productos de un pedido (card y modal comparten esta lista) ---------- */

function ItemsPedido({ items, expandirTodo = false }) {
  const [abiertos, setAbiertos] = useState({});
  const alternar = (id) => setAbiertos((a) => ({ ...a, [id]: !a[id] }));

  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {items.map((it) => {
        if (it.tipo !== 'combo') {
          return (
            <li key={it.id} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 flex-none rounded-full bg-cyan-500" />
              <span>{it.nombre}</span>
              {it.cantidad > 1 && (
                <span className="ml-auto text-[13px] font-bold text-indigo-600">×{it.cantidad}</span>
              )}
            </li>
          );
        }
        const abierto = expandirTodo || abiertos[it.id];
        const comps = it.componentes || [];
        return (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => !expandirTodo && alternar(it.id)}
              aria-expanded={!!abierto}
              disabled={expandirTodo}
              className={`flex w-full items-center gap-2 text-left text-sm font-semibold disabled:cursor-default ${FOCO}`}
            >
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 flex-none place-items-center rounded-md bg-indigo-100 text-xs text-indigo-600 transition-transform motion-reduce:transition-none ${
                  abierto ? 'rotate-0' : '-rotate-90'
                }`}
              >
                ▾
              </span>
              <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                COMBO{it.personalizado ? ' · PERSONALIZADO' : ''}
              </span>
              <span>{it.nombre}</span>
              {it.cantidad > 1 && (
                <span className="ml-auto text-[13px] font-bold text-indigo-600">×{it.cantidad}</span>
              )}
            </button>
            {abierto && (
              <ul className="m-0 ml-7 mt-1.5 flex list-none flex-col gap-1 rounded-lg bg-[#f6f7ff] p-2.5">
                {comps.length === 0 && (
                  <li className="text-[13px] text-[#8a90ad]">Sin detalle de composición</li>
                )}
                {comps.map((c) => (
                  <li key={c.producto_id} className="flex justify-between text-[13px] text-[#3b4067]">
                    <span>{c.nombre.trim()}</span>
                    <span className="font-bold text-indigo-600">×{c.unidades_total ?? c.unidades}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Tarjeta ---------- */

function TarjetaPedido({ pedido, entregando, onPedirConfirmacion, onAbrir }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-md shadow-indigo-950/10">
      <div className="h-1 bg-gradient-to-r from-indigo-600 to-cyan-500" />

      <div className="flex justify-between px-4 pb-2.5 pt-3.5">
        <div>
          <span className={ETIQUETA}>Pedido #{pedido.id}</span>
          <Hora pedido={pedido} />
        </div>
        <span className="self-start rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
          Pendiente
        </span>
      </div>

      <button
        type="button"
        onClick={() => onAbrir(pedido.id)}
        className={`flex w-full items-center gap-2.5 border-y border-[#e4e7f3] px-4 py-3 text-left ${FOCO}`}
      >
        <Avatar nombre={pedido.nombre_cliente} />
        <DatosCliente pedido={pedido} />
      </button>

      <div className="flex flex-col gap-1.5 px-4 pt-3">
        <span className={ETIQUETA}>Productos</span>
        <ItemsPedido items={pedido.items} />
      </div>

      <div className="px-4 pt-3">
        <Saldo valor={pedido.saldo_pendiente} etiqueta="Por cobrar" />
      </div>

      <div className="flex flex-col gap-1.5 px-4 pt-3">
        <span className={ETIQUETA}>Observación</span>
        <div
          className={`min-h-12 rounded-lg border border-[#e4e7f3] bg-[#f6f7fc] px-2.5 py-2 text-[13px] ${
            pedido.observacion ? '' : 'text-[#b0b5cc]'
          }`}
        >
          {pedido.observacion || 'Sin observaciones…'}
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-4 pt-3.5">
        <button
          type="button"
          onClick={() => onAbrir(pedido.id)}
          className={`rounded-xl border border-[#e4e7f3] bg-white px-3.5 py-3 text-sm font-semibold text-indigo-600 ${FOCO}`}
        >
          Ver detalle
        </button>
        <button
          type="button"
          disabled={entregando}
          onClick={() => onPedirConfirmacion(pedido.id)}
          className={`flex-1 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 py-3 text-[15px] font-bold text-white shadow-lg shadow-indigo-600/30 disabled:cursor-progress disabled:opacity-60 ${FOCO}`}
        >
          {entregando ? 'Marcando…' : 'Entregar'}
        </button>
      </div>
    </article>
  );
}

/* ---------- Modal de detalle ---------- */

function ModalDetalle({ pedido, entregando, onPedirConfirmacion, onCerrar }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1226]/55 p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle del pedido ${pedido.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[18px] bg-white"
      >
        <div className="flex justify-between px-5 pb-3 pt-[18px]">
          <div>
            <span className={ETIQUETA}>Detalle del pedido #{pedido.id}</span>
            <Hora pedido={pedido} />
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className={`self-start text-base text-[#8a90ad] ${FOCO}`}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3.5 overflow-y-auto px-5 pb-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#e4e7f3] bg-[#fafbff] px-4 py-3">
            <Avatar nombre={pedido.nombre_cliente} />
            <DatosCliente pedido={pedido} />
          </div>

          <Saldo valor={pedido.saldo_pendiente} etiqueta="Total a cobrar" grande />

          <div className="flex flex-col gap-1.5">
            <span className={ETIQUETA}>Productos</span>
            <ItemsPedido items={pedido.items} expandirTodo />
          </div>

          {pedido.observacion && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <span className={`${ETIQUETA} !text-amber-700`}>Observación</span>
              <p className="mt-1 text-sm">{pedido.observacion}</p>
            </div>
          )}
        </div>

        <div className="flex px-5 pb-[18px] pt-3.5">
          <button
            type="button"
            disabled={entregando}
            onClick={() => onPedirConfirmacion(pedido.id)}
            className={`flex-1 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 py-3 text-[15px] font-bold text-white shadow-lg shadow-indigo-600/30 disabled:cursor-progress disabled:opacity-60 ${FOCO}`}
          >
            {entregando ? 'Marcando…' : 'Entregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal de confirmación de entrega ---------- */

function ModalConfirmarEntrega({ pedido, entregando, onConfirmar, onCerrar }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !entregando && onCerrar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar, entregando]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f1226]/55 p-4"
      onClick={() => !entregando && onCerrar()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={`Confirmar entrega del pedido ${pedido.id}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-[18px] bg-white shadow-xl"
      >
        <div className="h-1 bg-gradient-to-r from-indigo-600 to-cyan-500" />

        <div className="flex flex-col gap-3 px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-indigo-100 text-xl text-indigo-600">
              📦
            </span>
            <div className="min-w-0">
              <span className={ETIQUETA}>Confirmar entrega</span>
              <h2 className="text-lg font-extrabold leading-tight">Pedido #{pedido.id}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-[#e4e7f3] bg-[#fafbff] px-4 py-3">
            <Avatar nombre={pedido.nombre_cliente} />
            <DatosCliente pedido={pedido} />
          </div>

          <p className="text-sm text-[#3b4067]">
            ¿Confirmas que este pedido ya fue entregado? Se registrará en cocina y no se podrá
            deshacer desde este panel.
          </p>
        </div>

        <div className="flex gap-2 px-5 pb-[18px]">
          <button
            type="button"
            disabled={entregando}
            onClick={onCerrar}
            className={`flex-1 rounded-xl border border-[#e4e7f3] bg-white px-4 py-3 text-sm font-semibold text-[#3b4067] hover:bg-[#f6f7fc] disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={entregando}
            onClick={onConfirmar}
            className={`flex-1 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 py-3 text-[15px] font-bold text-white shadow-lg shadow-indigo-600/30 disabled:cursor-progress disabled:opacity-60 ${FOCO}`}
          >
            {entregando ? 'Marcando…' : 'Sí, entregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pantalla ---------- */

export default function PanelCocina() {
  const navigate = useNavigate();
  const usuario = useMemo(() => usuarioActual(), []);

  const data = usePedidosCocinaStore((s) => s.data);
  const cargando = usePedidosCocinaStore((s) => s.cargando);
  const error = usePedidosCocinaStore((s) => s.error);
  const entregando = usePedidosCocinaStore((s) => s.entregando);
  const cargar = usePedidosCocinaStore((s) => s.cargar);
  const setFecha = usePedidosCocinaStore((s) => s.setFecha);
  const entregar = usePedidosCocinaStore((s) => s.entregar);
  const limpiarError = usePedidosCocinaStore((s) => s.limpiarError);

  const [detalleId, setDetalleId] = useState(null);
  const [confirmarId, setConfirmarId] = useState(null);

  // Carga inicial + polling. Se pausa con la pestaña oculta y se refresca al volver.
  useEffect(() => {
    cargar();
    const tick = () => document.visibilityState === 'visible' && cargar({ silencioso: true });
    const t = setInterval(tick, POLLING_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [cargar]);

  const detalle = data.pedidos.find((p) => p.id === detalleId) || null;
  const pedidoAConfirmar = data.pedidos.find((p) => p.id === confirmarId) || null;

  const manejarEntregar = async (id) => {
    const ok = await entregar(id);
    if (ok) {
      setDetalleId(null);
      setConfirmarId(null);
    }
  };

  const cerrarSesion = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('usuario')
  navigate('/login', { replace: true })
};

  return (
    <div className="min-h-screen bg-[#eef0f8] font-sans text-[#0f1226]">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 bg-[#0f1226] px-3.5 py-2.5 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-indigo-600 to-cyan-500 font-extrabold">
            S
          </span>
          <div>
            <small className="mb-0.5 block text-[11px] text-[#8b93ff]">Snack Flow · Entrega</small>
            <div className="flex items-center gap-2">
              <Avatar nombre={usuario?.nombre} chico />
              <strong>{usuario?.nombre || 'Usuario'}</strong>
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] text-cyan-300">
                Cocina
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2 text-xs text-[#8b93ff]">
            Fecha
            <input
              type="date"
              value={data.fecha || ''}
              onChange={(e) => setFecha(e.target.value)}
              className={`rounded-lg border border-[#343a7a] bg-[#1b1f3b] px-2.5 py-1.5 text-white [color-scheme:dark] ${FOCO}`}
            />
          </label>
          <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#1b1f3b] px-3.5 py-2 text-[13px] font-semibold">
            <b className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-cyan-500 px-1.5 text-xs">
              {data.total_entregados}
            </b>
            Entregados hoy
          </span>
          <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#1b1f3b] px-3.5 py-2 text-[13px] font-semibold">
            <span className="h-[7px] w-[7px] rounded-full bg-green-500" />
            {data.total_pendientes} pendientes
          </span>
          <button
            type="button"
            onClick={cerrarSesion}
            className={`rounded-[10px] border border-[#343a7a] px-3.5 py-2 text-[13px] text-indigo-200 hover:bg-[#1b1f3b] ${FOCO}`}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mx-3.5 mt-4 flex items-center justify-between gap-3 rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800 sm:mx-6"
        >
          <span>{error}</span>
          <button type="button" onClick={limpiarError} className={`font-semibold ${FOCO}`}>
            Cerrar
          </button>
        </div>
      )}

      <main className="grid grid-cols-1 items-start gap-[18px] px-3.5 pb-10 pt-5 sm:px-6 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {cargando && data.pedidos.length === 0 && (
          <p className="col-span-full py-16 text-center text-[#8a90ad]">Cargando pedidos…</p>
        )}
        {!cargando && data.pedidos.length === 0 && (
          <p className="col-span-full py-16 text-center text-[#8a90ad]">
            No hay pedidos pendientes para esta fecha.
          </p>
        )}
        {data.pedidos.map((p) => (
          <TarjetaPedido
            key={p.id}
            pedido={p}
            entregando={!!entregando[p.id]}
            onPedirConfirmacion={setConfirmarId}
            onAbrir={setDetalleId}
          />
        ))}
      </main>

      {detalle && (
        <ModalDetalle
          pedido={detalle}
          entregando={!!entregando[detalle.id]}
          onPedirConfirmacion={setConfirmarId}
          onCerrar={() => setDetalleId(null)}
        />
      )}

      {pedidoAConfirmar && (
        <ModalConfirmarEntrega
          pedido={pedidoAConfirmar}
          entregando={!!entregando[pedidoAConfirmar.id]}
          onConfirmar={() => manejarEntregar(pedidoAConfirmar.id)}
          onCerrar={() => setConfirmarId(null)}
        />
      )}
    </div>
  );
}