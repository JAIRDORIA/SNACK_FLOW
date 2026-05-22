import { create } from "zustand";
import { getInventario, getProductosBajoStock } from "@/api/inventario_api";

const useInventarioStore = create((set) => ({
    inventario: [],
    total: 0,
    pagina: 1,
    limite: 20,
    total_paginas: 0,
    bajoStock: [],
    cargando: false,
    error: null,

    fetchInventario: async (pagina = 1, limite = 20) => {
        set({ cargando: true, error: null });
        try {
            const res = await getInventario(pagina, limite);
            set({
                inventario   : res.data.datos,
                total        : res.data.total,
                pagina       : res.data.pagina,
                limite       : res.data.limite,
                total_paginas: res.data.total_paginas,
                cargando     : false
            });
        } catch (err) {
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
    }
}));

export default useInventarioStore;
