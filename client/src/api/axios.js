import axios from 'axios';

const api = axios.create({
<<<<<<< HEAD
  baseURL: ' http://localhost:5000', // Points to your unified backend
=======
  baseURL: 'https://hams-lounge-4.onrender.com', // Points to your unified backend
>>>>>>> 1dce468b843891395de8d9746ce7480ae6b4022d
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
