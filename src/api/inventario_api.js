import api from "./axios";

// `q` busca por nombre de producto en el servidor. `limite` máximo: 200.
export const getInventario = (pagina = 1, limite = 20, q = '') => {
    const params = { pagina, limite }
    if (q) params.q = q
    return api.get("/inventarios/", { params });
};

export const getInventarioById = (id) =>
    api.get(`/inventarios/${id}`);

export const postInventario = (data) =>
    api.post("/inventarios/", data);

export const putInventario = (id, data) =>
    api.put(`/inventarios/${id}`, data);

export const getProductosBajoStock = () =>
    api.get("/inventarios/bajo-stock");

// Agrega esto junto a tu putInventario ya existente (para stock_minimo)
export const putInventarioCantidades = (id, data) =>
  api.put(`/inventarios/${id}/cantidades/`, data)
 