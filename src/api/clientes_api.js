import api from "./axios";

export const getClientesTop = (limite = 5) =>
    api.get(`/clientes/top?limite=${limite}`);

export const getClientes = (pagina = 1, limite = 20) =>
    api.get(`/clientes/?pagina=${pagina}&limite=${limite}`);

