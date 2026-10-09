// API de la pantalla de producción (kiosco de sala).
// No confundir con producciones_api.js (historial de inventario del admin).
import api from './axios';

// Empleados activos de la sala de producción -> [{ id, nombre }]
export const getEmpleadosActivos = () =>
  api.get('/empleados/activos');

// Productos activos con sus unidades por bandeja -> [{ id, nombre, unidades_por_bandeja }]
export const getProductosProduccion = () =>
  api.get('/produccion-empleados/productos');

// Registra una producción pendiente de validación.
// body: { empleado_id, producto_id, bandejas, unidades_sueltas }
export const postProduccionEmpleado = (data) =>
  api.post('/produccion-empleados/', data);

// Últimos registros de producción (máx. 5 por empleado activo, de todos los estados).
export const getRegistros = () =>
  api.get('/produccion-empleados/registros');
