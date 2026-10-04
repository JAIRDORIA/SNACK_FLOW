import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000',
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
        const esLogin = (error.config?.url || '').includes('/auth/login')

        if (error.response?.status === 401 && !esLogin) {
            localStorage.removeItem("access_token")
            localStorage.removeItem('usuario')
            if (window.location.pathname !== '/login') {
                window.location.replace("/login")
            }
        }
        return Promise.reject(error)
    }
)

export default api;