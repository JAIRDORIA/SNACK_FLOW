// API del lado ADMIN de la producción registrada por empleados.
//
// Los empleados registran bandejas/unidades sueltas en el kiosco de sala y ese
// registro queda en estado `pendiente`: NO entra al inventario hasta que un
// admin lo valida aquí.
//
// No confundir con:
//   - produccionapi.js     (kiosco de sala, rol produccion)
//   - producciones_api.js  (historial de inventario del admin)
//
// Todos los endpoints son solo para `admin` (otros roles reciben 403 y el
// interceptor de axios no cierra sesión en ese caso).
import api from './axios';

const BASE = '/produccion-empleados';

/**
 * Producciones pendientes de validación.
 * -> { total, items: [{ id, empleado_id, empleado_nombre, producto_id,
 *      producto_nombre, unidades_por_bandeja, bandejas, unidades_sueltas,
 *      created_at }] }
 * Orden: del más antiguo al más reciente, tope 200.
 */
export const getProduccionesPendientes = () => api.get(`${BASE}/pendientes`);

/**
 * Acepta una producción: el backend suma al inventario y normaliza las sueltas
 * que completan bandeja.
 *
 * `body` es opcional. Sin body entra exactamente lo que registró el empleado.
 * Si se corrige, hay que mandar AMBOS campos juntos:
 *   { bandejas, unidades_sueltas }
 */
export const aceptarProduccion = (id, body) =>
  body ? api.put(`${BASE}/${id}/aceptar`, body) : api.put(`${BASE}/${id}/aceptar`);

/**
 * Rechaza una producción. No toca inventario.
 * `motivo` es opcional (máximo 255 caracteres; vacío = sin motivo).
 */
export const rechazarProduccion = (id, motivo) =>
  motivo
    ? api.put(`${BASE}/${id}/rechazar`, { motivo })
    : api.put(`${BASE}/${id}/rechazar`);
