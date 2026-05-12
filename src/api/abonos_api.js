import api from "./axios";

// listar abonos
export const getAbonos = (pagina = 1, limite = 20) =>
    api.get(`/abonos/?pagina=${pagina}&limite=${limite}`);

// registrar abono
export const postAbono = (data) =>
    api.post("/abonos/", data);

// actualizar abono
export const putAbono = (id, data) =>
    api.put(`/abonos/${id}`, data);

// eliminar abono
export const deleteAbono = (id) =>
    api.delete(`/abonos/${id}`);