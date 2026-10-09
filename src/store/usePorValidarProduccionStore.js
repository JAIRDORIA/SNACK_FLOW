import { create } from 'zustand';
import {
  getProduccionesPendientes,
  aceptarProduccion,
  rechazarProduccion,
} from '../api/produccionadminapi';

// Aviso (solo admin) de las producciones que los empleados registraron y que
// todavía NO entraron al inventario. Es un fetch independiente del inventario:
// esta lista vive fuera de cualquier paginación o filtro.
//
// Se mantiene un contador incremental de petición para descartar respuestas
// viejas: si el polling y una recarga manual se cruzan, solo la última
// respuesta emitida puede escribir en el store.

export const usePorValidarProduccionStore = create((set, get) => ({
  producciones: [],
  total: 0,
  cargando: false,
  error: null,
  // id de la última petición emitida; sirve para ignorar respuestas obsoletas.
  _ultimaPeticion: 0,

  /**
   * Lista de pendientes.
   * - silent: true en el polling -> no muestra spinner ni pisa la lista si falla.
   * - force/refresh: recarga aunque ya haya datos (al abrir el modal).
   */
  fetchProducciones: async ({ silent = false } = {}) => {
    const peticion = get()._ultimaPeticion + 1;
    set({ _ultimaPeticion: peticion });
    if (!silent) set({ cargando: true, error: null });

    try {
      const res = await getProduccionesPendientes();
      // Respuesta obsoleta: ya se emitió otra petición más nueva.
      if (get()._ultimaPeticion !== peticion) return;

      // Defensivo: si `items` falta o no es array, se asume lista vacía.
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      set({
        producciones: items,
        total: typeof res.data?.total === 'number' ? res.data.total : items.length,
        error: silent ? get().error : null,
      });
    } catch (err) {
      if (get()._ultimaPeticion !== peticion) return;
      if (silent) {
        // Fallo silencioso a propósito en el polling: 403, cold start de Render,
        // red caída, etc. No se pisa la lista ni se muestran alertas.
        return;
      }
      set({
        error: err.response?.data?.mensaje || 'No se pudieron cargar las producciones pendientes',
      });
    } finally {
      if (!silent && get()._ultimaPeticion === peticion) set({ cargando: false });
    }
  },

  /**
   * Acepta una producción (suma al inventario).
   * `body` null => se envía el PUT sin body (entra lo registrado tal cual).
   * Devuelve { ok, datos? , mensaje?, conflicto? } para que la fila decida.
   */
  aceptar: async (id, body) => {
    try {
      const res = await aceptarProduccion(id, body);
      get()._quitarDeLista(id);
      return { ok: true, datos: res.data };
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        // Otro admin ya lo revisó: la fila ya no existe como pendiente.
        get()._quitarDeLista(id);
        return {
          ok: false,
          conflicto: true,
          mensaje: 'Este registro ya fue revisado por otro administrador',
        };
      }
      return {
        ok: false,
        mensaje: err.response?.data?.mensaje || 'No se pudo aceptar la producción',
      };
    }
  },

  /** Rechaza una producción. No toca inventario. */
  rechazar: async (id, motivo) => {
    try {
      const res = await rechazarProduccion(id, motivo);
      get()._quitarDeLista(id);
      return { ok: true, datos: res.data };
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        get()._quitarDeLista(id);
        return {
          ok: false,
          conflicto: true,
          mensaje: 'Este registro ya fue revisado por otro administrador',
        };
      }
      return {
        ok: false,
        mensaje: err.response?.data?.mensaje || 'No se pudo rechazar la producción',
      };
    }
  },

  // Quita una fila de la lista y ajusta el conteo, sin volver a pedir la lista.
  _quitarDeLista: (id) =>
    set((state) => {
      const producciones = state.producciones.filter((p) => p.id !== id);
      return {
        producciones,
        total: Math.max(0, producciones.length),
      };
    }),

  // Limpia el estado al cerrar sesión / desmontar (opcional, no usado por el
  // aviso, pero evita arrastrar datos entre usuarios).
  reset: () => set({ producciones: [], total: 0, cargando: false, error: null }),
}));

export default usePorValidarProduccionStore;
