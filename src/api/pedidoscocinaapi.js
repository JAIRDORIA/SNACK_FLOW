// AJUSTAR: ruta de tu instancia de axios (la que ya usan los demás api/*.js)
import api from './axios';

// fecha: 'YYYY-MM-DD' (hora Colombia). Si es null, el backend usa "hoy".
export const getPedidosCocina = (fecha) =>
  api.get('/pedidos-cocina/', { params: fecha ? { fecha } : {} });

export const entregarPedidoCocina = (id) =>
  api.put(`/pedidos-cocina/${id}/entregar`);

// Ventas que cocina ya marcó como entregadas y el admin aún no confirma.
// El backend las devuelve de la más reciente a la más antigua (puede incluir
// días anteriores). `hora_local` ya viene en hora Colombia (HH:mm).
export const getPedidosPorConfirmar = () =>
  api.get('/pedidos-cocina/por-confirmar');