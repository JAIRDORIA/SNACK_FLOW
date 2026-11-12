import { create } from "zustand";
import { getInventario, getProductosBajoStock, getValorInventario } from "@/api/inventario_api";

// Ignora respuestas viejas al cambiar de término o de página.
let fetchSeq = 0;

const useInventarioStore = create((set, get) => ({
    inventario: [],
    total: 0,
    pagina: 1,
    limite: 20,
    total_paginas: 0,
    busqueda: '',
    bajoStock: [],
    cargando: false,
    error: null,
    // Valor total del inventario (global). `cargandoValor`/`errorValor` son
    // flags propios: no deben activar el spinner de página ni la pantalla de
    // error del listado.
    valor_detal: null,
    valor_mayor: null,
    cargandoValor: false,
    errorValor: null,

    // Igual que fetchInventario pero SIN tocar `cargando`. Necesario para
    // refrescos en segundo plano: `Inventario.jsx` hace `if (cargando) return
    // <spinner/>`, así que activar el flag desmontaría la página entera (y con
    // ella cualquier modal abierto encima, como el de validar producción).
    // Conserva la búsqueda activa del store.
    refrescarInventarioSilencioso: async (pagina = get().pagina, limite = get().limite) => {
        try {
            const res = await getInventario(pagina, limite, get().busqueda);
            set({
                inventario   : res.data.datos,
                total        : res.data.total,
                pagina       : res.data.pagina,
                limite       : res.data.limite,
                total_paginas: res.data.total_paginas,
            });
        } catch {
            // Silencioso a propósito: es un refresco de fondo, no una carga que
            // el usuario haya pedido. Si falla, se conserva lo que ya había.
        }
    },

    fetchInventario: async (pagina = 1, limite = get().limite, q = get().busqueda) => {
        const seq = ++fetchSeq;
        set({ cargando: true, error: null, busqueda: q });
        try {
            const res = await getInventario(pagina, limite, q);
            if (seq !== fetchSeq) return;
            set({
                inventario   : res.data.datos,
                total        : res.data.total,
                pagina       : res.data.pagina,
                limite       : res.data.limite,
                total_paginas: res.data.total_paginas,
                cargando     : false
            });
        } catch (err) {
            if (seq !== fetchSeq) return;
            set({ error: err.response?.data?.mensaje || "Error al cargar inventario", cargando: false });
        }
    },

    fetchBajoStock: async () => {
        try {
            const res = await getProductosBajoStock();
            set({ bajoStock: res.data });
        } catch {
            set({ bajoStock: [] });
        }
    },

    // Total global del inventario: no depende de la página ni de la búsqueda.
    // Si falla, se conserva el último valor conocido (o null -> "—") y no se
    // muestra ninguna alerta ni se cierra la sesión.
    fetchValorInventario: async () => {
        set({ cargandoValor: true, errorValor: null });
        try {
            const res = await getValorInventario();
            set({
                valor_detal: res.data?.valor_detal ?? null,
                valor_mayor: res.data?.valor_mayor ?? null,
                cargandoValor: false,
            });
        } catch (err) {
            set({
                cargandoValor: false,
                errorValor: err.response?.data?.mensaje || "Error al cargar el valor del inventario",
            });
        }
    }
}));

export default useInventarioStore;
