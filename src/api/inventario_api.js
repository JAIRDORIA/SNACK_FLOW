import api from "./axios";

export const getInventario = (pagina = 1, limite = 20) =>
    api.get(`/inventarios/?pagina=${pagina}&limite=${limite}`);

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
 