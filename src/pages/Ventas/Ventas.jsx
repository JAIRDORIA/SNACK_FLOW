import { useState, useRef, useEffect } from "react";
import axios from "@/api/axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Info,
  TrendingUp,
  DollarSign,
  Clock3,
  ShoppingBag,
  PanelBottom,
  CheckCheck,
  Receipt,
  Printer,
  CircleCheckBig,
} from "lucide-react";
import useVentasStore from "@/store/useVentasStore";
import NuevaVentaModal from "@/components/nuevaVentaModal";
import {
  getVentaDetalle,
  getVentaComprobante,
  anularVenta,
} from "@/api/ventas_api";
import useAbonosStore from "@/store/useAbonoStore";
import useDashboardStore from "@/store/useDashboardStore";
import useEditarVentaStore from "@/store/useEditarVentaStore";
import EditarVentaModal from "@/components/EditarVentaModal";
import { capitalizarNombre } from "@/utils/formatearTexto";
import { formatearFechaColombia } from "@/utils/formatearFecha";
import usePorConfirmarStore from "@/store/usePorConfirmarStore";

// ══════════════════════════════════════════
// CONFIGURACION DE ESTILOS
// ══════════════════════════════════════════
const ESTADOS_CONFIG = {
  pendiente: {
    bg: "#fef9e7",
    color: "#b45309",
    border: "#fde68a",
    icon: <Clock size={12} />,
    label: "Pendiente",
  },
  entregada: {
    bg: "#f0fdf4",
    color: "#15803d",
    border: "#bbf7d0",
    icon: <CheckCircle size={12} />,
    label: "Entregada",
  },
  anulada: {
    bg: "#fef2f2",
    color: "#dc2626",
    border: "#fecaca",
    icon: <XCircle size={12} />,
    label: "Anulada",
  },
};

const TIPO_CONFIG = {
  efectivo: { bg: "#f0fdf4", color: "#15803d", label: "Efectivo" },
  transferencia: { bg: "#eff6ff", color: "#1d4ed8", label: "Transferencia" },
  otro: { bg: "#f9fafb", color: "#6b7280", label: "Otro" },
  deben: { bg: "#f3f4f6", color: "#9ca3af", label: "Deben" },
  error: { bg: "#fee2e2", color: "#b91c1c", label: "Error" },
};

// ══════════════════════════════════════════
// AVISO: PEDIDOS ENTREGADOS EN COCINA POR CONFIRMAR
// ══════════════════════════════════════════
// El backend guarda `entregada_cocina_at` en UTC; la conversión a hora Colombia
// se hace solo aquí, al presentar (regla del proyecto). `hora_local` ya viene
// resuelta por el backend en hora Colombia (HH:mm), así que se usa tal cual.
// `hora_local` llega del backend en formato militar (HH:mm, 24h). Para mostrarlo
// en el aviso se convierte a 12 horas con AM/PM. Si no se puede parsear, se
// devuelve el valor original tal cual.
const hora12 = (horaLocal) => {
  if (!horaLocal) return "";
  const [hStr, mStr] = String(horaLocal).split(":");
  const horas = Number(hStr);
  const minutos = Number(mStr);
  if (isNaN(horas) || isNaN(minutos)) return horaLocal;

  const sufijo = horas >= 12 ? "PM" : "AM";
  const hora12h = horas % 12 === 0 ? 12 : horas % 12;
  return `${hora12h}:${String(minutos).padStart(2, "0")} ${sufijo}`;
};

const fechaColombiaClave = (fechaUtc) => {
  if (!fechaUtc) return null;
  try {
    const fecha = fechaUtc.includes("T")
      ? new Date(fechaUtc)
      : new Date(`${fechaUtc} UTC`); // formato MySQL "YYYY-MM-DD HH:MM:SS" es UTC
    if (isNaN(fecha.getTime())) return null;
    // en-CA produce YYYY-MM-DD, ideal para comparar claves de día
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(fecha);
  } catch {
    return null;
  }
};

// Devuelve "Hoy" si el pedido es de hoy, "Ayer" si fue el día anterior y la
// fecha corta (dd/mm/aaaa) si es más antiguo. Siempre en hora Colombia.
const etiquetaDiaPedido = (fechaUtc) => {
  const clave = fechaColombiaClave(fechaUtc);
  if (!clave) return null;

  const hoy = fechaColombiaClave(new Date().toISOString());
  if (clave === hoy) return "Hoy";

  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (clave === fechaColombiaClave(ayer)) return "Ayer";

  return formatearFechaColombia(fechaUtc, false);
};

