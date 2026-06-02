import api from "./axios";

export const getProducciones = (pagina = 1, limite = 20) =>
    api.get(`/producciones/?pagina=${pagina}&limite=${limite}`);

export const getProduccionById = (id) =>
    api.get(`/producciones/${id}`);

export const postProduccion = (data) =>
    api.post("/producciones/", data);