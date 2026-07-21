import api from "./axios";

export const getCompras = (pagina = 1, limite = 20, corteId = null, busqueda = '') => {
    let url = `/compras/?pagina=${pagina}&limite=${limite}`
    if (corteId) url += `&corte_id=${corteId}`
    if (busqueda) url += `&q=${encodeURIComponent(busqueda)}`
    return api.get(url)
}
export const postCompra = (data) =>
    api.post("/compras/", data);

export const putCompra = (id, data) =>
    api.put(`/compras/${id}`, data);

export const deleteCompra = (id) =>
    api.delete(`/compras/${id}`);


