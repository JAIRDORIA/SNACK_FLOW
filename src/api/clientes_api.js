import api from "./axios";

export const getClientesTop = (limite = 5) =>
    api.get(`/clientes/top?limite=${limite}`);