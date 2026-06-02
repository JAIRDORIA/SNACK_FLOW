// src/store/productService.js
import api from "../api/axios";

export const productService = {

  // RF24: Listar productos
  getAll: async () => {
  const response = await api.get("/productos/");
   // Agrega este log para depurar
  return response.data.datos;
},
 // Agrega este log para depurar
  // RF21: Registrar producto
  create: async (productData) => {
    const response = await api.post("/productos", productData);
    return response.data;
  },

  // RF22: Editar producto
  update: async (id, productData) => {
    const response = await api.put(`/productos/${id}`, productData);
    return response.data;
  },

  // RF23: Eliminar producto
  delete: async (id) => {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },
};