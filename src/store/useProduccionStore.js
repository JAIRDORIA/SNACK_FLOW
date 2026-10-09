import { create } from 'zustand';
import {
  getEmpleadosActivos,
  getProductosProduccion,
  postProduccionEmpleado,
  getRegistros,
} from '../api/produccionapi';

const mensajeError = (e, porDefecto) =>
  e?.response?.data?.mensaje || e?.response?.data?.error || porDefecto;

// El backend puede devolver un array directo o envuelto en { datos } / { data }.
const listaDe = (data) => {
  if (Array.isArray(data)) return data;
  return data?.datos || data?.data || [];
};

// Los registros vienen en `items`; si falta, se trata como lista vacía.
const listaRegistros = (data) => (Array.isArray(data?.items) ? data.items : []);

// Secuencias para descartar respuestas viejas (polling o recargas rápidas).
let seqEmpleados = 0;
let seqProductos = 0;
let seqRegistros = 0;

export const useProduccionStore = create((set, get) => ({
  empleados: [],
  productos: [],
  cargando: false,
  error: null,
  guardando: false,
  errorModal: null,

  // Registros recientes (últimos 5 por empleado activo).
  registros: [],
  cargandoRegistros: false,
  errorRegistros: null,
  ultimaCargaRegistros: null,

  // Carga inicial (empleados + productos). silencioso = true en el polling.
  cargar: async ({ silencioso = false } = {}) => {
    if (!silencioso) set({ cargando: true });
    const miSeqEmp = ++seqEmpleados;
    const miSeqProd = ++seqProductos;
    try {
      const [resEmp, resProd] = await Promise.all([
        getEmpleadosActivos(),
        getProductosProduccion(),
      ]);
      const parche = {};
      if (miSeqEmp === seqEmpleados) parche.empleados = listaDe(resEmp.data);
      if (miSeqProd === seqProductos) parche.productos = listaDe(resProd.data);
      set({ ...parche, error: null });
    } catch (e) {
      set({ error: mensajeError(e, 'No se pudo cargar la información de producción') });
    } finally {
      if (!silencioso) set({ cargando: false });
    }
  },

  // Refresco silencioso de empleados (cada 5 min). Un fallo puntual no
  // debe tapar la lista ya cargada.
  refrescarEmpleados: async () => {
    const miSeq = ++seqEmpleados;
    try {
      const res = await getEmpleadosActivos();
      if (miSeq !== seqEmpleados) return;
      set({ empleados: listaDe(res.data) });
    } catch {
      /* silencioso */
    }
  },

  // Carga los registros recientes. silencioso = true en el polling y tras guardar:
  // no muestra el esqueleto ni pisa los datos con un error puntual.
  cargarRegistros: async ({ silencioso = false } = {}) => {
    const miSeq = ++seqRegistros;
    if (!silencioso) set({ cargandoRegistros: true, errorRegistros: null });
    try {
      const res = await getRegistros();
      if (miSeq !== seqRegistros) return;
      set({
        registros: listaRegistros(res.data),
        ultimaCargaRegistros: Date.now(),
        errorRegistros: null,
      });
    } catch (e) {
      if (miSeq !== seqRegistros) return;
      if (!silencioso) set({ errorRegistros: mensajeError(e, 'No se pudieron cargar los registros') });
    } finally {
      if (!silencioso) set({ cargandoRegistros: false });
    }
  },

  // Devuelve el registro creado o null si falló (deja el mensaje en errorModal).
  guardar: async ({ empleado_id, producto_id, bandejas, unidades_sueltas }) => {
    if (get().guardando) return null;
    set({ guardando: true, errorModal: null });
    try {
      const res = await postProduccionEmpleado({ empleado_id, producto_id, bandejas, unidades_sueltas });
      // El registro nuevo debe aparecer al abrir la pestaña Registros.
      get().cargarRegistros({ silencioso: true });
      return res.data;
    } catch (e) {
      set({ errorModal: mensajeError(e, 'No se pudo guardar la producción') });
      return null;
    } finally {
      set({ guardando: false });
    }
  },

  limpiarError: () => set({ error: null }),
  limpiarErrorModal: () => set({ errorModal: null }),
}));
