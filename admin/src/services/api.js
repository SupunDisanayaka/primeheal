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
    
    // Role specific token prioritization
    if (config.url?.includes('/appointments/my') || config.url?.startsWith('/doctor') || config.url?.includes('/notes')) {
      token = sessionStorage.getItem('doctorToken') || sessionStorage.getItem('adminToken') || sessionStorage.getItem('token');
    } else if (config.url?.startsWith('/receptionist')) {
      token = sessionStorage.getItem('receptionistToken') || sessionStorage.getItem('adminToken') || sessionStorage.getItem('token');
    } else if (config.url?.startsWith('/accountant')) {
      token = sessionStorage.getItem('accountantToken') || sessionStorage.getItem('adminToken') || sessionStorage.getItem('token');
    } else {
      if (sessionStorage.getItem('adminToken')) {
        token = sessionStorage.getItem('adminToken');
      } else if (sessionStorage.getItem('receptionistToken')) {
        token = sessionStorage.getItem('receptionistToken');
      } else if (sessionStorage.getItem('doctorToken')) {
        token = sessionStorage.getItem('doctorToken');
      } else if (sessionStorage.getItem('accountantToken')) {
        token = sessionStorage.getItem('accountantToken');
      } else if (sessionStorage.getItem('aToken')) {
        token = sessionStorage.getItem('aToken');
      } else if (sessionStorage.getItem('dToken')) {
        token = sessionStorage.getItem('dToken');
      } else if (sessionStorage.getItem('token')) {
        token = sessionStorage.getItem('token');
      }
    }

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

const formatDateStr = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && dateVal.includes(',')) return dateVal;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}, ${month}, ${year}`;
};

const mapAppointment = (appointment) => ({
  _id: appointment._id ?? appointment.appointmentId,
  appointmentId: appointment.appointmentId ?? appointment._id,
  patientName: appointment.patientName || '',
  patientEmail: appointment.patientEmail || '',
  patientPhone: appointment.patientPhone || '',
  patientGender: appointment.patientGender || '',
  patientDob: appointment.patientDob || '',
  docId: appointment.docId ?? appointment.doctorUserId ?? appointment.doctorId ?? appointment.doctorID ?? '',
  doctorUserId: appointment.doctorUserId ?? appointment.docId ?? '',
  doctorTableId: appointment.doctorTableId ?? appointment.doctorID ?? '',
  doctorID: appointment.doctorID ?? appointment.doctorTableId ?? '',
  doctorId: appointment.doctorId ?? appointment.doctorUserId ?? '',
  doctorName: appointment.doctorName || '',
  speciality: appointment.speciality || appointment.docSpeciality || '',
  slotDate: appointment.slotDate ? formatDateStr(appointment.slotDate) : formatDateStr(appointment.appointmentDate),
  slotTime: appointment.slotTime || appointment.appointmentTime || '',
  amount: Number(appointment.amount ?? appointment.totalCharge ?? appointment.fee ?? 0),
  status: normalizeAppointmentStatus(appointment.status),
  backendStatus: appointment.backendStatus || appointment.status,
  createdAt: appointment.createdAt ? new Date(appointment.createdAt) : new Date(),
  updatedAt: appointment.updatedAt ? new Date(appointment.updatedAt) : new Date(),
  patientAddress: appointment.patientAddress || '',
  patientNic: appointment.patientNic || '',
  paymentStatus: appointment.paymentStatus || '',
  paymentMethod: appointment.paymentMethod || '',
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

export const rescheduleAppointment = async (appointmentId, newDate, newTime) => {
  const response = await api.patch(`/appointments/${appointmentId}/reschedule`, { newDate, newTime });
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
  const config = doctorData instanceof FormData ? {
    transformRequest: (data, headers) => {
      delete headers['Content-Type'];
      return data;
    }
  } : {};
  const response = await api.post('/doctors', doctorData, config);
  return response.data;
};

export const saveDoctorAvailabilityAPI = async (id, availabilityData) => {
  const response = await api.post(`/doctors/${id}/availability`, availabilityData);
  return response.data;
};

export const addReceptionistAPI = async (receptionistData) => {
  const config = receptionistData instanceof FormData ? {
    transformRequest: (data, headers) => {
      delete headers['Content-Type'];
      return data;
    }
  } : {};
  const response = await api.post('/auth/register-receptionist', receptionistData, config);
  return response.data;
};

export const getReceptionistsAPI = async () => {
  const response = await api.get('/admin/receptionists');
  return response.data;
};


export const addAccountantAPI = async (accountantData) => {
  const config = accountantData instanceof FormData ? {
    transformRequest: (data, headers) => {
      delete headers['Content-Type'];
      return data;
    }
  } : {};
  const response = await api.post('/auth/register-accountant', accountantData, config);
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
    transformRequest: (data, headers) => {
      delete headers['Content-Type'];
      return data;
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

export const getReceptionistAppointmentsAPI = async () => {
  const response = await api.get('/receptionist/appointments');
  return response.data;
};

export const getDoctorSlotsAPI = async (doctorId, date) => {
  const url = date ? `/doctors/${doctorId}/slots?date=${date}` : `/doctors/${doctorId}/slots`;
  const response = await api.get(url);
  return response.data;
};

// --- Accountant Operations ---
export const collectCounterPaymentAPI = async (paymentData) => {
  const response = await api.post('/receptionist/collect-payment', paymentData);
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

export const downloadVisitPassAPI = async (appointmentId) => {
  const response = await api.get(`/appointments/${appointmentId}/visit-pass`, { responseType: 'blob' });
  return response.data;
};


export default api;
