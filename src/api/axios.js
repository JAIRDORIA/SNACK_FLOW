import axios from "axios";

const api = axios.create({
    baseURL: "http://10.2.124.171:4000",  // URL de tu backend
    headers: {
        "Content-Type": "application/json"
    }
});

export default api;