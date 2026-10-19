import api from './axios'

const BASE = '/medios-pago'

// Listar medios de pago.
// params opcionales: { activos, tipo, asignables }
// Ej.: listarMediosPago({ asignables: 1 })
export const listarMediosPago = (params = {}) =>
  api.get(`${BASE}/`, { params })

// Saldos por cuenta de transferencia + total_transferencia.
// `buscar` es un texto opcional para filtrar por nombre o titular.
export const obtenerSaldos = (buscar = '') => {
  const termino = String(buscar || '').trim()
  return api.get(`${BASE}/saldos`, {
    params: termino ? { buscar: termino } : undefined,
  })
}

// Movimientos de una cuenta.
// params opcionales: { pagina, limite, desde, hasta }
export const obtenerMovimientos = (id, params = {}) =>
  api.get(`${BASE}/${id}/movimientos`, { params })

// Crear cuenta de transferencia.
// body: { nombre, titular, saldo_inicial, orden }
export const crearMedioPago = (data) =>
  api.post(`${BASE}/`, data)

export const actualizarMedioPago = (id, data) =>
  api.put(`${BASE}/${id}`, data)

// Activar / desactivar una cuenta.
export const cambiarEstadoMedioPago = (id, activo) =>
  api.patch(`${BASE}/${id}/estado`, { activo })

export const eliminarMedioPago = (id) =>
  api.delete(`${BASE}/${id}`)

// Retirar saldo de una cuenta hacia ahorros.
// body: { monto, descripcion? } — el usuario sale del token.
export const crearRetiro = (id, data) =>
  api.post(`${BASE}/${id}/retiros`, data)

// Vaciar todas las cuentas de transferencia hacia ahorros.
// body opcional: { descripcion } — el usuario sale del token.
export const vaciarCuentas = (data = {}) =>
  api.post(`${BASE}/retiros/vaciar`, data)
