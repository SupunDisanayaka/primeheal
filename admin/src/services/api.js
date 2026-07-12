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

const normalizeAppointmentStatus = (status) => {
  if (status === 'Confirmed') return 'Checked In';
  return status;
};

const mapAppointment = (appointment) => ({
  _id: appointment._id ?? appointment.appointmentId,
  appointmentId: appointment.appointmentId ?? appointment._id,
  patientName: appointment.patientName || '',
  patientEmail: appointment.patientEmail || '',
  patientPhone: appointment.patientPhone || '',
  patientGender: appointment.patientGender || '',
  patientDob: appointment.patientDob || '',
  docId: appointment.docId ?? appointment.doctorUserId ?? appointment.doctorId ?? '',
  doctorName: appointment.doctorName || '',
  speciality: appointment.speciality || '',
  slotDate: appointment.slotDate || appointment.appointmentDate || '',
  slotTime: appointment.slotTime || appointment.appointmentTime || '',
  amount: Number(appointment.amount ?? appointment.totalCharge ?? appointment.fee ?? 0),
  status: normalizeAppointmentStatus(appointment.status),
  backendStatus: appointment.backendStatus || appointment.status,
  createdAt: appointment.createdAt ? new Date(appointment.createdAt) : new Date(),
  updatedAt: appointment.updatedAt ? new Date(appointment.updatedAt) : new Date(),
  patientAddress: appointment.patientAddress || '',
  patientNic: appointment.patientNic || '',
  docAddress: appointment.docAddress || '',
  noShowRefund: Boolean(appointment.noShowRefund)
});

export const getAdminAppointments = async () => {
  const response = await api.get('/admin/appointments');
  return {
    ...response.data,
    appointments: (response.data.appointments || []).map(mapAppointment)
  };
};

export const getAdminRecentAppointments = async () => {
  const response = await api.get('/admin/recent-appointments');
  return {
    ...response.data,
    appointments: (response.data.appointments || []).map(mapAppointment)
  };
};

export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const updateAdminAppointmentStatus = async (appointmentId, status) => {
  const response = await api.patch(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};

export const getDoctorAppointmentsAPI = async () => {
  const response = await api.get('/appointments/my');
  return {
    ...response.data,
    appointments: (response.data.appointments || []).map(mapAppointment)
  };
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
