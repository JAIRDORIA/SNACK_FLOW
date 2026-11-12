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
// Ventas con domicilio (selector de compras de domicilio). Filtra y pagina en servidor.
export const getVentasConDomicilio = (pagina = 1, limite = 20, q = '', soloPendientes = true) => {
    let url = `/ventas/con-domicilio?pagina=${pagina}&limite=${limite}`
    if (q) url += `&q=${encodeURIComponent(q)}`
    if (soloPendientes) url += `&solo_pendientes=true`
    return api.get(url)
}

// Ventas por día de la semana (semanas: 1-8)
export const getVentasPorDiaSemana = (semanas = 3) =>
    api.get(`/ventas/por-dia-semana?semanas=${semanas}`)

// Serie diaria de ventas cobradas (modo: "corte" | "dias"; dias: 1-366)
export const getVentasSerieDiaria = (modo = 'corte', dias = 30) =>
    api.get(`/ventas/serie-diaria?modo=${modo}&dias=${dias}`)
