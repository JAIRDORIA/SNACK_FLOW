import { create } from "zustand";
import { getVentas } from "@/api/ventas_api";

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

    setFiltros: (filtros) => set({ filtros }),

    // Reinicia ambos grupos de filtros; el componente decide cuándo recargar.
    resetFiltros: () => set({ filtros: { ...FILTROS_VACIOS } }),

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