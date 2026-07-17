import api from './axios'

const BASE = '/prestamos/'

export const listarPrestamos = (estado) => {
  const params = estado ? { estado } : {}
  return api.get(BASE, { params })
}

export const crearPrestamo = (data) => api.post(BASE, data)

// medio_pago aquí es el medio con el que EL CLIENTE PAGA, puede ser
// distinto al medio_pago con el que se le prestó originalmente.
export const pagarPrestamo = (id, usuario_id, medio_pago) =>
  api.put(`${BASE}${id}/pagar`, { usuario_id, medio_pago })