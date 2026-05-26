import api from "./axios";

// listar ventas con paginacion
export const getVentas = (pagina = 1, limite = 20, corte_id = null) => {
    let url = `/ventas/?pagina=${pagina}&limite=${limite}`
    if (corte_id) url += `&corte_id=${corte_id}`
    return api.get(url)
}

// registrar venta
export const postVenta = (data) =>
    api.post("/ventas/", data);

// actualizar venta
export const putVenta = (id, data) =>
    api.put(`/ventas/${id}`, data);

// anular venta
export const anularVenta = (id) =>
    api.put(`/ventas/${id}/anulacion`);

export const getVentaDetalle = (id) =>
    api.get(`/ventas/${id}/detalle`)

export const getVentaComprobante = (id) => 
    api.get(`/ventas/${id}/comprobante`)