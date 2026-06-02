// src/store/customerService.js
// URL base de tu backend de Flask para clientes
const API_URL = "http://localhost:4000/api/clientes";

export const customerService = {
  // RF13: Listar todos los clientes registrados
  getAll: async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error al obtener los clientes");
    return await response.json();
  },

  // RF10: Registrar clientes
  create: async (customerData) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error("Error al registrar el cliente");
    return await response.json();
  },

  // RF11: Editar la información de los clientes
  update: async (id, customerData) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error("Error al actualizar el cliente");
    return await response.json();
  },

  // RF12: Eliminar clientes
  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar el cliente");
    return await response.json();
  },

  // RF14, RF15, RF16, RF17: Visualizar detalle, deudas e historial de un cliente específico
  getDetail: async (id) => {
    const response = await fetch(`${API_URL}/${id}/detalle`);
    if (!response.ok) throw new Error("Error al obtener el detalle del cliente");
    return await response.json();
  }
};