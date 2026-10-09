// API de gestión de empleados (solo admin).
//
// Los empleados son las personas de la sala de producción: NO tienen usuario ni
// contraseña, eligen su nombre en la pantalla de producción para registrar lo
// que producen. Por eso solo se administran (listar, crear, renombrar, activar
// o desactivar); nunca se borran.
//
// No confundir con `/empleados/activos` (produccionapi.js), que es el endpoint
// ligero que usa el kiosco de sala para poblar su selector.
import api from './axios';

const BASE = '/empleados';

/**
 * Lista de empleados.
 * `activo` es opcional: undefined = todos, 1 = activos, 0 = inactivos.
 * -> { datos: [{ id, nombre, activo, created_at, updated_at }], total }
 * `datos` puede faltar; el store lo trata como lista vacía.
 */
export const getEmpleados = (activo) =>
  api.get(`${BASE}/`, {
    params: activo === 0 || activo === 1 ? { activo } : {},
  });

/** Crea un empleado (activo por defecto). Body: { nombre } */
export const postEmpleado = (data) => api.post(`${BASE}/`, data);

/** Actualiza un empleado. Body: { nombre } y/o { activo: 0 | 1 } */
export const putEmpleado = (id, data) => api.put(`${BASE}/${id}`, data);
