import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || localStorage.getItem('doctorToken') || localStorage.getItem('receptionistToken') || localStorage.getItem('accountantToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Services
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

// User Services
export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (userData) => {
  const response = await api.put('/users/profile', userData);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/password-reset-request', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post('/auth/password-reset', { token, password });
  return response.data;
};

export const createAppointment = async (payload) => {
  const response = await api.post('/appointments/create', payload);
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get('/appointments/my');
  return response.data;
};

// Doctor Services
export const getDoctors = async () => {
  const response = await api.get('/doctors');
  return response.data;
};

export const getDoctorById = async (id) => {
  const response = await api.get(`/doctors/${id}`);
  return response.data;
};

export default api;
