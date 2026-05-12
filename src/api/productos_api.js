import api from "./axios";

export const getProductosMasVendidos = (limite = 5) =>
    api.get(`/productos/mas-vendidos?limite=${limite}`);