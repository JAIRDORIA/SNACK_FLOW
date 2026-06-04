import api from "./axios";

// listar abonos
export const getAbonos = (pagina = 1, limite = 20) =>
  api.get(`/abonos/?pagina=${pagina}&limite=${limite}`)

export const crearAbono = (data) => api.post('/abonos/', data)

export const eliminarAbono = (id) => api.delete(`/abonos/${id}`)



export const getAbonosPorVentas = async (ventaIds) => {
  if (!ventaIds.length) return []

  const promesas = ventaIds.map(id =>
    api.get(`/ventas/${id}/detalle`, {
      params: { _t: Date.now() }  // ← Evita la caché del navegador
    }).then(res => ({
      venta_id: id,
      abonos: res.data?.abonos || []
    }))
  )

  const resultados = await Promise.all(promesas)
  return resultados
}