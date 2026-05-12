import { create } from "zustand";
import { getBalance } from "@/api/cortes_api";
import { getClientesTop } from "@/api/clientes_api";
import { getProductosMasVendidos } from "@/api/productos_api";

const useDashboardStore = create((set) => ({
    balance: null,
    clientesTop: [],
    productosTop: [],
    cargando: false,
    error: null,

    fetchDashboard: async () => {
        set({ cargando: true, error: null });
        try {
            const [balanceRes, clientesRes, productosRes] = await Promise.all([
                getBalance(),
                getClientesTop(5),
                getProductosMasVendidos(5),
            ]);
            set({
                balance     : balanceRes.data,
                clientesTop : clientesRes.data,
                productosTop: productosRes.data,
                cargando    : false
            });
        } catch (err) {
            set({ error: "Error al cargar el dashboard", cargando: false });
        }
    }
}));

export default useDashboardStore;