// src/api/productos_api.js
import api from "./axios";

// RF24: Listar productos paginados. `q` busca por nombre o descripción.
// `limite` máximo aceptado por el backend: 200.
export const getProductos = (pagina = 1, limite = 99, q = '') => {
  const params = { pagina, limite }
  if (q) params.q = q
  return api.get("/productos/", { params });
};

// Trae todas las páginas con el límite máximo permitido. Se usa donde el
// catálogo completo es necesario (combos personalizados y sus nombres).
export const getTodosLosProductos = async () => {
  const productos = []
  let pagina = 1
  let totalPaginas = 1
  do {
    const res = await getProductos(pagina, 200)
    const data = res.data || {}
    productos.push(...(data.datos || []))
    totalPaginas = data.total_paginas || Math.ceil((data.total || 0) / 200) || 1
    pagina += 1
  } while (pagina <= totalPaginas)
  return productos
};

// RF21: Registrar producto
// body: { nombre, descripcion, precio, unidades_por_bandeja }
export const crearProducto = (data) =>
  api.post("/productos/", data);

// RF22: Editar producto
// body: { nombre, descripcion, precio, unidades_por_bandeja }
export const editarProducto = (id, data) =>
  api.put(`/productos/${id}`, data);

// RF23: Eliminar producto
export const eliminarProducto = (id) =>
  api.delete(`/productos/${id}`);

// Extra: más vendidos para dashboard
export const getProductosMasVendidos = (limite = 5) =>
  api.get(`/productos/mas-vendidos?limite=${limite}`);

// Productos activos con stock sin ventas hace N días (dias: 1-365, limite: 1-50)
export const getProductosSinMovimiento = (dias = 15, limite = 5) =>
  api.get('/productos/sin-movimiento', { params: { dias, limite } });