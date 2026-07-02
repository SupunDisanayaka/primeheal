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
    let token = '';
    // Determine which token to use based on the path or just try all
    // Since admin apps might have different contexts, they might store it as adminToken, doctorToken, etc.
    if (localStorage.getItem('adminToken')) token = localStorage.getItem('adminToken');
    else if (localStorage.getItem('doctorToken')) token = localStorage.getItem('doctorToken');
    else if (localStorage.getItem('receptionistToken')) token = localStorage.getItem('receptionistToken');
    else if (localStorage.getItem('accountantToken')) token = localStorage.getItem('accountantToken');
    else if (localStorage.getItem('aToken')) token = localStorage.getItem('aToken');
    else if (localStorage.getItem('dToken')) token = localStorage.getItem('dToken');
    else if (localStorage.getItem('token')) token = localStorage.getItem('token'); // default fallback

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

export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

// Doctor Services
export const getDoctors = async () => {
  const response = await api.get('/doctors');
  return response.data;
};

export const addDoctorAPI = async (doctorData) => {
  const response = await api.post('/doctors', doctorData);
  return response.data;
};

export const addReceptionistAPI = async (receptionistData) => {
  const response = await api.post('/auth/register-receptionist', receptionistData);
  return response.data;
};

export const addAccountantAPI = async (accountantData) => {
  const response = await api.post('/auth/register-accountant', accountantData);
  return response.data;
};

export const updateDoctorProfile = async (id, doctorData) => {
  const response = await api.put(`/doctors/${id}`, doctorData);
  return response.data;
};

export const toggleDoctorAvailability = async (id) => {
  const response = await api.put(`/doctors/${id}/availability`);
  return response.data;
};

export default api;
