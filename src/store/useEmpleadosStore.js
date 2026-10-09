import { create } from 'zustand';
import { getEmpleados, postEmpleado, putEmpleado } from '@/api/empleadosapi';

// Empleados de la sala de producción (solo admin).
//
// El filtro por estado se resuelve en el SERVIDOR (`?activo=`), así que forma
// parte del store: sobrevive a la recarga y se reutiliza tras cada mutación.
// El buscador por nombre es del cliente y vive en la página.
//
// Se lleva un contador de petición para descartar respuestas viejas: si el
// usuario cambia de filtro rápido, solo la última respuesta puede escribir en
// el store.
//
// Las respuestas de POST y PUT no se interpretan (su forma no está
// documentada): tras cualquier 2xx se vuelve a pedir la lista con el filtro
// actual. Eso también garantiza que un empleado desactivado salga de la lista
// cuando el filtro es "Activos".

export const useEmpleadosStore = create((set, get) => ({
  empleados: [],
  total: 0,
  // '' = todos, 1 = activos, 0 = inactivos. Por defecto, activos.
  filtroActivo: 1,
  cargando: false,
  error: null,
  _ultimaPeticion: 0,

  fetchEmpleados: async ({ silent = false } = {}) => {
    const peticion = get()._ultimaPeticion + 1;
    set({ _ultimaPeticion: peticion });
    if (!silent) set({ cargando: true, error: null });

    try {
      const filtro = get().filtroActivo;
      const res = await getEmpleados(filtro === '' ? undefined : filtro);
      // Respuesta obsoleta: ya se emitió otra petición más nueva.
      if (get()._ultimaPeticion !== peticion) return;

      // Defensivo: si `datos` falta o no es array, se asume lista vacía.
      const lista = Array.isArray(res.data?.datos) ? res.data.datos : [];
      set({
        empleados: lista,
        total: typeof res.data?.total === 'number' ? res.data.total : lista.length,
        error: null,
      });
    } catch (err) {
      if (get()._ultimaPeticion !== peticion) return;
      set({
        error:
          err.response?.data?.mensaje ||
          err.response?.data?.error ||
          'Error al cargar los empleados',
      });
    } finally {
      if (!silent && get()._ultimaPeticion === peticion) set({ cargando: false });
    }
  },

  /** Cambia el filtro de estado y recarga desde el servidor. */
  setFiltroActivo: (filtroActivo) => {
    set({ filtroActivo });
    get().fetchEmpleados();
  },

  /**
   * Crea un empleado. Devuelve { ok } o { ok:false, mensaje } para que el modal
   * muestre el error del backend sin cerrarse.
   */
  crearEmpleado: async (nombre) => {
    try {
      await postEmpleado({ nombre });
      await get().fetchEmpleados({ silent: true });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        mensaje: err.response?.data?.mensaje || 'No se pudo crear el empleado',
      };
    }
  },

  /** Renombra un empleado. */
  renombrarEmpleado: async (id, nombre) => {
    try {
      await putEmpleado(id, { nombre });
      await get().fetchEmpleados({ silent: true });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        mensaje: err.response?.data?.mensaje || 'No se pudo actualizar el empleado',
      };
    }
  },

  /** Activa o desactiva un empleado (nunca se borra). */
  cambiarEstadoEmpleado: async (id, activo) => {
    try {
      await putEmpleado(id, { activo: activo ? 1 : 0 });
      await get().fetchEmpleados({ silent: true });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        mensaje: err.response?.data?.mensaje || 'No se pudo cambiar el estado del empleado',
      };
    }
  },
}));

export default useEmpleadosStore;
