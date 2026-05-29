import { useState, useRef, useEffect } from "react";
import axios from "@/api/axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
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
import { getVentaDetalle, getVentaComprobante, anularVenta } from "@/api/ventas_api";
import useAbonosStore from "@/store/useAbonoStore";
import useDashboardStore from "@/store/useDashboardStore";
import useEditarVentaStore from "@/store/useEditarVentaStore";
import EditarVentaModal from "@/components/EditarVentaModal";

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
  sin_pago: { bg: "#f3f4f6", color: "#9ca3af", label: "Sin pago" },
  error: { bg: "#fee2e2", color: "#b91c1c", label: "Error" },
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
      setEntregarId(null);
    } catch (err) {
      console.error("Error al entregar venta", err);
      alert(err.response?.data?.mensaje || "Error al marcar como entregada");
    } finally {
      setEntregando(false);
    }
  };
  const handleAnularVenta = async () => {
    if (!eliminarId) return
    setAnulando(true)
    try {
      await anularVenta(eliminarId)
      fetchVentas(1, 20, balance.corte_id)   // refrescar la lista
      setEliminarId(null)
    } catch (err) {
      console.error('Error al anular venta', err)
      alert(err.response?.data?.mensaje || 'Error al anular la venta')
    } finally {
      setAnulando(false)
    }
  };

  const lista = ventas.filter((v) => {
    const q = busqueda.toLowerCase();
    const matchQ =
      String(v.id_venta).includes(q) ||
      v.nombre_cliente?.toLowerCase().includes(q) ||
      v.fecha_entrega?.includes(q) ||
      v.estado?.toLowerCase().includes(q);
    const matchE =
      filtroEstados.length === 0 || filtroEstados.includes(v.estado);

    const medioPagoActual = getMedioPago(v.id_venta);
    const matchT =
      filtroTipos.length === 0 || filtroTipos.includes(medioPagoActual);
    return matchQ && matchE && matchT;
  });
  useEffect(() => {
    if (lista.length > 0) {
      const ids = lista.map((v) => v.id_venta);
      cargarAbonos(ids);
    }
  }, [lista]);

  const ventasActivas = ventas.filter(v => v.estado !== 'anulada')
  const ventasAnuladas = ventas.filter(v => v.estado === 'anulada')

  const totalMonto = ventasActivas.reduce((acc, v) => acc + (v.total || 0), 0)
  const pendientes = ventasActivas.filter(v => v.estado === 'pendiente').length
  const entregadas = ventasActivas.filter(v => v.estado === 'entregada').length
  const anuladas = ventasAnuladas.length
  const statCards = [
    {
      label: 'Total Ventas',
      value: ventasActivas.length,
      icon: TrendingUp,
      ring: 'ring-indigo-500/40',
      iconCol: 'text-indigo-300',
    },
    {
      label: 'Monto Total',
      value: totalMonto,
      icon: DollarSign,
      ring: 'ring-emerald-500/40',
      iconCol: 'text-emerald-300',
      isCurrency: true,
    },
    {
      label: 'Pendientes',
      value: pendientes,
      icon: Clock,
      ring: 'ring-amber-500/40',
      iconCol: 'text-amber-300',
    },
    {
      label: 'Entregadas',
      value: entregadas,
      icon: CheckCircle2,
      ring: 'ring-emerald-500/40',
      iconCol: 'text-emerald-300',
    },
    {
      label: 'Anuladas',
      value: anuladas,
      icon: XCircle,
      ring: 'ring-rose-500/40',
      iconCol: 'text-rose-300',
    },
  ]


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
    <div style={{ padding: "32px" }} className="flex-1 bg-gray-50 p-8">
      <div
        style={{ marginBottom: "32px" }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#000000",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              Gestión De Ventas
            </h1>
          </div>
        </div>
        <button
          onClick={() => setModalNuevaVenta(true)}
          style={{ padding: "8px 8px" }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white  rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="text-x">Nueva Venta</span>
        </button>
      </div>

      {/* ═══ KPI CARDS (Estilo Dashboard) ═══ */}
      <div
        style={{ marginBottom: "32px" }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
      >
        {/* Monto Total (sin anuladas) */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all"
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
            style={{ margin: "20px 0px 20px 20px" }}
            className="bg-[#13152280] ring-2 ring-orange-400/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          >
            <DollarSign size={22} color="#fb923c" />
          </div>
          <div>
            <p className="text-2xl text-white">
              ${totalMonto.toLocaleString("es-CO")}
            </p>
            <p
              style={{ marginTop: "2px" }}
              className="text-xs text-white/50 mt-0.5"
            >
              Ingresos totales
            </p>
          </div>
        </div>

        {/* Total Ventas (activas) */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all"
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
            style={{ margin: "20px 0px 20px 20px" }}
            className="bg-[#13152280] ring-2 ring-indigo-500/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          >
            <ShoppingBag className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <p className="text-3xl text-white">{ventasActivas.length}</p>
            <p
              style={{ marginTop: "2px" }}
              className="text-xs text-white/50 mt-0.5"
            >
              Total Ventas
            </p>
          </div>
        </div>

        {/* Entregadas */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all"
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
            style={{ margin: "20px 0px 20px 20px" }}
            className="bg-[#13152280] ring-2 ring-cyan-400/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          >
            <CheckCheck size={22} color="#22d3ee" />
          </div>
          <div>
            <p className="text-3xl text-white">{entregadas}</p>
            <p
              style={{ marginTop: "2px" }}
              className="text-xs text-white/50 mt-0.5"
            >
              Entregadas
            </p>
          </div>
        </div>

        {/* Pendientes */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all"
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
            style={{ margin: "20px 0px 20px 20px" }}
            className="bg-[#13152280] ring-2 ring-[#e90e0e]/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          >
            <Clock3 size={22} color="#e90e0e" />
          </div>
          <div>
            <p className="text-3xl text-white">{pendientes}</p>
            <p style={{ marginTop: "2px" }} className="text-xs text-white/50">
              por entregar
            </p>
          </div>
        </div>

        {/* Anuladas (nueva tarjeta) */}
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all"
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
            style={{ margin: "20px 0px 20px 20px" }}
            className="bg-[#13152280] ring-2 ring-rose-500/40 w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          >
            <XCircle size={22} color="#f43f5e" />
          </div>
          <div>
            <p className="text-3xl text-white">{anuladas}</p>
            <p style={{ marginTop: "2px" }} className="text-xs text-white/50">
              Anuladas
            </p>
          </div>
        </div>
      </div>
      {/* ═══ TABLA ═══ */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible">
        {/* barra busqueda + filtro */}
        <div
          className=" border-b border-slate-100 flex gap-4 items-center flex-wrap"
          style={{ padding: "12px" }}
        >
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <input
              style={{
                paddingLeft: "48px",
                paddingRight: "16px",
                paddingTop: "12px",
                paddingBottom: "12px",
              }}
              type="text"
              placeholder="Buscar por ID, cliente, fecha o estado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm outline-none text-slate-700 bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          <div ref={filtroRef} className="relative">
            <button
              onClick={() => setPanelFiltro((p) => !p)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                border:
                  nFiltros > 0 ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                background: nFiltros > 0 ? "#eef2ff" : "#fff",
                color: nFiltros > 0 ? "#4f46e5" : "#64748b",
                cursor: "pointer",
                padding: "12px 20px",
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
                style={{ marginTop: "12px", padding: "24px" }}
                className="absolute top-full mt-3 left-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 z-40 min-w-80"
              >
                <p
                  style={{ marginBottom: "16px" }}
                  className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4"
                >
                  Estado
                </p>
                <div
                  style={{ marginBottom: "24px" }}
                  className="flex flex-col gap-3 "
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
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border"
                        style={{
                          padding: "8px 12px",
                          background: cfg.bg,
                          color: cfg.color,
                          borderColor: cfg.border,
                        }}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </label>
                  ))}
                </div>

                <p
                  style={{ marginBottom: "16px" }}
                  className="text-xs font-bold text-slate-400 uppercase tracking-widest "
                >
                  Tipo de Pago
                </p>
                <div
                  style={{ marginBottom: "24px" }}
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
                        className="px-4 py-2 rounded-full text-xs font-medium border border-transparent"
                        style={{
                          padding: "8px 16px",
                          background: cfg.bg,
                          color: cfg.color,
                          padding: "8px 16px",
                        }}
                      >
                        {cfg.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div
                  style={{ paddingTop: "16px" }}
                  className="border-t border-slate-100 pt-4 flex justify-between"
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
                  "Fecha",
                  "Cliente",
                  "Total",
                  "Pagada",
                  "Estado",
                  "Acciones",
                ].map((h, i) => (
                  <th
                    key={h}
                    style={{ padding: "16px 24px" }}
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
                    style={{ paddingTop: "80px", paddingBottom: "80px" }}
                    colSpan={7}
                    className="text-center py-20 text-slate-400"
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
                        style={{ padding: "16px 24px", paddingLeft: "32px" }}
                        className="px-6 py-4 pl-8"
                      >
                        <span className="font-semibold text-sm text-indigo-600">
                          #{String(v.id_venta).padStart(3, "0")}
                        </span>
                      </td>
                      <td
                        style={{ padding: "16px 24px" }}
                        className=" text-slate-500 text-sm whitespace-nowrap"
                      >
                        {v.fecha_entrega}
                      </td>
                      <td
                        style={{ padding: "16px 24px" }}
                        className="text-slate-700 font-medium text-sm"
                      >
                        {v.nombre_cliente}
                      </td>
                      <td
                        style={{ padding: "16px 24px" }}
                        className=" text-slate-700 font-semibold text-sm"
                      >
                        ${v.total?.toLocaleString("es-CO")}
                      </td>
                      {/* Columna Pagada */}
                      <td className="px-6 py-4">
                        {v.saldo_pendiente === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-full font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle2 size={12} />
                            Pagada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-full font-medium bg-amber-50 text-amber-600 border border-amber-200">
                            <Clock size={12} />
                            Debe
                          </span>
                        )}
                      </td>
                      <td
                        style={{ padding: "16px 24px" }}
                        className="px-6 py-4"
                      >
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-medium border"
                          style={{
                            background: estadoCfg.bg,
                            color: estadoCfg.color,
                            borderColor: estadoCfg.border,
                            padding: "6px 14px ",
                          }}
                        >
                          {estadoCfg.icon}
                          {estadoCfg.label}
                        </span>
                      </td>
                      <td
                        style={{ padding: "22px 14px", paddingRight: "28px" }}
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
          style={{ padding: "20px 32px" }}
          className=" border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/30"
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
                onClick={() => fetchVentas(pagina - 1)}
                disabled={pagina === 1}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
                style={{
                  cursor: pagina === 1 ? "not-allowed" : "pointer",
                  padding: "10px 16px",
                }}
              >
                ← Anterior
              </button>
              <span
                style={{ paddingLeft: "12px", paddingRight: "12px" }}
                className="text-sm text-slate-500 px-3 font-medium"
              >
                {pagina} / {total_paginas}
              </span>
              <button
                onClick={() => fetchVentas(pagina + 1)}
                disabled={pagina === total_paginas}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:opacity-40 hover:bg-slate-50 transition-all font-medium text-slate-600"
                style={{
                  cursor: pagina === total_paginas ? "not-allowed" : "pointer",
                  padding: "10px 16px ",
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
          style={{ padding: "4px" }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 "
        >
          <div
            style={{ padding: "8px" }}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center"
          >
            <div
              style={{ marginBottom: "6px", margin: "0px auto" }}
              className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center "
            >
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <p
              style={{ marginBottom: "3px" }}
              className="font-bold text-xl text-slate-800 "
            >
              ¿Anular venta?
            </p>
            <p
              style={{ marginBottom: "8px" }}
              className="text-x text-slate-500  leading-relaxed"
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
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all"
                style={{ cursor: anulando ? 'not-allowed' : 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAnularVenta}
                disabled={anulando}
                className="flex-1 py-3 border-none rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                style={{ cursor: anulando ? 'not-allowed' : 'pointer' }}
              >
                {anulando ? 'Anulando...' : 'Sí, anular'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal confirmar entregar */}
      {entregarId && (
        <div style={{ padding: "16px" }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div style={{ padding: "32px" }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
            <div style={{ marginBottom: "24px", marginLeft: "auto", marginRight: "auto" }} className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CircleCheckBig size={32} className="text-emerald-500" />
            </div>
            <p style={{ marginBottom: "12px" }} className="font-bold text-xl text-slate-800 mb-3">¿Marcar como entregada?</p>
            <p style={{ marginBottom: "32px" }} className="text-sm text-slate-500 mb-8 leading-relaxed">
              La venta{' '}
              <span className="font-semibold text-indigo-600">
                #{String(entregarId).padStart(3, '0')}
              </span>{' '}
              pasará a estado <strong>Entregada</strong>. ¿Confirmas?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEntregarId(null)}
                disabled={entregando}
                style={{ paddingTop: "12px", paddingBottom: "12px" }}
                className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => entregarVenta(entregarId)}
                disabled={entregando}
                style={{ paddingTop: "12px", paddingBottom: "12px" }}
                className="flex-1 py-3 border-none rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md disabled:opacity-70"
              >
                {entregando ? 'Guardando...' : 'Sí, entregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DETALLE VENTA ═══ */}
      {detalleVenta && (
        <div
          style={{ padding: "4px" }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 "
        >
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">
            {/* header */}
            <div
              style={{ padding: "6px 8px" }}
              className="flex items-center justify-between  border-b border-slate-100"
            >
              <div>
                <p className="font-bold text-xl text-slate-800">
                  Detalle de Venta{" "}
                  <span className="text-indigo-600">
                    #{String(detalleVenta.id).padStart(3, "0")}
                  </span>
                </p>
                <p
                  style={{ marginTop: "4px" }}
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
              style={{ padding: "10px" }}
              className=" flex flex-col gap-8 max-h-[70vh] overflow-y-auto"
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
                    className="rounded-2xl text-center border border-slate-100"
                    style={{ background: item.bg, padding: "6px" }}
                  >
                    <p
                      className="text-x font-semibold text-slate-500  uppercase tracking-wider"
                      style={{ marginBottom: "2px" }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-2xl font-bold m-0"
                      style={{ color: item.color, margin: "0px" }}
                    >
                      ${item.value?.toLocaleString("es-CO") ?? "0"}
                    </p>
                  </div>
                ))}
              </div>

              {/* productos */}
              <div>
                <p
                  style={{ marginBottom: "16px" }}
                  className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-3"
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
                            style={{ padding: "4px 6px" }}
                            className="text-left  text-xs font-semibold text-slate-400 uppercase tracking-wider"
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
                            style={{ padding: "0px 12px" }}
                            className="text-center  text-slate-400 text-sm"
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
                              style={{ padding: "4px 6px" }}
                              className=" text-sm text-slate-700 font-medium"
                            >
                              {d.nombre_producto}
                            </td>
                            <td
                              style={{ padding: "4px 6px" }}
                              className=" text-sm text-slate-500"
                            >
                              {d.cantidad}
                            </td>
                            <td
                              style={{ padding: "4px 6px" }}
                              className=" text-sm text-slate-500"
                            >
                              ${d.precio_unitario?.toLocaleString("es-CO")}
                            </td>
                            <td
                              style={{ padding: "4px 6px" }}
                              className=" text-sm font-semibold text-slate-700"
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
                  style={{ marginBottom: "16px" }}
                  className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-3"
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
                              style={{ padding: "4px 6px" }}
                              className="text-left  text-xs font-semibold text-slate-400 uppercase tracking-wider"
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
                              style={{ padding: "4px 8px" }}
                              className="text-sm text-slate-500"
                            >
                              {a.fecha}
                            </td>
                            <td
                              style={{ padding: "4px 6px" }}
                              className=" text-sm font-semibold text-green-600"
                            >
                              ${a.monto?.toLocaleString("es-CO")}
                            </td>
                            <td style={{ padding: "4px 6px" }}>
                              <span
                                className="text-x  rounded-full font-medium"
                                style={{
                                  background:
                                    a.medio_pago === "efectivo"
                                      ? "#f0fdf4"
                                      : "#eff6ff",
                                  color:
                                    a.medio_pago === "efectivo"
                                      ? "#15803d"
                                      : "#1d4ed8",
                                  padding: "3px 6px",
                                }}
                              >
                                {a.medio_pago}
                              </span>
                            </td>
                            <td
                              style={{ padding: "4px 6px" }}
                              className=" text-sm text-slate-400"
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
              style={{ padding: "5px 8px" }}
              className="border-t border-slate-100 bg-slate-50/50 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <span
                  className="inline-flex items-center gap-2 text-xs rounded-full font-medium border"
                  style={{
                    background: ESTADOS_CONFIG[detalleVenta.estado]?.bg,
                    color: ESTADOS_CONFIG[detalleVenta.estado]?.color,
                    borderColor: ESTADOS_CONFIG[detalleVenta.estado]?.border,
                    padding: "4px 6px",
                  }}
                >
                  {ESTADOS_CONFIG[detalleVenta.estado]?.icon}
                  {ESTADOS_CONFIG[detalleVenta.estado]?.label}
                </span>
                <span className="text-sm text-slate-400">
                  Entrega: {detalleVenta.fecha_entrega}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => verComprobante(detalleVenta.id)}
                  disabled={cargandoComprobante}
                  className="border border-indigo-200 rounded-xl text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 transition-all flex items-center gap-2"
                  style={{ cursor: "pointer", padding: "6px 12px" }}
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
                  className="border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-all"
                  style={{ cursor: "pointer", padding: "6px 12px" }}
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
          style={{ padding: "16px" }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50  no-print"
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden print-container">
            {/* Header del comprobante */}
            <div
              style={{ padding: "16px 24px" }}
              className="flex items-center justify-between  border-b border-slate-200 bg-indigo-50 no-print"
            >
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Comprobante {comprobante.numero}
                </h3>
                <p className="text-sm text-slate-500">
                  Fecha de emisión: {comprobante.fecha_emision}
                </p>
              </div>
              <div className="flex gap-2 no-print">
                <button
                  onClick={() => imprimirComprobante(comprobante)}
                  className="flex items-center gap-2 bg-indigo-600 text-white  rounded-xl text-sm hover:bg-indigo-700 transition-colors"
                  style={{ padding: "8px 16px" }}
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
              style={{ padding: "24px" }}
              className="p-6 max-h-[70vh] overflow-y-auto print-content"
            >
              {/* Datos del cliente y venta */}
              <div
                style={{ marginBottom: "24px" }}
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
                    {comprobante.fecha_venta}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Fecha de entrega
                  </p>
                  <p className="font-medium text-slate-800">
                    {comprobante.fecha_entrega}
                  </p>
                </div>
              </div>

              {/* Detalle de productos */}
              <table
                style={{ marginBottom: "24px" }}
                className="w-full border-collapse mb-6"
              >
                <thead>
                  <tr className="bg-slate-100">
                    <th
                      style={{ padding: "8px 16px" }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase"
                    >
                      Producto
                    </th>
                    <th
                      style={{ padding: "8px 16px" }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase"
                    >
                      Cantidad
                    </th>
                    <th
                      style={{ padding: "8px 16px" }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase"
                    >
                      Precio unit.
                    </th>
                    <th
                      style={{ padding: "8px 16px" }}
                      className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase"
                    >
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comprobante.detalle?.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td
                        style={{ padding: "8px 16px" }}
                        className="px-4 py-2 text-sm text-slate-700"
                      >
                        {item.nombre_producto}
                      </td>
                      <td
                        style={{ padding: "8px 16px" }}
                        className="px-4 py-2 text-sm text-slate-600"
                      >
                        {item.cantidad}
                      </td>
                      <td
                        style={{ padding: "8px 16px" }}
                        className="px-4 py-2 text-sm text-slate-600"
                      >
                        ${item.precio_unitario?.toLocaleString("es-CO")}
                      </td>
                      <td
                        style={{ padding: "8px 16px" }}
                        className="px-4 py-2 text-sm text-slate-700 font-medium"
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
                    style={{ paddingTop: "8px ", paddingBottom: "8px" }}
                    className="flex justify-between border-b border-slate-200 "
                  >
                    <span className="text-sm text-slate-500">Subtotal</span>
                    <span className="text-sm text-slate-800">
                      ${comprobante.total?.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div
                    style={{ paddingTop: "8px ", paddingBottom: "8px" }}
                    className="flex justify-between border-b border-slate-200 "
                  >
                    <span className="text-sm text-slate-500">Descuento</span>
                    <span className="text-sm text-slate-800">$0</span>
                  </div>
                  <div
                    style={{ paddingTop: "8px ", paddingBottom: "8px" }}
                    className="flex justify-between py-2"
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
                <div style={{ marginTop: "24px" }} className="mt-6">
                  <h4
                    style={{ marginBottom: "8px" }}
                    className="text-sm font-semibold text-slate-700 "
                  >
                    Abonos registrados
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th
                            style={{ padding: "8px 16px" }}
                            className="px-4 py-2 text-xs text-slate-500"
                          >
                            Fecha
                          </th>
                          <th
                            style={{ padding: "8px 16px" }}
                            className="px-4 py-2 text-xs text-slate-500"
                          >
                            Monto
                          </th>
                          <th
                            style={{ padding: "8px 16px" }}
                            className="px-4 py-2 text-xs text-slate-500"
                          >
                            Medio
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {comprobante.abonos.map((abono, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td
                              style={{ padding: "8px 16px" }}
                              className="px-4 py-2 text-sm"
                            >
                              {abono.fecha}
                            </td>
                            <td
                              style={{ padding: "8px 16px" }}
                              className="px-4 py-2 text-sm text-green-600"
                            >
                              ${abono.monto?.toLocaleString("es-CO")}
                            </td>
                            <td
                              style={{ padding: "8px 16px" }}
                              className="px-4 py-2 text-sm"
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
