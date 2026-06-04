// src/api/productos_api.js
import api from "./axios";

// RF24: Listar todos los productos
export const getProductos = (pagina = 1, limite = 20) =>
  api.get(`/productos/?pagina=${pagina}&limite=${limite}`);

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