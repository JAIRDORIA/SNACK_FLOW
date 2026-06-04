import axios from "axios";

const api = axios.create({
    baseURL: "http://192.168.1.2:4000",  // URL de tu backend
    headers: {
        "Content-Type": "application/json"
    }
});

// Agrega el token automáticamente en cada petición
api.interceptors.request.use(config => {
    const token = localStorage.getItem("access_token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Si el token expira, bota al login
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem("access_token")
            window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)

export default api;