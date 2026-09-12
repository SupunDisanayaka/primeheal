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
  noShowRefund: Boolean(appointment.noShowRefund),
  doctorNotes: appointment.doctorNotes || '',
  patientAllergies: appointment.patientAllergies || '',
  patientCode: appointment.patientCode || ''
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

export const updateDoctorNotesAPI = async (appointmentId, doctorNotes) => {
  const response = await api.patch(`/appointments/${appointmentId}/notes`, { doctorNotes });
  return response.data;
};

export const addDoctorAPI = async (doctorData) => {
  const headers = doctorData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const response = await api.post('/doctors', doctorData, { headers });
  return response.data;
};

export const saveDoctorAvailabilityAPI = async (id, availabilityData) => {
  const response = await api.post(`/doctors/${id}/availability`, availabilityData);
  return response.data;
};

export const addReceptionistAPI = async (receptionistData) => {
  const response = await api.post('/auth/register-receptionist', receptionistData);
  return response.data;
};

export const getReceptionistsAPI = async () => {
  const response = await api.get('/admin/receptionists');
  return response.data;
};


export const addAccountantAPI = async (accountantData) => {
  const response = await api.post('/auth/register-accountant', accountantData);
  return response.data;
};

export const getAccountantsAPI = async () => {
  const response = await api.get('/admin/accountants');
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

export const changePasswordAPI = async (payload) => {
  const response = await api.post('/users/change-password', payload);
  return response.data;
};

export const uploadProfileImageAPI = async (formData) => {
  const response = await api.post('/users/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const deleteProfileImageAPI = async () => {
  const response = await api.delete('/users/profile-image');
  return response.data;
};

// --- Receptionist Operations ---
export const checkInPatientAPI = async (appointmentId) => {
  const response = await api.put(`/receptionist/check-in/${appointmentId}`);
  return response.data;
};

export const createWalkInAppointmentAPI = async (walkInData) => {
  const response = await api.post('/receptionist/walkin', walkInData);
  return response.data;
};

export const getReceptionistStatsAPI = async () => {
  const response = await api.get('/receptionist/stats');
  return response.data;
};

// --- Accountant Operations ---
export const collectCounterPaymentAPI = async (paymentData) => {
  const response = await api.post('/accountant/collect-payment', paymentData);
  return response.data;
};

export const issueRefundAPI = async (refundData) => {
  const response = await api.post('/accountant/refund', refundData);
  return response.data;
};

export const getFinancialSummaryAPI = async () => {
  const response = await api.get('/accountant/financial-reports');
  return response.data;
};

export const recreateInvoiceAPI = async (invoiceData) => {
  const response = await api.post('/accountant/recreate-invoice', invoiceData);
  return response.data;
};

export const getAllInvoicesAPI = async () => {
  const response = await api.get('/accountant/invoices');
  return response.data;
};

// --- Feedback Operations ---
export const getDoctorFeedbackAPI = async (doctorId) => {
  const response = await api.get(`/feedback/doctor/${doctorId}`);
  return response.data;
};

// --- Complaint Management Operations ---
export const getAllComplaintsAdminAPI = async (params = {}) => {
  const response = await api.get('/complaints/admin/all', { params });
  return response.data;
};

export const updateComplaintStatusAPI = async (complaintId, payload) => {
  const response = await api.put(`/complaints/admin/${complaintId}`, payload);
  return response.data;
};

// --- Patient Management Operations ---
export const getAllPatientsAPI = async (params = {}) => {
  const response = await api.get('/patients', { params });
  return response.data;
};

export const getPatientByIdAPI = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

export const updatePatientByStaffAPI = async (id, updateData) => {
  const response = await api.put(`/patients/${id}`, updateData);
  return response.data;
};

export const registerPatientIntakeAPI = async (patientData) => {
  const response = await api.post('/patients/register', patientData);
  return response.data;
};

// --- Reporting & Audit Operations ---
export const getAppointmentReportAPI = async (params = {}) => {
  const response = await api.get('/reports/appointments', { params });
  return response.data;
};

export const getFinancialReportAPI = async (params = {}) => {
  const response = await api.get('/reports/financial', { params });
  return response.data;
};

export const getAuditLogsAPI = async (params = {}) => {
  const response = await api.get('/reports/audit-logs', { params });
  return response.data;
};

export default api;


