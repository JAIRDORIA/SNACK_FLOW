import api from "./axios";

export const getBalance = () =>
    api.get("/cortes/balance");

// Dinero cobrado (abonos) en el corte abierto, incluyendo abonos a ventas de
// cortes anteriores. El backend responde siempre 200 con la forma
// { ingresos_ventas_corte: <número> } (0.0 si no hay corte abierto).
export const getIngresosVentasCorte = () =>
    api.get("/cortes/ingresos-ventas");

export const getCortes = (pagina = 1, limite = 20) =>
    api.get(`/cortes/?pagina=${pagina}&limite=${limite}`);

export const iniciarCorte = () =>
    api.post("/cortes/iniciar");

export const cerrarCorte = () =>
    api.post("/cortes/cerrar");

export const putCorte = (id, data) =>
    api.put(`/cortes/${id}`, data);