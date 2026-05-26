import { create } from "zustand";
import { getCompras, postCompra, putCompra, deleteCompra } from "@/api/compras_api";
import { getCortes } from "@/api/cortes_api";

const useComprasStore = create((set, get) => ({
    compras: [],
    total: 0,
    pagina: 1,
    limite: 20,
    total_paginas: 0,
    cargando: false,
    error: null,
    corteIdFiltro: null,
    cortes: [],

    fetchCompras: async (pagina = 1, limite = 20, corteId = null) => {
        set({ cargando: true, error: null, corteIdFiltro: corteId });
        try {
            const res = await getCompras(pagina, limite, corteId);
            set({
                compras      : res.data.compras ?? [],
                total        : res.data.total ?? 0,
                pagina       : res.data.pagina ?? 1,
                limite       : res.data.limite ?? 20,
                total_paginas: res.data.total_paginas ?? 1,
                cargando     : false,
            });
        } catch (err) {
            set({ error: err.response?.data?.mensaje || "Error al cargar compras", cargando: false });
        }
    },

    fetchCortes: async () => {
        try {
            const res = await getCortes(1, 100);
            set({ cortes: res.data.datos });
        } catch (err) {
            console.error("Error al cargar cortes", err);
        }
    },

    crearCompra: async (data) => {
        const res = await postCompra(data);
        await get().fetchCompras(1, 20, get().corteIdFiltro);
        return res.data;
    },

    editarCompra: async (id, data) => {
        const res = await putCompra(id, data);
        await get().fetchCompras(1, 20, get().corteIdFiltro);
        return res.data;
    },

    eliminarCompra: async (id) => {
        await deleteCompra(id);
        await get().fetchCompras(1, 20, get().corteIdFiltro);
    },
}));

export default useComprasStore;