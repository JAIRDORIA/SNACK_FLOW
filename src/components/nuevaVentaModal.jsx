import { useEffect, useRef, useState, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import useNuevaVentaStore from "@/store/useNuevaVentaStore";
import useBalanceStore from "@/store/useBalanceStore";
import { formatearFechaColombia } from "@/utils/formatearFecha";
import { getClientes } from "@/api/clientes_api";
import CrearClienteModal from "@/components/CrearClienteModal";

const MEDIOS_PAGO = ["efectivo", "transferencia", "otro"];

export default function NuevaVentaModal({ open, onClose, onVentaCreada }) {
  const {
    clientes,
    cortes,
    productos,
    clienteId,
    corteId,
    fechaEntrega,
    horaEntrega,
    observacion,
    setObservacion,
    detalle,
    enviando,
    exito,
    errorMsg,
    cargandoDatos,
    errorDatos,
    cargarDatos,
    setClienteId,
    setCorteId,
    setFechaEntrega,
    setHoraEntrega,
    agregarProducto,
    eliminarProducto,
    pagarTotal,
    resetFormulario,
    registrarVenta,
    totalVenta,
    caso,
    saldoPendiente,
    cargarCombos,
    combos,
    agregarItem,
    abonosIniciales,
    agregarAbonoInicial,
    eliminarAbonoInicial,
    modificarAbonoInicial,
    totalAbonado,
    pagarCompleto,
    direccionEntrega,
    direccionClienteRegistrada,
    setDireccionEntrega,
    setDireccionCliente
  } = useNuevaVentaStore();
  const { balance, fetchBalance } = useBalanceStore();
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteIdentificacion, setClienteIdentificacion] = useState('')
  const [editandoDireccion, setEditandoDireccion] = useState(false)

  const selectProductoRef = useRef(null);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [cantidadItem, setCantidadItem] = useState(1)
  const [cantidadItemInput, setCantidadItemInput] = useState("1");
  const [textoBusquedaCliente, setTextoBusquedaCliente] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(false);
  const [crearClienteOpen, setCrearClienteOpen] = useState(false);
  const [mostrarInfoCombo, setMostrarInfoCombo] = useState(false);
  const [montosLocales, setMontosLocales] = useState([]);
  const [productosEditados, setProductosEditados] = useState([]);
  const [precioEditado, setPrecioEditado] = useState(0);
  useEffect(() => {
    setMontosLocales(abonosIniciales.map((a) => a.monto?.toString() || ""));
  }, [abonosIniciales]);

  const todosLosItems = useMemo(() => {
    const prods = productos.map((p) => ({
      ...p,
      tipo: "producto",
      precio_detal: p.precio_detal,
      precio_almayor: p.precio_mayor,
    }));


    const combs = combos.map((c) => ({
      ...c,
      tipo: "combo",
      precio_frito: c.precio_frito,
      precio_congelado: c.precio_congelado,
    })); // el backend usa 'precio' en GET /combos
    return [...prods, ...combs];
  }, [productos, combos]);
  // Cargar datos al abrir
  useEffect(() => {
    if (open) {
      resetFormulario();
      cargarDatos();
      cargarCombos();
      fetchBalance();
      setCrearClienteOpen(false);
      setEditandoDireccion(false);
    }
  }, [open]);
  useEffect(() => {
    setCantidadItemInput(cantidadItem.toString());
  }, [cantidadItem]);

  useEffect(() => {
    const productosFiltrados = productos
      .filter((p) =>
        p.nombre?.toLowerCase().includes(textoBusqueda.toLowerCase()),
      )
      .map((p) => ({ ...p, tipo: "producto" }));

    const combosFiltrados = combos
      .filter((c) =>
        c.nombre?.toLowerCase().includes(textoBusqueda.toLowerCase()),
      )
      .map((c) => ({ ...c, tipo: "combo" }));

    setItemsFiltrados([...productosFiltrados, ...combosFiltrados]);
  }, [textoBusqueda, productos, combos]);


  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setItemsFiltrados([]);
      return;
    }
    const q = textoBusqueda.toLowerCase();
    const filtrados = todosLosItems.filter(
      (item) =>
        item.nombre?.toLowerCase().includes(q) ||
        item.Cli_identificacion?.includes(q),
    );
    setItemsFiltrados(filtrados);
  }, [textoBusqueda, todosLosItems]);

  const handleAgregarProducto = () => {
    const select = selectProductoRef.current;
    if (!select || !select.value) return;

    const prodId = Number(select.value);
    const prod = productos.find((p) => p.id === prodId);
    if (!prod) {
      console.error("Producto no encontrado con id:", prodId);
      return;
    }

    const cantidad =
      Number(document.getElementById("cantidad-producto").value) || 1;

    // Convertir precio_venta de string a número
    const precioUnitario = parseFloat(prod.precio_venta);

    agregarProducto(prod.id, prod.nombre, cantidad, precioUnitario);

    // Limpiar selección
    select.value = "";
    document.getElementById("cantidad-producto").value = "1";
  };

  const handleRegistrar = async () => {
    const ok = await registrarVenta();
    if (ok) {
      onVentaCreada?.();
      setTimeout(() => {
        resetFormulario();
        onClose();
      }, 1000);
    }
  };

  useEffect(() => {
    if (!textoBusquedaCliente.trim() || seleccionado) {
      setClientesFiltrados([]);
      return;
    }
    getClientes(1, 25, textoBusquedaCliente)
      .then(res => {
        setClientesFiltrados(res.data.items || res.data.datos || [])
      })
      .catch(() => setClientesFiltrados([]))
  }, [textoBusquedaCliente, seleccionado]);

  // Cliente recién creado desde el botón "+": se selecciona automáticamente
  // para que el usuario siga armando la venta sin salir del modal.
  const handleClienteCreado = async (clienteCreado) => {
    setCrearClienteOpen(false);

    const identificacion = clienteCreado?.Cli_identificacion || "";
    try {
      // Se re-consulta para obtener el ID_Cliente real (no se asume el shape
      // de la respuesta del POST).
      const res = await getClientes(1, 25, clienteCreado?.Cli_Nombre || "");
      const lista = res.data.items || res.data.datos || [];
      const encontrado =
        lista.find((c) => c.Cli_identificacion === identificacion) || lista[0];

      if (encontrado) {
        setClienteId(encontrado.ID_Cliente);
        setClienteNombre(encontrado.Cli_Nombre);
        setClienteIdentificacion(encontrado.Cli_identificacion || "S/N");
        setDireccionCliente(encontrado.Cli_Direccion || "");
        setEditandoDireccion(false);
        setTextoBusquedaCliente(
          `${encontrado.Cli_Nombre} - ${encontrado.Cli_identificacion || "S/N"}`,
        );
      } else {
        // Sin coincidencia en la búsqueda, se conserva lo capturado del form.
        setClienteNombre(clienteCreado?.Cli_Nombre || "");
        setClienteIdentificacion(identificacion || "S/N");
        setDireccionCliente(clienteCreado?.Cli_Direccion || "");
        setEditandoDireccion(false);
        setTextoBusquedaCliente(
          `${clienteCreado?.Cli_Nombre || ""} - ${identificacion || "S/N"}`,
        );
      }
      setSeleccionado(true);
      setClientesFiltrados([]);
    } catch {
      setClienteNombre(clienteCreado?.Cli_Nombre || "");
      setClienteIdentificacion(identificacion || "S/N");
      setDireccionCliente(clienteCreado?.Cli_Direccion || "");
      setEditandoDireccion(false);
      setTextoBusquedaCliente(
        `${clienteCreado?.Cli_Nombre || ""} - ${identificacion || "S/N"}`,
      );
      setSeleccionado(true);
      setClientesFiltrados([]);
    }
  };



  const fechaMinimaEntrega = balance?.fecha_inicio
    ? formatearFechaColombia(balance.fecha_inicio, false)
      .split("/")
      .reverse()
      .join("-")
    : "";

  if (!open) return null;
  return (
    <>
    <div

      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div

          className="flex items-center justify-between border-b border-slate-100 bg-indigo-50 py-4 px-9"
        >
          <h2 className="text-lg font-bold text-slate-800">Nueva Venta</h2>
          <button
            onClick={() => {
              resetFormulario();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div

          className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto p-6"
        >
          {/* Error de carga */}
          {errorDatos && (
            <div

              className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3"
            >
              <AlertCircle size={16} /> {errorDatos}
            </div>
          )}

          {/* Sección 1: Datos generales */}
          <div>
            <h3

              className="text-sm font-semibold text-slate-600 mb-3"
            >
              Datos generales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-500">
                    Cliente *
                  </label>

                  {/* Botón para registrar un cliente sin salir de la venta */}
                  <button
                    type="button"
                    onClick={() => setCrearClienteOpen(true)}
                    disabled={cargandoDatos}
                    title="Registrar nuevo cliente"
                    aria-label="Registrar nuevo cliente"
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={textoBusquedaCliente}
                    onChange={(e) => {
                      const valor = e.target.value
                        .replace(/[0-9]/g, "") // Elimina números
                        .slice(0, 30); // Máximo 30 caracteres
                      setTextoBusquedaCliente(valor);
                      setSeleccionado(false);
                      if (clienteId) {
                        setClienteId("");
                        // Al deseleccionar el cliente no debe quedar la
                        // dirección del pedido del cliente anterior.
                        setDireccionCliente("");
                        setEditandoDireccion(false);
                      }
                    }}

                    className="w-full border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                    disabled={cargandoDatos}
                  />

                  {/* Resultados de búsqueda - solo uno a la vez */}
                  {textoBusquedaCliente && !seleccionado && (
                    <>
                      {clientesFiltrados.length > 0 ? (
                        <ul

                          className="absolute z-20 bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto w-full shadow-lg mt-1"
                        >
                          {clientesFiltrados.map((c) => (
                            <li
                              key={c.ID_Cliente}
                              onClick={() => {
                                setClienteId(c.ID_Cliente);
                                setClienteNombre(c.Cli_Nombre)                         // ← nuevo
                                setClienteIdentificacion(c.Cli_identificacion || 'S/N') // ← nuevo
                                // Dirección registrada del cliente: con ella se
                                // precarga el campo y se compara antes de enviar.
                                setDireccionCliente(c.Cli_Direccion || '')
                                setEditandoDireccion(false)
                                setTextoBusquedaCliente(
                                  `${c.Cli_Nombre} - ${c.Cli_identificacion || "S/N"}`,
                                );
                                setSeleccionado(true);
                                setClientesFiltrados([]);
                              }}

                              className="hover:bg-indigo-50 cursor-pointer text-sm py-2 px-3"
                            >
                              <span>{c.Cli_Nombre} - </span>
                              <span className="text-xs text-slate-400 ml-2">
                                {c.Cli_identificacion || "S/N"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div

                          className="absolute z-20 bg-white border border-slate-200 rounded-lg text-sm text-slate-400 w-full shadow-lg py-2 px-3 mt-1"
                        >
                          No se encontraron clientes
                        </div>
                      )}
                    </>
                  )}
                </div>

                {clienteId && (
                  <div className="mt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-indigo-600">
                        Cliente seleccionado: {clienteNombre} ({clienteIdentificacion})
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (editandoDireccion) {
                            setEditandoDireccion(false);
                            return;
                          }
                          // Al abrir, se precarga la dirección registrada del
                          // cliente (o la que el admin ya haya escrito).
                          if (!direccionEntrega) {
                            setDireccionEntrega(direccionClienteRegistrada || "");
                          }
                          setEditandoDireccion(true);
                        }}
                        className="text-xs text-indigo-600 hover:underline bg-transparent border-none p-0"
                        style={{ cursor: "pointer" }}
                      >
                        {direccionClienteRegistrada ? "Cambiar dirección" : "Agregar dirección"}
                      </button>
                    </div>

                    {editandoDireccion && (
                      <div className="mt-2 border border-slate-300 rounded-lg p-3">
                        <label className="block text-xs text-slate-500 mb-1">
                          Dirección de este pedido
                        </label>
                        <input
                          type="text"
                          maxLength={255}
                          value={direccionEntrega}
                          onChange={(e) => setDireccionEntrega(e.target.value)}
                          placeholder="Calle 123 #45-67"
                          className="w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Solo aplica a este pedido. No cambia la dirección registrada del cliente.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDireccionEntrega("");
                            setEditandoDireccion(false);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 hover:underline mt-1 bg-transparent border-none p-0"
                          style={{ cursor: "pointer" }}
                        >
                          Restablecer
                        </button>
                      </div>
                    )}

                    {!editandoDireccion &&
                      direccionEntrega.trim() &&
                      direccionEntrega.trim().toLowerCase() !==
                        (direccionClienteRegistrada || "").trim().toLowerCase() && (
                        <span className="inline-block text-xs rounded-lg font-medium bg-amber-50 text-amber-700 border border-amber-200 mt-1 py-1 px-2.5">
                          Dirección del pedido: {direccionEntrega}
                        </span>
                      )}
                  </div>
                )}
              </div>
              <div>
                <label

                  className="block text-xs text-slate-500 mb-1"
                >
                  Corte *
                </label>
                <select
                  value={corteId}
                  onChange={(e) => setCorteId(e.target.value)}

                  className="w-full border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                  disabled={cargandoDatos}
                >
                  <option value="">Seleccionar corte...</option>
                  {cortes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero} - {c.estado}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label

                  className="block text-xs text-slate-500 mb-1"
                >
                  Fecha de entrega *
                </label>
                <input
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  min={fechaMinimaEntrega}
                  className="w-full border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"

                />
              </div>
              <div>
                <label

                  className="block text-xs text-slate-500 mb-1"
                >
                  Hora de entrega
                </label>
                <input
                  type="time"
                  value={horaEntrega}
                  onChange={(e) => setHoraEntrega(e.target.value)}

                  className="w-full border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                />
              </div>
              <div className="md:col-span-2">
                <label

                  className="block text-xs text-slate-500 mb-1"
                >
                  Observación (opcional)
                </label>
                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej: sin sal en las empanadas, salsa aparte..."
                  rows={2}

                  className="w-full border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Productos */}
          <div>
            <h3

              className="text-sm font-semibold text-slate-600 mb-0"
            >
              Productos
            </h3>
            <div

              className="flex flex-wrap items-end gap-2 mb-3"
            >
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Buscar producto o combo..."
                  value={textoBusqueda}
                  onChange={(e) => setTextoBusqueda(e.target.value)}

                  className="w-full border border-slate-200 rounded-lg text-sm p-2"
                />
                {itemSeleccionado && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 flex-1">
                        {itemSeleccionado.nombre} ({itemSeleccionado.tipo})
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={cantidadItemInput}
                        onChange={(e) => setCantidadItemInput(e.target.value)}
                        onBlur={() => {
                          const val = parseInt(cantidadItemInput, 10);
                          if (isNaN(val) || val < 1) {
                            setCantidadItemInput("1");
                            setCantidadItem(1);
                          } else {
                            setCantidadItem(val);
                          }
                        }}

                        className="w-20 border border-slate-200 rounded-lg text-sm p-1"
                      />
                      {itemSeleccionado.tipo === "producto" ? (
                        <>
                          <button
                            onClick={() => {
                              const precio = parseFloat(
                                itemSeleccionado.precio_detal,
                              );
                              const cantidadFinal = parseInt(cantidadItemInput, 10) || 1
                              agregarItem({
                                tipo: itemSeleccionado.tipo,
                                producto_id: itemSeleccionado.id,
                                combo_id: null,
                                nombre_producto: itemSeleccionado.nombre,
                                cantidad: cantidadFinal,
                                precio_unitario: precio,
                              });
                              setTextoBusqueda("");
                              setItemSeleccionado(null);
                              setCantidadItem(1);
                            }}

                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium py-2 px-3"
                          >
                            Al detal ($
                            {parseFloat(
                              itemSeleccionado.precio_detal,
                            ).toLocaleString("es-CO")}
                            )
                          </button>
                          <button
                            onClick={() => {
                              const precio = parseFloat(
                                itemSeleccionado.precio_mayor,
                              );
                              agregarItem({
                                tipo: itemSeleccionado.tipo,
                                producto_id: itemSeleccionado.id,
                                combo_id: null,
                                nombre_producto: itemSeleccionado.nombre,
                                cantidad: cantidadItem,
                                precio_unitario: precio,
                              });
                              setTextoBusqueda("");
                              setItemSeleccionado(null);
                              setCantidadItem(1);
                            }}

                            className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium py-2 px-3"
                          >
                            Al mayor ($
                            {parseFloat(
                              itemSeleccionado.precio_mayor,
                            ).toLocaleString("es-CO")}
                            )
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              const precio = parseFloat(
                                itemSeleccionado.precio_frito,
                              );
                              agregarItem({
                                tipo: itemSeleccionado.tipo,
                                producto_id: null,
                                combo_id: itemSeleccionado.id,
                                nombre_producto: itemSeleccionado.nombre,
                                cantidad: cantidadItem,
                                precio_unitario: precio,
                              });
                              setTextoBusqueda("");
                              setItemSeleccionado(null);
                              setCantidadItem(1);
                            }}

                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium py-2 px-3"
                          >
                            Frito ($
                            {parseFloat(
                              itemSeleccionado.precio_frito,
                            ).toLocaleString("es-CO")}
                            )
                          </button>
                          <button
                            onClick={() => {
                              const precio = parseFloat(
                                itemSeleccionado.precio_congelado,
                              );
                              agregarItem({
                                tipo: itemSeleccionado.tipo,
                                producto_id: null,
                                combo_id: itemSeleccionado.id,
                                nombre_producto: itemSeleccionado.nombre,
                                cantidad: cantidadItem,
                                precio_unitario: precio,
                              });
                              setTextoBusqueda("");
                              setItemSeleccionado(null);
                              setCantidadItem(1);
                            }}

                            className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium py-2 px-3"
                          >
                            Congelado ($
                            {parseFloat(
                              itemSeleccionado.precio_congelado,
                            ).toLocaleString("es-CO")}
                            )
                          </button>
                        </>
                      )}
                    </div>

                    {/* Información adicional según el tipo */}
                    <div className="text-sm mt-2">
                      {itemSeleccionado.tipo === "producto" ? (
                        <p className="text-slate-600">
                          📦 Unidades por bandeja:{" "}
                          <strong>
                            {itemSeleccionado.unidades_por_bandeja ?? "N/D"}
                          </strong>
                        </p>
                      ) : (
                        <button
                          onClick={() => {
                            setProductosEditados(
                              itemSeleccionado.productos.map((p) => ({ ...p })),
                            );
                            setPrecioEditado(
                              parseFloat(
                                itemSeleccionado.precio_venta ||
                                itemSeleccionado.precio,
                              ),
                            );
                            setMostrarInfoCombo(true);
                          }}
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Info size={14} />
                          editar productos del combo
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {textoBusqueda && itemsFiltrados.length > 0 && (
                  <ul

                    className="absolute z-20 bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto w-full shadow-lg mt-1"
                  >
                    {itemsFiltrados.map((item) => (
                      <li
                        key={`${item.tipo}-${item.id}`}
                        onClick={() => {
                          // Al hacer clic, rellenamos el input y guardamos el item seleccionado
                          setTextoBusqueda(`${item.nombre} (${item.tipo})`);
                          setItemSeleccionado(item);
                          setItemsFiltrados([]); // ocultar lista
                        }}

                        className="hover:bg-indigo-50 cursor-pointer text-sm flex justify-between items-center py-2 px-3"
                      >
                        <span>{item.nombre}</span>
                        <span

                          className="text-xs text-slate-400 bg-slate-100 rounded py-0.5 px-2"
                        >
                          {item.tipo === "combo" ? "Combo" : "Producto"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.tipo === "producto" && (
                            <>
                              <span className="text-green-600">
                                $
                                {parseFloat(item.precio_detal).toLocaleString(
                                  "es-CO",
                                )}
                              </span>
                              <span className="mx-1 text-slate-300">|</span>
                              <span className="text-orange-600">
                                $
                                {parseFloat(item.precio_mayor).toLocaleString(
                                  "es-CO",
                                )}
                              </span>
                            </>
                          )}
                          {item.tipo === "combo" && (
                            <>
                              <span className="text-blue-600">
                                $
                                {parseFloat(item.precio_frito).toLocaleString(
                                  "es-CO",
                                )}
                              </span>
                              <span

                                className="text-slate-300 ml-1 mr-1"
                              >
                                |
                              </span>
                              <span className="text-cyan-600">
                                $
                                {parseFloat(
                                  item.precio_congelado,
                                ).toLocaleString("es-CO")}
                              </span>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {detalle.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th

                        className="text-left text-slate-500 py-2 px-3"
                      >
                        Producto
                      </th>
                      <th

                        className="text-center text-slate-500 py-2 px-3"
                      >
                        Cant
                      </th>
                      <th

                        className="text-right text-slate-500 py-2 px-3"
                      >
                        Precio
                      </th>
                      <th

                        className="text-right text-slate-500 py-2 px-3"
                      >
                        Subtotal
                      </th>
                      <th

                        className="py-2 px-3"
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((item, i) => (
                      <tr
                        key={i}
                        className="border-t border-slate-100 hover:bg-indigo-50/30"
                      >
                        <td

                          className="text-slate-700 py-2 px-3"
                        >
                          {item.nombre_producto}
                        </td>
                        <td

                          className="text-center text-slate-600 py-2 px-3"
                        >
                          {item.cantidad}
                        </td>
                        <td

                          className="text-right text-slate-600 py-2 px-3"
                        >
                          ${item.precio_unitario.toLocaleString("es-CO")}
                        </td>
                        <td

                          className="text-right text-slate-700 font-medium py-2 px-3"
                        >
                          $
                          {(
                            item.cantidad * item.precio_unitario
                          ).toLocaleString("es-CO")}
                        </td>
                        <td

                          className="text-center py-2 px-3"
                        >
                          <button
                            
                            onClick={() => eliminarProducto(i)}
                            className="text-rose-500 hover:bg-rose-100 p-1 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p

                className="text-xs text-slate-400 mt-2"
              >
                No hay productos agregados.
              </p>
            )}
          </div>

          {/* Sección 3: Abono inicial */}
          {/* Sección 3: Abonos iniciales */}
          <div>
            <div

              className="flex items-center gap-3 mb-3"
            >
              <h3 className="text-sm font-semibold text-slate-600">
                Abonos iniciales
              </h3>
              <button
                onClick={agregarAbonoInicial}

                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus size={14} />
                Agregar abono
              </button>
              <button
                onClick={pagarCompleto}

                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors py-1.5 px-3"
              >
                <CheckCircle2 size={14} />
                Pagar completo
              </button>
              {abonosIniciales.length === 0 && (
                <span className="text-xs text-slate-500">
                  Sin abonos iniciales
                </span>
              )}
              {abonosIniciales.length > 0 && (
                <span className="text-xs text-slate-500">
                  {caso() === "sin_abono" && "Sin abono"}
                  {caso() === "abono_parcial" && "Abono parcial"}
                  {caso() === "pago_completo" && "Pago completo"}
                </span>
              )}
            </div>

            {abonosIniciales.map((abono, index) => (
              <div
                key={index}

                className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 rounded-xl border border-slate-200 mb-2 p-3"
              >
                <div>
                  <label

                    className="block text-xs text-slate-500 mb-1"
                  >
                    Monto
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalVenta()}
                    value={montosLocales[index] ?? ""}
                    onChange={(e) => {
                      const nuevos = [...montosLocales];
                      nuevos[index] = e.target.value;
                      setMontosLocales(nuevos);
                    }}
                    onBlur={() => {
                      const val = parseFloat(montosLocales[index]) || 0;
                      const clamped = Math.min(Math.max(val, 0), totalVenta());
                      modificarAbonoInicial(index, "monto", clamped);
                    }}

                    className="w-full border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                  />
                </div>
                <div>
                  <label

                    className="block text-xs text-slate-500 mb-1"
                  >
                    Medio de pago
                  </label>
                  <select
                    value={abono.medio_pago}
                    onChange={(e) =>
                      modificarAbonoInicial(index, "medio_pago", e.target.value)
                    }

                    className="w-full border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                  >
                    {MEDIOS_PAGO.map((medio) => (
                      <option key={medio} value={medio}>
                        {medio.charAt(0).toUpperCase() + medio.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label

                      className="block text-xs text-slate-500 mb-1"
                    >
                      Observación
                    </label>
                    <input
                      type="text"
                      value={abono.observacion}
                      onChange={(e) =>
                        modificarAbonoInicial(
                          index,
                          "observacion",
                          e.target.value,
                        )
                      }
                      placeholder="Opcional"

                      className="w-full border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 p-2"
                    />
                  </div>
                  <button
                    onClick={() => eliminarAbonoInicial(index)}

                    className="text-rose-500 hover:bg-rose-100 rounded-lg p-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div

            className="bg-indigo-50 rounded-xl p-4"
          >
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total venta</span>
              <span className="font-bold text-slate-800">
                ${totalVenta().toLocaleString("es-CO")}
              </span>
              <span className="font-medium text-emerald-600">
                ${(totalAbonado() || 0).toLocaleString("es-CO")}
              </span>
            </div>
            {abonosIniciales.length > 0 && (
              <div

                className="flex justify-between text-sm mt-1"
              >
                <span className="text-slate-600">Total abonado</span>
                <span className="font-medium text-emerald-600">
                  ${(totalAbonado() || 0).toLocaleString("es-CO")}
                </span>
              </div>
            )}
            {saldoPendiente() > 0 && (
              <div

                className="flex justify-between text-sm mt-1"
              >
                <span className="text-slate-600">Saldo pendiente</span>
                <span className="font-medium text-amber-600">
                  ${saldoPendiente().toLocaleString("es-CO")}
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {errorMsg && (
            <div

              className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3"
            >
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div

              className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3"
            >
              <CheckCircle2 size={16} /> Venta registrada correctamente
            </div>
          )}
        </div>

        {/* Footer */}
        <div

          className="border-t border-slate-100 bg-slate-50/50 flex justify-between items-center py-4 px-6"
        >
          <span className="text-sm text-slate-500">
            {detalle.length > 0
              ? `${detalle.length} producto(s)`
              : "Sin productos"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetFormulario();
                onClose();
              }}
              disabled={enviando}

              className="border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors py-1.5 px-5"
            >
              Cancelar
            </button>
            <button
              onClick={handleRegistrar}
              disabled={enviando || totalVenta() <= 0 || exito}

              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all py-1.5 px-6"
            >
              {enviando && <Loader2 size={16} className="animate-spin" />}
              {exito
                ? "Registrada"
                : enviando
                  ? "Registrando..."
                  : "Registrar Venta"}
            </button>
          </div>
        </div>
      </div>
      {/* Modal info combo */}
      {mostrarInfoCombo && itemSeleccionado && (
        <div

          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div

            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6"
          >
            <div

              className="flex items-center justify-between mb-4"
            >
              <h3 className="text-lg font-bold text-slate-800">
                Editar {itemSeleccionado.nombre}
              </h3>
              <button
                onClick={() => setMostrarInfoCombo(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={18} color="#64748b" />
              </button>
            </div>
            <button
              onClick={() => {
                setProductosEditados([
                  ...productosEditados,
                  { producto_id: "", nombre: "", cantidad_unidades: 1 },
                ]);
              }}

              className="text-indigo-600 text-sm hover:underline mt-2"
            >
              + Agregar producto
            </button>

            {itemSeleccionado.productos &&
              itemSeleccionado.productos.length > 0 ? (
              <>
                <table

                  className="w-full text-sm border-collapse mb-4"
                >
                  <thead>
                    <tr className="bg-slate-50">
                      <th

                        className="text-left text-xs text-slate-500 uppercase py-2 px-3"
                      >
                        Producto
                      </th>
                      <th

                        className="text-center text-xs text-slate-500 uppercase w-24 py-2 px-3"
                      >
                        Cantidad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosEditados.map((prod, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-1 px-3">
                          <select
                            value={prod.producto_id || ""}
                            onChange={(e) => {
                              const nuevos = [...productosEditados];
                              const productoSeleccionado = productos.find(
                                (p) => p.id === Number(e.target.value),
                              );
                              nuevos[i] = {
                                ...nuevos[i],
                                producto_id: Number(e.target.value),
                                nombre: productoSeleccionado?.nombre || "",
                                // Opcional: actualizar el precio unitario según el producto seleccionado
                                // precio_unitario: productoSeleccionado?.precio_detal || 0,
                              };
                              setProductosEditados(nuevos);
                            }}

                            className="w-full border border-slate-200 rounded text-sm p-1.5"
                          >
                            <option value="">Seleccionar producto...</option>
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 px-3">
                          <input
                            type="number"
                            min="1"
                            value={prod.cantidad_unidades}
                            onChange={(e) => {
                              const nuevos = [...productosEditados];
                              nuevos[i] = {
                                ...nuevos[i],
                                cantidad_unidades: Number(e.target.value),
                              };
                              setProductosEditados(nuevos);
                            }}

                            className="w-20 text-center border border-slate-200 rounded text-sm p-1.5"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mb-4">
                  <label

                    className="block text-xs font-semibold text-slate-500 uppercase mb-1"
                  >
                    Precio del combo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioEditado}
                    onChange={(e) => setPrecioEditado(Number(e.target.value))}

                    className="w-full border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 p-2"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                No hay productos detallados.
              </p>
            )}

            <div

              className="flex gap-2 justify-end mt-4"
            >
              <button
                onClick={() => setMostrarInfoCombo(false)}

                className="border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 py-2 px-4"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Validar que haya al menos un producto seleccionado
                  if (
                    productosEditados.length === 0 ||
                    !productosEditados.some((p) => p.producto_id)
                  ) {
                    alert(
                      "Debe seleccionar al menos un producto para el combo",
                    );
                    return;
                  }

                  // Enviar UN SOLO item de tipo combo con la lista de productos personalizados
                  agregarItem({
                    tipo: "combo",
                    combo_id: null, // No usa el combo original
                    producto_id: null, // No es un producto simple
                    nombre_producto: itemSeleccionado.nombre, // Mantiene el nombre del combo
                    cantidad: cantidadItem, // Cuántos combos se venden
                    precio_unitario: precioEditado, // Precio total del combo (frito o congelado)
                    productos: productosEditados
                      .filter((p) => p.producto_id) // Solo los que tengan producto real seleccionado
                      .map((p) => ({
                        producto_id: p.producto_id,
                        cantidad_unidades: p.cantidad_unidades, // Las unidades que lleva este producto en el combo
                      })),
                  });

                  // Limpiar estados
                  setMostrarInfoCombo(false);
                  setItemSeleccionado(null);
                  setTextoBusqueda("");
                  setCantidadItem(1);
                }}

                className="bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 py-2 px-4"
              >
                Confirmar y Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Modal para registrar cliente sin salir de la venta */}
    <CrearClienteModal
      open={crearClienteOpen}
      onClose={() => setCrearClienteOpen(false)}
      onCreated={handleClienteCreado}
    />
    </>
  );
}
