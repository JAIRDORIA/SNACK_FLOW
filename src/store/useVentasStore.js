import { create } from "zustand";
import { getVentas } from "@/api/ventas_api";
import { getIngresosVentasCorte } from "@/api/cortes_api";

const FILTROS_VACIOS = { estados: [], tipos_pago: [] };

const useVentasStore = create((set, get) => ({
    ventas: [],
    total: 0,
    pagina: 1,
    limite: 20,
    total_paginas: 0,
    cargando: false,
    error: null,
    // Filtros aplicados del menú "Filtros". Grupo vacío = sin filtro en ese grupo.
    filtros: { ...FILTROS_VACIOS },

    // ── KPI "Ingresos totales" ──
    // Valor independiente del listado: lo entrega /cortes/ingresos-ventas
    // (abonos cobrados en el corte abierto). `null` = aún sin dato.
    ingresosCorte: null,
    cargandoIngresos: false,
    // Contador para descartar respuestas viejas si llegan fuera de orden.
    _ultimaPeticionIngresos: 0,

    setFiltros: (filtros) => set({ filtros }),

    // Reinicia ambos grupos de filtros; el componente decide cuándo recargar.
    resetFiltros: () => set({ filtros: { ...FILTROS_VACIOS } }),

    // Trae el KPI de ingresos del corte abierto. Es independiente del listado
    // (la paginación y los filtros no lo afectan). Silencioso: nunca muestra
    // error ni cierra sesión; si falla conserva el último valor (o null para
    // mostrar "—"), y el 401 lo maneja el interceptor de axios.
    cargarIngresosCorte: async () => {
        const peticion = get()._ultimaPeticionIngresos + 1;
        set({ _ultimaPeticionIngresos: peticion });
        // Solo se muestra el skeleton si aún no hay ningún valor; en recargas se
        // conserva la cifra anterior para no parpadear.
        if (get().ingresosCorte === null) set({ cargandoIngresos: true });

        try {
            const res = await getIngresosVentasCorte();
            // Respuesta obsoleta: ya se emitió otra petición más nueva.
            if (get()._ultimaPeticionIngresos !== peticion) return;

            const valor = res.data?.ingresos_ventas_corte;
            // El contrato garantiza un número; ante cualquier otra forma se
            // conserva el valor actual en lugar de inventar un $0.
            if (typeof valor === "number" && Number.isFinite(valor)) {
                set({ ingresosCorte: valor });
            }
        } catch {
            // Silencioso a propósito (403, cold start del backend, red, etc.).
            // No se muestran alertas ni se altera la sesión.
        } finally {
            if (get()._ultimaPeticionIngresos === peticion) set({ cargandoIngresos: false });
        }
    },

     fetchVentas: async (pagina = 1, limite = 20, corte_id = null, q = '',options = {}) => {
    const { silent = false } = options
    // Los filtros viven en el store: así se conservan en paginación,
    // búsqueda, refrescos silenciosos y tras entregar/anular.
    const { estados, tipos_pago } = get().filtros
    if (!silent) set({ cargando: true, error: null })
    try {
        const res = await getVentas(pagina, limite, corte_id, q, {
            estados: estados.join(','),
            tipos_pago: tipos_pago.join(','),
        })
        set({
            ventas        : res.data.datos,
            total         : res.data.total,
            pagina        : res.data.pagina,
            limite        : res.data.limite,
            total_paginas : res.data.total_paginas,
            cargando      : false
        })
    } catch (err) {
        set({ error: err.response?.data?.mensaje || "Error al cargar ventas", cargando: false })
    }
}
}))

export default useVentasStore