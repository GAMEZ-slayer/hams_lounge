import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Points to your unified backend
});

// Automatically attaches your secure token to every request header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;