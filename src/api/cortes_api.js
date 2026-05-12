import api from "./axios";

export const getBalance = () =>
    api.get("/cortes/balance");

export const getCortes = (pagina = 1, limite = 20) =>
    api.get(`/cortes/?pagina=${pagina}&limite=${limite}`);

export const iniciarCorte = () =>
    api.post("/cortes/iniciar");

export const cerrarCorte = () =>
    api.post("/cortes/cerrar");

export const putCorte = (id, data) =>
    api.put(`/cortes/${id}`, data);