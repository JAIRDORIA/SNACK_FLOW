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



import axios from './axios'

export const getAbonosPorVentas = async (ventaIds) => {
  if (!ventaIds.length) return []

  const promesas = ventaIds.map(id =>
    axios.get(`/ventas/${id}/detalle`, {
      params: { _t: Date.now() }  // ← Evita la caché del navegador
    }).then(res => ({
      venta_id: id,
      abonos: res.data?.abonos || []
    }))
  )

  const resultados = await Promise.all(promesas)
  return resultados
}