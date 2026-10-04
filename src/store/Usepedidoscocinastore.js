import { create } from 'zustand';
import { getPedidosCocina, entregarPedidoCocina } from '../api/pedidoscocinaapi';

const mensajeError = (e, porDefecto) =>
  e?.response?.data?.error || e?.response?.data?.mensaje || porDefecto;

export const usePedidosCocinaStore = create((set, get) => ({
  fecha: null, // null = hoy (lo resuelve el backend en hora Colombia)
  data: { fecha: null, pedidos: [], total_pendientes: 0, total_entregados: 0 },
  cargando: false,
  error: null,
  entregando: {}, // { [id]: true } mientras se marca cada pedido

  // silencioso = true en el polling: no muestra el spinner ni borra el error de una acción
  cargar: async ({ silencioso = false } = {}) => {
    if (!silencioso) set({ cargando: true });
    try {
      const res = await getPedidosCocina(get().fecha);
      set({ data: res.data, error: null });
    } catch (e) {
      // En el polling un fallo puntual (ej. cold start de Render) no debe tapar los datos ya cargados
      set({ error: mensajeError(e, 'No se pudo actualizar los pedidos') });
    } finally {
      if (!silencioso) set({ cargando: false });
    }
  },

  setFecha: (fecha) => {
    set({ fecha: fecha || null });
    return get().cargar();
  },

  entregar: async (id) => {
    if (get().entregando[id]) return false;
    set((s) => ({ entregando: { ...s.entregando, [id]: true } }));
    try {
      await entregarPedidoCocina(id);
      return true;
    } catch (e) {
      // Si otra tablet ya lo marcó, el refresco de abajo lo saca de la lista
      set({ error: mensajeError(e, 'No se pudo marcar el pedido como entregado') });
      return false;
    } finally {
      set((s) => {
        const { [id]: _omitido, ...resto } = s.entregando;
        return { entregando: resto };
      });
      await get().cargar({ silencioso: true });
    }
  },

  limpiarError: () => set({ error: null }),
}));