import api from "./axios";

export const getProveedores = () =>
    api.get("/proveedores/");

export const postProveedor = (data) =>
    api.post("/proveedores/", data);

export const putProveedor = (id, data) =>
    api.put(`/proveedores/${id}`, data);

export const deleteProveedor = (id) =>
    api.delete(`/proveedores/${id}`);