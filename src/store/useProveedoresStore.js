import { create } from "zustand";
import { getProveedores, postProveedor, putProveedor, deleteProveedor } from "@/api/proveedores_api";

const useProveedoresStore = create((set, get) => ({
    proveedores: [],
    cargando: false,
    error: null,

fetchProveedores: async () => {
    set({ cargando: true, error: null });
    try {
        const res = await getProveedores();
        set({ proveedores: res.data.proveedores ?? [], cargando: false });
    } catch (err) {
        set({ error: err.response?.data?.mensaje || "Error al cargar proveedores", cargando: false });
    }
},

    crearProveedor: async (data) => {
        const res = await postProveedor(data);
        await get().fetchProveedores();
        return res.data;
    },

    editarProveedor: async (id, data) => {
        const res = await putProveedor(id, data);
        await get().fetchProveedores();
        return res.data;
    },

    eliminarProveedor: async (id) => {
        await deleteProveedor(id);
        await get().fetchProveedores();
    },
}));

export default useProveedoresStore;