import api from "./axios";

// listar ventas con paginacion
// `filtros` = { estados, tipos_pago }: CSV en minúscula (ej. "pendiente,entregada").
// Solo se envía cada grupo si trae algo marcado.
export const getVentas = (pagina = 1, limite = 20, corte_id = null, q = '', filtros = {}) => {
    const { estados = '', tipos_pago = '' } = filtros
    let url = `/ventas/?pagina=${pagina}&limite=${limite}`
    if (corte_id) url += `&corte_id=${corte_id}`
    if (q) url += `&q=${encodeURIComponent(q)}`
    if (estados) url += `&estados=${estados}`
    if (tipos_pago) url += `&tipos_pago=${tipos_pago}`
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