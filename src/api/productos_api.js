import api from "./axios";

export const getProductosMasVendidos = (limite = 5) =>
    api.get(`/productos/mas-vendidos?limite=${limite}`);

export const getProductos = (pagina = 1, limite = 20) =>
    api.get(`/productos/?pagina=${pagina}&limite=${limite}`);