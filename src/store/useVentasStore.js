import { create } from "zustand";
import { getVentas } from "@/api/ventas_api";

const useVentasStore = create((set) => ({
    ventas: [],
    total: 0,
    pagina: 1,
    limite: 20,
    total_paginas: 0,
    cargando: false,
    error: null,

     fetchVentas: async (pagina = 1, limite = 20, corte_id = null, q = '',options = {}) => {
    const { silent = false } = options
    if (!silent) set({ cargando: true, error: null })
    try {
        const res = await getVentas(pagina, limite, corte_id, q)
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