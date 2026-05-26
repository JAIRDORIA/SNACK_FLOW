import axios from "axios";

const api = axios.create({
    baseURL: "http://10.2.137.46:4000",
    headers: {
        "Content-Type": "application/json"
    }
});

export default api;