// AJUSTAR: ruta de tu instancia de axios (la que ya usan los demás api/*.js)
import api from './axios';

// fecha: 'YYYY-MM-DD' (hora Colombia). Si es null, el backend usa "hoy".
export const getPedidosCocina = (fecha) =>
  api.get('/pedidos-cocina/', { params: fecha ? { fecha } : {} });

export const entregarPedidoCocina = (id) =>
  api.put(`/pedidos-cocina/${id}/entregar`);