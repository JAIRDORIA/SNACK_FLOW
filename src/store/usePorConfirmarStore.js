import { create } from 'zustand';
import { getPedidosPorConfirmar } from '../api/pedidoscocinaapi';

// Aviso (solo admin) de las ventas que cocina ya entregó y el admin no confirma.
// Es un fetch independiente de la lista `ventas`: esta última está paginada a 20
// y filtrada por corte, así que pedidos de días anteriores no estarían cargados.
export const usePorConfirmarStore = create((set) => ({
  pedidos: [],
  cargando: false,

  // silent = true en el polling: no muestra spinner ni altera la lista si falla.
  fetchPorConfirmar: async ({ silent = false } = {}) => {
    if (!silent) set({ cargando: true });
    try {
      const res = await getPedidosPorConfirmar();
      // Defensivo: el endpoint devuelve un array, pero nunca asumimos el shape.
      const pedidos = Array.isArray(res.data) ? res.data : res.data?.pedidos ?? [];
      set({ pedidos });
    } catch {
      // Fallo silencioso a propósito: 403 (el rol cajero puede no tener permiso),
      // cold start de Render, red caída, etc. No se muestran alertas ni errores.
      // El 403 lo maneja el interceptor de axios sin cerrar sesión.
      set({ pedidos: [] });
    } finally {
      if (!silent) set({ cargando: false });
    }
  },
}));

export default usePorConfirmarStore;