// ══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════
export default function Ventas() {
  const { ventas, total, pagina, total_paginas, cargando, error, fetchVentas } =
    useVentasStore();

  const [detalleVenta, setDetalleVenta] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaInput, setBusquedaInput] = useState(busqueda);
  const [modalOpen, setModalOpen] = useState(false);
  const [eliminarId, setEliminarId] = useState(null);
  const [anulando, setAnulando] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [cargandoComprobante, setCargandoComprobante] = useState(false);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [panelFiltro, setPanelFiltro] = useState(false);
  const [filtroEstados, setFiltroEstados] = useState([]);
  const [filtroTipos, setFiltroTipos] = useState([]);
  const filtroRef = useRef(null);
  const [modalNuevaVenta, setModalNuevaVenta] = useState(false);
  const { cargarAbonos, getMedioPago } = useAbonosStore();
  const { balance } = useDashboardStore();
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [ventaAEditar, setVentaAEditar] = useState(null);
  const { cargarVenta } = useEditarVentaStore();
  const [entregarId, setEntregarId] = useState(null);
  const [entregando, setEntregando] = useState(false);
  const [buscando, setBuscando] = useState(false)
  const debounceRef = useRef(null)

  // ── Aviso de pedidos entregados en cocina por confirmar ──
  const { pedidos: pedidosPorConfirmar, fetchPorConfirmar } = usePorConfirmarStore();
  const [modalPorConfirmarOpen, setModalPorConfirmarOpen] = useState(false);

  // El `id` del endpoint /pedidos-cocina/por-confirmar es el id de la venta.
  // En esta tabla el id visible es `v.id_venta`, pero el `key` usa `v.id`;
  // se comparan ambos para no depender de cuál expone la respuesta de /ventas/.
  const esVentaPorConfirmar = (v) =>
    pedidosPorConfirmar.find(
      (p) =>
        String(p.id) === String(v.id_venta) || String(p.id) === String(v.id),
    );

  // El modal de listado se cierra solo cuando ya no queda nada por confirmar
  // (p. ej. tras confirmar el último pedido). El polling sigue activo mientras
  // está abierto, así que un pedido nuevo vuelve a aparecer.
  useEffect(() => {
    if (modalPorConfirmarOpen && pedidosPorConfirmar.length === 0) {
      setModalPorConfirmarOpen(false);
    }
  }, [modalPorConfirmarOpen, pedidosPorConfirmar.length]);

  // Cerrar el listado con Escape
  useEffect(() => {
    if (!modalPorConfirmarOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setModalPorConfirmarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalPorConfirmarOpen]);

  // Carga inicial + refresco cada 30 s (silencioso, sin spinner).
  // Se pausa con la pestaña oculta para no gastar peticiones.
  useEffect(() => {
    fetchPorConfirmar({ silent: true });

    const intervalo = setInterval(() => {
      if (document.hidden) return;
      fetchPorConfirmar({ silent: true });
    }, 30000);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value) => {
    setBusquedaInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBusqueda(value)
      setBuscando(true)                          // Activa spinner local
      await fetchVentas(1, 20, null, value, { silent: true }) // Búsqueda silenciosa
      setBuscando(false)                         // Desactiva spinner local
    }, 300)
  }

  // Cargar tipos de pago para las ventas visibles

  const verComprobante = async (id) => {
    setCargandoComprobante(true);
    try {
      const res = await getVentaComprobante(id);
      setComprobante(res.data);
      setMostrarComprobante(true);
    } catch (err) {
      console.error("Error al cargar comprobante", err);
      // Opcional: mostrar un mensaje de error
    } finally {
      setCargandoComprobante(false);
    }
  };

  const imprimirComprobante = (data) => {
    // Construir HTML con los datos
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprobante ${data.numero}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
        h2 { color: #4f46e5; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        .info p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }
        th { background-color: #f1f5f9; }
        .total { font-weight: bold; }
        .abonos { margin-top: 20px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <button onclick="window.print()" style="margin-bottom:20px;padding:8px 16px;background:#4f46e5;color:white;border:none;border-radius:8px;cursor:pointer;">
        🖨️ Imprimir comprobante
      </button>

      <h2>COMPROBANTE ${data.numero}</h2>

      <div class="info">
        <div>
          <p><strong>Cliente:</strong> ${data.nombre_cliente || "N/A"}</p>
          <p><strong>N° Venta:</strong> #${String(data.venta_id).padStart(3, "0")}</p>
        </div>
        <div>
          <p><strong>Fecha venta:</strong> ${data.fecha_venta || "N/A"}</p>
          <p><strong>Fecha entrega:</strong> ${data.fecha_entrega || "N/A"}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${(data.detalle || [])
        .map(
          (item) => `
            <tr>
              <td>${item.nombre_producto}</td>
              <td>${item.cantidad}</td>
              <td>$${item.precio_unitario?.toLocaleString("es-CO")}</td>
              <td>$${item.subtotal?.toLocaleString("es-CO")}</td>
            </tr>
          `,
        )
        .join("")}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 250px;">
          <p style="display: flex; justify-content: space-between;"><span>Total:</span> <strong>$${data.total?.toLocaleString("es-CO")}</strong></p>
        </div>
      </div>

      ${data.abonos?.length
        ? `
      <div class="abonos">
        <h3>Abonos</h3>
        <table>
          <thead><tr><th>Fecha</th><th>Monto</th><th>Medio</th></tr></thead>
          <tbody>
            ${data.abonos
          .map(
            (a) => `
              <tr>
                <td>${a.fecha}</td>
                <td>$${a.monto?.toLocaleString("es-CO")}</td>
                <td>${a.medio_pago}</td>
              </tr>
            `,
          )
          .join("")}
          </tbody>
        </table>
      </div>
      `
        : ""
      }
    </body>
    </html>
  `;

    const ventana = window.open("", "_blank", "width=800,height=600");
    ventana.document.write(html);
    ventana.document.close();
  };

  useEffect(() => {
    // si hay corte abierto filtra por ese corte
    // si no hay corte trae todas las ventas
    if (balance?.corte_numero) {
      fetchVentas(1, 20, balance.corte_id);
    } else {
      fetchVentas();
    }
  }, [balance]);

  useEffect(() => {
    const fn = (e) => {
      if (filtroRef.current && !filtroRef.current.contains(e.target))
        setPanelFiltro(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const toggleEstado = (v) =>
    setFiltroEstados((p) =>
      p.includes(v) ? p.filter((x) => x !== v) : [...p, v],
    );
  const toggleTipo = (v) =>
    setFiltroTipos((p) =>
      p.includes(v) ? p.filter((x) => x !== v) : [...p, v],
    );
  const limpiarFiltros = () => {
    setFiltroEstados([]);
    setFiltroTipos([]);
  };
  const nFiltros = filtroEstados.length + filtroTipos.length;

  const verDetalle = async (id) => {
    setCargandoDetalle(true);
    try {
      const res = await getVentaDetalle(id);
      setDetalleVenta(res.data);
    } catch (err) {
      console.error("Error al cargar detalle", err);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const entregarVenta = async (id) => {
    setEntregando(true);
    try {
      await axios.put(`/ventas/${id}`, { estado: "entregada" });
      fetchVentas(1, 20, balance.corte_id); // refrescar lista
      fetchPorConfirmar({ silent: true }); // refrescar aviso de cocina
      setEntregarId(null);
    } catch (err) {
      console.error("Error al entregar venta", err);
      alert(err.response?.data?.mensaje || "Error al marcar como entregada");
    } finally {
      setEntregando(false);
    }
  };
  const handleAnularVenta = async () => {
    if (!eliminarId) return;
    setAnulando(true);
    try {
      await anularVenta(eliminarId);
      fetchVentas(1, 20, balance.corte_id); // refrescar la lista
      fetchPorConfirmar({ silent: true }); // refrescar aviso de cocina
      setEliminarId(null);
    } catch (err) {
      console.error("Error al anular venta", err);
      alert(err.response?.data?.mensaje || "Error al anular la venta");
    } finally {
      setAnulando(false);
    }
  };

  const lista = ventas.filter((v) => {

    const matchE =
      filtroEstados.length === 0 || filtroEstados.includes(v.estado);

    const medioPagoActual = getMedioPago(v.id_venta);
    let matchT = false;



    if (filtroTipos.length === 0) {
      matchT = true; // sin filtros activos → mostrar todo
    } else {
      // Si "deben" está marcado, mostrar ventas con saldo pendiente > 0
      if (filtroTipos.includes('deben') && v.saldo_pendiente > 0) {
        matchT = true;
      }
      // Si el medio de pago real está en los filtros, mostrar
      const medioPagoActual = getMedioPago(v.id_venta);
      if (filtroTipos.includes(medioPagoActual)) {
        matchT = true;
      }
    }

    return matchE && matchT;
  });
  // Debería devolver la nueva función con 'saldo_pendiente > 0'

  useEffect(() => {
    if (lista.length > 0) {
      const ids = lista.map((v) => v.id_venta);
      cargarAbonos(ids);
    }
  }, [lista]);

  const ventasActivas = ventas.filter((v) => v.estado !== "anulada");
  const ventasAnuladas = ventas.filter((v) => v.estado === "anulada");

  const totalMonto = ventasActivas.reduce((acc, v) => acc + (v.total || 0), 0);
  const pendientes = ventasActivas.filter(
    (v) => v.estado === "pendiente",
  ).length;
  const entregadas = ventasActivas.filter(
    (v) => v.estado === "entregada",
  ).length;
  const anuladas = ventasAnuladas.length;
  const statCards = [
    {
      label: "Total Ventas",
      value: ventasActivas.length,
      icon: TrendingUp,
      ring: "ring-indigo-500/40",
      iconCol: "text-indigo-300",
    },
    {
      label: "Monto Total",
      value: totalMonto,
      icon: DollarSign,
      ring: "ring-emerald-500/40",
      iconCol: "text-emerald-300",
      isCurrency: true,
    },
    {
      label: "Pendientes",
      value: pendientes,
      icon: Clock,
      ring: "ring-amber-500/40",
      iconCol: "text-amber-300",
    },
    {
      label: "Entregadas",
      value: entregadas,
      icon: CheckCircle2,
      ring: "ring-emerald-500/40",
      iconCol: "text-emerald-300",
    },
    {
      label: "Anuladas",
      value: anuladas,
      icon: XCircle,
      ring: "ring-rose-500/40",
      iconCol: "text-rose-300",
    },
  ];

  if (cargando)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">
            Cargando ventas...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 max-w-2xl">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <div>
          <p className="text-red-700 font-semibold text-sm mb-1">
            Error al cargar ventas
          </p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="flex-1 bg-gray-50 p-8">
      <div

        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1
              className="m-0" style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#000000",
                textTransform: "uppercase",
                letterSpacing: "0.02em"
              }}
            >
              Gestión De Ventas
            </h1>
          </div>
        </div>
        <button
          onClick={() => setModalNuevaVenta(true)}

          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95 p-2"
        >
          <Plus className="w-4 h-4" />
          <span className="text-x">Nueva Venta</span>
        </button>
      </div>

      {/* ═══ KPI CARDS (Estilo Dashboard) ═══ */}
      <div

        className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8"
      >
        {/* Monto Total (sin anuladas) */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-2 sm:gap-4 hover:scale-[1.02] transition-all p-3 sm:p-4 lg:p-5"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div

            className="bg-[#13152280] ring-2 ring-orange-400/40 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 mt-3 mr-0 mb-3 ml-3"
          >
            <DollarSign
              size={16}
              className="sm:w-[18px] sm:h-[18px] lg:w-[22px] lg:h-[22px]"
              color="#fb923c"
            />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-white truncate">
              ${totalMonto.toLocaleString("es-CO")}
            </p>
            <p

              className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5"
            >
              Ingresos totales
            </p>
          </div>
        </div>

        {/* Total Ventas (activas) */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-2 sm:gap-4 hover:scale-[1.02] transition-all p-3 sm:p-4 lg:p-5"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div

            className="bg-[#13152280] ring-2 ring-indigo-500/40 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 mt-3 mr-0 mb-3 ml-3"
          >
            <ShoppingBag className="w-4 h-4 sm:w-[18px] sm:h-[18px] lg:w-6 lg:h-6 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl lg:text-3xl text-white truncate">
              {total}
            </p>
            <p

              className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5"
            >
              Total Ventas
            </p>
          </div>
        </div>

        {/* Entregadas */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-2 sm:gap-4 hover:scale-[1.02] transition-all p-3 sm:p-4 lg:p-5"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div

            className="bg-[#13152280] ring-2 ring-cyan-400/40 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 mt-3 mr-0 mb-3 ml-3"
          >
            <CheckCheck
              size={16}
              className="sm:w-[18px] sm:h-[18px] lg:w-[22px] lg:h-[22px]"
              color="#22d3ee"
            />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl lg:text-3xl text-white truncate">
              {entregadas}
            </p>
            <p

              className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5"
            >
              Entregadas
            </p>
          </div>
        </div>

        {/* Pendientes */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-2 sm:gap-4 hover:scale-[1.02] transition-all p-3 sm:p-4 lg:p-5"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div

            className="bg-[#13152280] ring-2 ring-[#e90e0e]/40 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 mt-3 mr-0 mb-3 ml-3"
          >
            <Clock3
              size={16}
              className="sm:w-[18px] sm:h-[18px] lg:w-[22px] lg:h-[22px]"
              color="#e90e0e"
            />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl lg:text-3xl text-white truncate">
              {pendientes}
            </p>
            <p

              className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5"
            >
              por entregar
            </p>
          </div>
        </div>

        {/* Anuladas (nueva tarjeta) */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-2 sm:gap-4 hover:scale-[1.02] transition-all p-3 sm:p-4 lg:p-5"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div

            className="bg-[#13152280] ring-2 ring-rose-500/40 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 mt-3 mr-0 mb-3 ml-3"
          >
            <XCircle
              size={16}
              className="sm:w-[18px] sm:h-[18px] lg:w-[22px] lg:h-[22px]"
              color="#f43f5e"
            />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl lg:text-3xl text-white truncate">
              {anuladas}
            </p>
            <p

              className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5"
            >
              Anuladas
            </p>
          </div>
        </div>
      </div>

      {/* ═══ AVISO COMPACTO: PEDIDOS ENTREGADOS EN COCINA POR CONFIRMAR ═══ */}
      {pedidosPorConfirmar.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl mb-8 p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-[240px]">
              <p className="text-amber-800 font-bold text-sm">
                Pedidos entregados por cocina pendientes de actualizar
              </p>
              <p className="text-amber-700/90 text-sm mt-0.5">
                La cocina ya entregó pedidos que siguen pendientes en Ventas.
                Revisalos y márcalos como entregados.
              </p>
            </div>
            <button
              onClick={() => setModalPorConfirmarOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95 p-2"
              style={{ cursor: "pointer" }}
            >
              <CheckCheck className="w-4 h-4" />
              <span className="text-x">Revisar en Ventas</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ TABLA ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible">
        {/* barra busqueda + filtro */}
        <div
          className="border-b border-slate-100 flex gap-4 items-center flex-wrap p-3"

        >
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <input
              className="pl-12 pr-4 pt-3 pb-3"
              type="text"
              placeholder="Buscar por ID, cliente, fecha o estado..."
              value={busquedaInput}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            {buscando && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-indigo-500" />
              </div>
            )}
          </div>

          <div ref={filtroRef} className="relative">
            <button
              onClick={() => setPanelFiltro((p) => !p)}
              className="flex items-center gap-2.5 rounded-xl text-sm font-medium transition-all duration-200 py-3 px-5"
              style={{
                border:
                  nFiltros > 0 ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                background: nFiltros > 0 ? "#eef2ff" : "#fff",
                color: nFiltros > 0 ? "#4f46e5" : "#64748b",
                cursor: "pointer"
              }}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {nFiltros > 0 && (
                <span
                  className="text-white rounded-full text-xs font-bold "
                  style={{ background: "#4f46e5" }}
                >
                  {nFiltros}
                </span>
              )}
              <ChevronDown
                size={14}
                style={{
                  transform: panelFiltro ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {panelFiltro && (
              <div

                className="absolute top-full left-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 min-w-80 mt-3 p-6"
              >
                <p

                  className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4"
                >
                  Estado
                </p>
                <div

                  className="flex flex-col gap-3 mb-6"
                >
                  {Object.entries(ESTADOS_CONFIG).map(([key, cfg]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={filtroEstados.includes(key)}
                        onChange={() => toggleEstado(key)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <span
                        className="inline-flex items-center gap-2 rounded-full text-xs font-medium border py-2 px-3"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          borderColor: cfg.border
                        }}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </label>
                  ))}
                </div>

                <p

                  className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4"
                >
                  Tipo de Pago
                </p>
                <div

                  className="flex flex-col gap-3 mb-6"
                >
                  {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filtroTipos.includes(key)}
                        onChange={() => toggleTipo(key)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <span
                        className="rounded-full text-xs font-medium border border-transparent py-2 px-4 py-2 px-4"
                        style={{
                          background: cfg.bg,
                          color: cfg.color
                        }}
                      >
                        {cfg.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div

                  className="border-t border-slate-100 flex justify-between pt-4"
                >
                  <button
                    onClick={limpiarFiltros}
                    disabled={nFiltros === 0}
                    className="text-sm font-medium text-red-500 disabled:text-slate-300 bg-transparent border-none cursor-pointer hover:text-red-600 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                  <button
                    onClick={() => setPanelFiltro(false)}
                    className="text-sm font-semibold text-indigo-600 bg-transparent border-none cursor-pointer hover:text-indigo-700 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* tabla */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                {[
                  "ID Venta",
                  "Fecha de Entrega",
                  "Cliente",
                  "Total",
                  "Pagada",
                  "Estado",
                  "Acciones",
                ].map((h, i) => (
                  <th
                    key={h}

                    className={`text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider ${i === 0 ? "pl-8" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td

                    colSpan={7}
                    className="text-center text-slate-400 pt-20 pb-20"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">
                        No se encontraron ventas
                      </p>
                      <p className="text-x text-slate-400">
                        Intenta ajustar los filtros o la búsqueda
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                lista.map((v, i) => {
                  const medioPago = getMedioPago(v.id_venta);
                  const tipoCfg = TIPO_CONFIG[medioPago] ?? TIPO_CONFIG.otro;
                  const estadoCfg =
                    ESTADOS_CONFIG[v.estado] ?? ESTADOS_CONFIG.pendiente;
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
                    >
                      <td

                        className="py-4 px-6 pl-8"
                      >
                        <span className="font-semibold text-sm text-indigo-600">
                          #{String(v.id_venta).padStart(3, "0")}
                        </span>
                      </td>
                      <td

                        className="text-slate-500 text-sm whitespace-nowrap py-4 px-6"
                      >
                        {formatearFechaColombia(v.fecha_entrega)}
                      </td>
                      <td

                        className="text-slate-700 font-medium text-sm py-4 px-6"
                      >
                        {capitalizarNombre(v.nombre_cliente)}
                      </td>
                      <td

                        className="text-slate-700 font-semibold text-sm py-4 px-6"
                      >
                        ${v.total?.toLocaleString("es-CO")}
                      </td>
                      {/* Columna Pagada */}
                      <td className="px-6 py-4">
                        {v.saldo_pendiente === 0 ? (
                          <span

                            className="inline-flex items-center gap-1 text-xs rounded-full font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 py-1.5 px-3.5"
                          >
                            <CheckCircle2 size={12} />
                            Pagada
                          </span>
                        ) : (
                          <span

                            className="inline-flex items-center gap-1 text-xs rounded-full font-medium bg-amber-50 text-amber-600 border border-amber-200 py-1.5 px-3.5"
                          >
                            <Clock size={12} />
                            Debe
                          </span>
                        )}
                      </td>
                      <td

                        className="py-4 px-6"
                      >
                        <span
                          className="inline-flex items-center gap-1.5 text-xs rounded-full font-medium border py-1.5 px-3.5"
                          style={{
                            background: estadoCfg.bg,
                            color: estadoCfg.color,
                            borderColor: estadoCfg.border
                          }}
                        >
                          {estadoCfg.icon}
                          {estadoCfg.label}
                        </span>
                        {(() => {
                          const porConfirmar = esVentaPorConfirmar(v);
                          if (!porConfirmar) return null;
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 mt-1 py-1 px-2.5">
                              <CheckCheck size={11} />
                              En cocina · {hora12(porConfirmar.hora_local)}
                            </span>
                          );
                        })()}
                      </td>
                      <td
                        className="py-5 px-3.5 pr-7"
                      >
                        <div className="flex gap-1">
                          <button
                            title="Ver detalle"
                            onClick={() => verDetalle(v.id_venta)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-indigo-50"
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <Info size={16} color="#4f46e5" />
                          </button>
                          {v.estado === "pendiente" && (
                            <button
                              title="Editar"
                              onClick={() => {
                                cargarVenta(v.id_venta); // ← carga los datos en el store
                                setEditarModalOpen(true); // ← abre el modal
                              }}
                              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-amber-50"
                              style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                              }}
                            >
                              <Pencil size={16} color="#f59e0b" />
                            </button>
                          )}
                          {/* Botón de entregar (solo pendientes) */}
                          {v.estado === "pendiente" && (
                            <button
                              title="Marcar como entregada"
                              onClick={() => setEntregarId(v.id_venta)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-emerald-50"
                              style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                              }}
                            >
                              <CircleCheckBig size={16} color="#10b981" />
                            </button>
                          )}
                          <button
                            title="Anular"
                            onClick={() => setEliminarId(v.id_venta)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* pie tabla */}
        <div

          className="border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/30 py-5 px-8"
        >
          <span className="text-sm">
            Mostrando{" "}
            <strong className="text-slate-700 font-semibold">
              {lista.length}
            </strong>{" "}
            de <strong className="text-slate-700 font-semibold">{total}</strong>{" "}
            ventas
          </span>

          {total_paginas > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchVentas(pagina - 1, 20, null, busqueda)}
                disabled={pagina === 1}
                className="border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600 py-2.5 px-4"
                style={{
                  cursor: pagina === 1 ? "not-allowed" : "pointer"
                }}
              >
                ← Anterior
              </button>
              <span

                className="text-sm text-slate-500 font-medium pl-3 pr-3"
              >
                {pagina} / {total_paginas}
              </span>
              <button
                onClick={() => fetchVentas(pagina + 1, 20, null, busqueda)}
                disabled={pagina === total_paginas}
                className="border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600 py-2.5 px-4"
                style={{
                  cursor: pagina === total_paginas ? "not-allowed" : "pointer"
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODAL CONFIRMAR ANULAR ═══ */}
      {eliminarId && (
        <div

          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-1"
        >
          <div

            className="bg-white rounded-2xl w-full max-w-md shadow-2xl text-center p-2"
          >
            <div

              className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-1.5 my-0 mx-auto"
            >
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <p

              className="font-bold text-xl text-slate-800 mb-0.5"
            >
              ¿Anular venta?
            </p>
            <p

              className="text-x text-slate-500 leading-relaxed mb-2"
            >
              La venta{" "}
              <span className="font-semibold text-indigo-600">
                #{String(eliminarId).padStart(3, "0")}
              </span>{" "}
              será anulada. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEliminarId(null)}
                disabled={anulando}
                className="flex-1 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all py-3 px-0"
                style={{
                  cursor: anulando ? "not-allowed" : "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAnularVenta}
                disabled={anulando}
                className="flex-1 border-none rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 py-3 px-0"
                style={{
                  cursor: anulando ? "not-allowed" : "pointer"
                }}
              >
                {anulando ? "Anulando..." : "Sí, anular"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══ MODAL: PEDIDOS ENTREGADOS EN COCINA POR CONFIRMAR ═══ */}
      {modalPorConfirmarOpen && pedidosPorConfirmar.length > 0 && (
        <div
          onClick={() => setModalPorConfirmarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[55] p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 py-4 px-6">
              <h2 className="font-bold text-lg text-slate-800">
                {pedidosPorConfirmar.length} pedido
                {pedidosPorConfirmar.length === 1 ? "" : "s"} entregado
                {pedidosPorConfirmar.length === 1 ? "" : "s"} en cocina por
                confirmar
              </h2>
              <button
                onClick={() => setModalPorConfirmarOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                style={{ border: "none", background: "transparent", cursor: "pointer" }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 flex flex-col gap-2">
              {pedidosPorConfirmar.map((p) => {
                const etiquetaDia = etiquetaDiaPedido(p.entregada_cocina_at);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 flex-wrap bg-amber-50 border border-amber-100 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-semibold text-sm text-indigo-600">
                        #{String(p.id).padStart(3, "0")}
                      </span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-slate-700 font-medium text-sm truncate">
                        {capitalizarNombre(p.nombre_cliente)}
                      </span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-amber-700 text-xs font-medium">
                        Entregado {hora12(p.hora_local)}
                      </span>
                      {etiquetaDia && (
                        <span className="inline-flex items-center text-[10px] rounded-full font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5">
                          {etiquetaDia}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setEntregarId(p.id)}
                      className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors py-1.5 px-3"
                      style={{ cursor: "pointer" }}
                    >
                      Confirmar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar entregar */}
      {entregarId && (
        <div

          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        >
          <div

            className="bg-white rounded-2xl w-full max-w-md shadow-2xl text-center p-8"
          >
            <div

              className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 m-auto m-auto"
            >
              <CircleCheckBig size={32} className="text-emerald-500" />
            </div>
            <p

              className="font-bold text-xl text-slate-800 mb-3"
            >
              ¿Marcar como entregada?
            </p>
            <p

              className="text-sm text-slate-500 leading-relaxed mb-8"
            >
              La venta{" "}
              <span className="font-semibold text-indigo-600">
                #{String(entregarId).padStart(3, "0")}
              </span>{" "}
              pasará a estado <strong>Entregada</strong>. ¿Confirmas?
            </p>
            <br />
            <span className="text-xs text-amber-600">
              Se descontarán los productos del inventario.
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setEntregarId(null)}
                disabled={entregando}

                className="flex-1 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all pt-3 pb-3"
              >
                Cancelar
              </button>
              <button
                onClick={() => entregarVenta(entregarId)}
                disabled={entregando}

                className="flex-1 border-none rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md disabled:opacity-70 pt-3 pb-3"
              >
                {entregando ? "Guardando..." : "Sí, entregar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DETALLE VENTA ═══ */}
      {detalleVenta && (
        <div

          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-1"
        >
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">
            {/* header */}
            <div

              className="flex items-center justify-between border-b border-slate-100 py-1.5 px-2"
            >
              <div>
                <p className="font-bold text-xl text-slate-800">
                  Detalle de Venta{" "}
                  <span className="text-indigo-600">
                    #{String(detalleVenta.id).padStart(3, "0")}
                  </span>
                </p>
                <p

                  className="text-sm text-slate-500 mt-1"
                >
                  Cliente:{" "}
                  <strong className="text-slate-700">
                    {detalleVenta.nombre_cliente}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setDetalleVenta(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div

              className="flex flex-col gap-8 max-h-[70vh] overflow-y-auto p-2.5"
            >
              {/* info general */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  {
                    label: "Total",
                    value: detalleVenta.total,
                    bg: "#eef2ff",
                    color: "#4f46e5",
                  },
                  {
                    label: "Total abonado",
                    value: detalleVenta.total_abonado,
                    bg: "#f0fdf4",
                    color: "#15803d",
                  },
                  {
                    label: "Saldo pendiente",
                    value: detalleVenta.saldo_pendiente,
                    bg:
                      detalleVenta.saldo_pendiente > 0 ? "#fef9e7" : "#f0fdf4",
                    color:
                      detalleVenta.saldo_pendiente > 0 ? "#b45309" : "#15803d",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl text-center border border-slate-100 p-1.5"
                    style={{ background: item.bg }}
                  >
                    <p
                      className="text-x font-semibold text-slate-500 uppercase tracking-wider mb-0.5"

                    >
                      {item.label}
                    </p>
                    <p
                      className="text-2xl font-bold m-0"
                      style={{ color: item.color }}
                    >
                      ${item.value?.toLocaleString("es-CO") ?? "0"}
                    </p>
                  </div>
                ))}
              </div>

              {/* productos */}
              <div>
                <p

                  className="text-base font-semibold text-slate-700 flex items-center gap-3 mb-4"
                >
                  <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
                  Productos
                </p>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          "Producto",
                          "Cantidad",
                          "Precio unit.",
                          "Subtotal",
                        ].map((h) => (
                          <th
                            key={h}

                            className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-1 px-1.5"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalleVenta.detalle?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}

                            className="text-center text-slate-400 text-sm py-0 px-3"
                          >
                            Sin productos registrados
                          </td>
                        </tr>
                      ) : (
                        detalleVenta.detalle?.map((d, i) => (
                          <tr
                            key={i}
                            className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors"
                          >
                            <td

                              className="text-sm text-slate-700 font-medium py-1 px-1.5"
                            >
                              {d.nombre_producto}
                            </td>
                            <td

                              className="text-sm text-slate-500 py-1 px-1.5"
                            >
                              {d.cantidad}
                            </td>
                            <td

                              className="text-sm text-slate-500 py-1 px-1.5"
                            >
                              ${d.precio_unitario?.toLocaleString("es-CO")}
                            </td>
                            <td

                              className="text-sm font-semibold text-slate-700 py-1 px-1.5"
                            >
                              ${d.subtotal?.toLocaleString("es-CO")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* abonos */}
              <div>
                <p

                  className="text-base font-semibold text-slate-700 flex items-center gap-3 mb-4"
                >
                  <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
                  Historial de abonos
                </p>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Fecha", "Monto", "Medio de pago", "Observación"].map(
                          (h) => (
                            <th
                              key={h}

                              className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-1 px-1.5"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {detalleVenta.abonos?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-12 text-slate-400 text-sm"
                          >
                            Sin abonos registrados
                          </td>
                        </tr>
                      ) : (
                        detalleVenta.abonos?.map((a) => (
                          <tr
                            key={a.id}
                            className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors"
                          >
                            <td

                              className="text-sm text-slate-500 py-1 px-2"
                            >
                              {a.fecha}
                            </td>
                            <td

                              className="text-sm font-semibold text-green-600 py-1 px-1.5"
                            >
                              ${a.monto?.toLocaleString("es-CO")}
                            </td>
                            <td className="py-1 px-1.5">
                              <span
                                className="text-x rounded-full font-medium py-0.5 px-1.5"
                                style={{
                                  background:
                                    a.medio_pago === "efectivo"
                                      ? "#f0fdf4"
                                      : "#eff6ff",
                                  color:
                                    a.medio_pago === "efectivo"
                                      ? "#15803d"
                                      : "#1d4ed8"
                                }}
                              >
                                {a.medio_pago}
                              </span>
                            </td>
                            <td

                              className="text-sm text-slate-400 py-1 px-1.5"
                            >
                              {a.observacion ?? "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* footer */}
            <div

              className="border-t border-slate-100 bg-slate-50/50 flex justify-between items-center py-1 px-2"
            >
              <div className="flex items-center gap-4">
                <span
                  className="inline-flex items-center gap-2 text-xs rounded-full font-medium border py-1 px-1.5"
                  style={{
                    background: ESTADOS_CONFIG[detalleVenta.estado]?.bg,
                    color: ESTADOS_CONFIG[detalleVenta.estado]?.color,
                    borderColor: ESTADOS_CONFIG[detalleVenta.estado]?.border
                  }}
                >
                  {ESTADOS_CONFIG[detalleVenta.estado]?.icon}
                  {ESTADOS_CONFIG[detalleVenta.estado]?.label}
                </span>
                <span className="text-sm text-slate-400">
                  Entrega: {formatearFechaColombia(detalleVenta.fecha_entrega)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => verComprobante(detalleVenta.id)}
                  disabled={cargandoComprobante}
                  className="border border-indigo-200 rounded-xl text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 transition-all flex items-center gap-2 py-1.5 px-3"
                  style={{ cursor: "pointer" }}
                >
                  {cargandoComprobante ? (
                    <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Receipt size={14} />
                  )}
                  {cargandoComprobante ? "Cargando..." : "Ver comprobante"}
                </button>
                <button
                  onClick={() => setDetalleVenta(null)}
                  className="border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all py-1.5 px-3"
                  style={{ cursor: "pointer" }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal comprobante */}
      {mostrarComprobante && comprobante && (
        <div

          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 no-print p-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden print-container">
            {/* Header del comprobante */}
            <div

              className="flex items-center justify-between border-b border-slate-200 bg-indigo-50 no-print py-4 px-6"
            >
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Comprobante {comprobante.numero}
                </h3>
                <p className="text-sm text-slate-500">
                  Fecha de emisión: {formatearFechaColombia(comprobante.fecha_emision)}
                </p>
              </div>
              <div className="flex gap-2 no-print">
                <button
                  onClick={() => imprimirComprobante(comprobante)}
                  className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors py-2 px-4"

                >
                  <Printer size={16} />
                  Imprimir
                </button>
                <button
                  onClick={() => setMostrarComprobante(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X size={18} color="#64748b" />
                </button>
              </div>
            </div>

            {/* Contenido imprimible */}
            <div

              className="max-h-[70vh] overflow-y-auto print-content p-6"
            >
              {/* Datos del cliente y venta */}
              <div

                className="grid grid-cols-2 gap-4 mb-6"
              >
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Cliente
                  </p>
                  <p className="font-medium text-slate-800">
                    {comprobante.nombre_cliente}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    N° Venta
                  </p>
                  <p className="font-medium text-slate-800">
                    #{String(comprobante.venta_id).padStart(3, "0")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Fecha de venta
                  </p>
                  <p className="font-medium text-slate-800">
                    {formatearFechaColombia(comprobante.fecha_venta)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Fecha de entrega
                  </p>
                  <p className="font-medium text-slate-800">
                    {formatearFechaColombia(comprobante.fecha_entrega)}
                  </p>
                </div>
              </div>

              {/* Detalle de productos */}
              <table

                className="w-full border-collapse mb-6"
              >
                <thead>
                  <tr className="bg-slate-100">
                    <th

                      className="text-left text-xs font-semibold text-slate-500 uppercase py-2 px-4"
                    >
                      Producto
                    </th>
                    <th

                      className="text-left text-xs font-semibold text-slate-500 uppercase py-2 px-4"
                    >
                      Cantidad
                    </th>
                    <th

                      className="text-left text-xs font-semibold text-slate-500 uppercase py-2 px-4"
                    >
                      Precio unit.
                    </th>
                    <th

                      className="text-left text-xs font-semibold text-slate-500 uppercase py-2 px-4"
                    >
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comprobante.detalle?.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td

                        className="text-sm text-slate-700 py-2 px-4"
                      >
                        {item.nombre_producto}
                      </td>
                      <td

                        className="text-sm text-slate-600 py-2 px-4"
                      >
                        {item.cantidad}
                      </td>
                      <td

                        className="text-sm text-slate-600 py-2 px-4"
                      >
                        ${item.precio_unitario?.toLocaleString("es-CO")}
                      </td>
                      <td

                        className="text-sm text-slate-700 font-medium py-2 px-4"
                      >
                        ${item.subtotal?.toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div

                    className="flex justify-between border-b border-slate-200 pt-2 pb-2"
                  >
                    <span className="text-sm text-slate-500">Subtotal</span>
                    <span className="text-sm text-slate-800">
                      ${comprobante.total?.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div

                    className="flex justify-between border-b border-slate-200 pt-2 pb-2"
                  >
                    <span className="text-sm text-slate-500">Descuento</span>
                    <span className="text-sm text-slate-800">$0</span>
                  </div>
                  <div

                    className="flex justify-between pt-2 pb-2"
                  >
                    <span className="font-semibold text-slate-800">Total</span>
                    <span className="font-bold text-indigo-600">
                      ${comprobante.total?.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Abonos si existen */}
              {comprobante.abonos?.length > 0 && (
                <div className="mt-6">
                  <h4

                    className="text-sm font-semibold text-slate-700 mb-2"
                  >
                    Abonos registrados
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th

                            className="text-xs text-slate-500 py-2 px-4"
                          >
                            Fecha
                          </th>
                          <th

                            className="text-xs text-slate-500 py-2 px-4"
                          >
                            Monto
                          </th>
                          <th

                            className="text-xs text-slate-500 py-2 px-4"
                          >
                            Medio
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {comprobante.abonos.map((abono, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td

                              className="text-sm py-2 px-4"
                            >
                              {abono.fecha}
                            </td>
                            <td

                              className="text-sm text-green-600 py-2 px-4"
                            >
                              ${abono.monto?.toLocaleString("es-CO")}
                            </td>
                            <td

                              className="text-sm py-2 px-4"
                            >
                              {abono.medio_pago}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <NuevaVentaModal
        open={modalNuevaVenta}
        onClose={() => setModalNuevaVenta(false)}
        onVentaCreada={() => {
          fetchVentas(1, 20, balance?.corte_id);
          setModalNuevaVenta(false);
        }}
      />
      <EditarVentaModal
        open={editarModalOpen}
        onClose={() => setEditarModalOpen(false)}
        onVentaEditada={() => {
          fetchVentas(1, 20, balance?.corte_id);
          setEditarModalOpen(false);
        }}
      />
    </div>
  );
}
