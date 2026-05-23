import axios from 'axios';

// Create an instance linking directly to your unified Node.js backend port with the required /api route prefix
const api = axios.create({
  baseURL: 'http://localhost:5000/api', 
  timeout: 10000, // Safe timeout fallback of 10 seconds
});

// Interceptor: Automatically grabs your login token and injects it into every single request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;