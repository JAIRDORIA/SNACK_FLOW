import axios from './axios'

// Obtener balance del corte actual
export const getBalance = () => axios.get('/cortes/balance')

// Obtener historial de cortes (últimos 5)
export const getHistorialCortes = () => axios.get('/cortes/historial?limite=10')

// Cerrar el corte actual
export const cerrarCorte = () => axios.post('/cortes/cerrar')