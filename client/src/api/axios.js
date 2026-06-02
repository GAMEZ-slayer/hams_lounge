import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000', // 👈 not import.meta.env, 
  // const api = axios.create({',
  timeout: 60000, // 👈 wait 60 seconds instead of default ~5s// 👈 only this line changes
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;