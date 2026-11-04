import api from "./axios";

// Listado paginado: { exito, datos, total, pagina, limite, total_paginas }.
export const getProveedores = (pagina = 1, limite = 20, q = '') => {
    const params = { pagina, limite }
    if (q) params.q = q
    return api.get("/proveedores/", { params });
};

// Lista completa de proveedores activos para selects/dropdowns.
// No cambia el contrato de /proveedores/.
export const getProveedoresActivos = () =>
    api.get("/proveedores/activos");

export const postProveedor = (data) =>
    api.post("/proveedores/", data);

export const putProveedor = (id, data) =>
    api.put(`/proveedores/${id}`, data);

export const deleteProveedor = (id) =>
    api.delete(`/proveedores/${id}`);