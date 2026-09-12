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
      config.headers = config.headers || {};
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

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginWithGoogle = async (accessToken) => {
  const response = await api.post('/auth/google', { accessToken });
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

export const cancelAppointment = async (appointmentId) => {
  const response = await api.patch(`/appointments/${appointmentId}/cancel`);
  return response.data;
};

export const createPaymentSession = async (appointmentId) => {
  const response = await api.post('/payment/create', { appointmentId });
  return response.data;
};

export const verifyPaymentAPI = async (payload) => {
  const response = await api.post('/payment/verify', payload);
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

export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/users/change-password', { currentPassword, newPassword, confirmPassword });
  return response.data;
};

export const uploadProfileImage = async (formData) => {
  const response = await api.post('/users/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const deleteProfileImage = async () => {
  const response = await api.delete('/users/profile-image');
  return response.data;
};

export const downloadInvoice = async (appointmentId) => {
  const response = await api.get(`/appointments/${appointmentId}/invoice`, {
    responseType: 'blob'
  });
  return response.data;
};

export const rescheduleAppointment = async (appointmentId, newDate, newTime) => {
  const response = await api.patch(`/appointments/${appointmentId}/reschedule`, { newDate, newTime });
  return response.data;
};

export const getDoctorSlots = async (doctorId, date) => {
  const url = date ? `/doctors/${doctorId}/slots?date=${date}` : `/doctors/${doctorId}/slots`;
  const response = await api.get(url);
  return response.data;
};

export const submitFeedbackAPI = async (payload) => {
  const response = await api.post('/feedback/submit', payload);
  return response.data;
};

export const submitComplaintAPI = async (payload) => {
  const response = await api.post('/complaints/submit', payload);
  return response.data;
};

export const getMyComplaintsAPI = async () => {
  const response = await api.get('/complaints/my');
  return response.data;
};

export default api;
