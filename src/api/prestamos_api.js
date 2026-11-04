import api from './axios'

const BASE = '/prestamos'

// GET /prestamos/ devuelve { datos, total, pagina, limite, total_paginas }.
// `cliente_id` permite pedir todos los préstamos de un cliente sin paginar el
// resto del listado (usado por consumidores que necesitan ese subconjunto).
export const listarPrestamos = ({
  pagina = 1,
  limite = 20,
  q = '',
  estado,
  cliente_id,
} = {}) => {
  const params = { pagina, limite }
  if (q) params.q = q
  if (estado) params.estado = estado
  if (cliente_id !== undefined && cliente_id !== null && cliente_id !== '') {
    params.cliente_id = cliente_id
  }
  return api.get(`${BASE}/`, { params })
}

export const crearPrestamo = (data) => api.post(`${BASE}/`, data)


export const listarPagosPrestamo = (prestamoId) =>
  api.get(`${BASE}/${prestamoId}/abonos`)

// medio_pago aquí es el medio con el que EL CLIENTE PAGA este abono,
// puede ser distinto entre abonos de un mismo préstamo.
export const abonarPrestamo = (prestamoId, data) =>
  api.post(`${BASE}/${prestamoId}/abonos`, data)