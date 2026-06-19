import api from '../api/axios';

// Centralized API service for all backend calls
export const apiService = {
  // ====================
  // AUTHENTICATION
  // ====================
  auth: {
    login: async (phone, password) => {
      const response = await api.post('/api/login', { phone, password });
      return response.data;
    },

    register: async (userData) => {
      const response = await api.post('/api/register', userData);
      return response.data;
    },

    forgotPassword: async (phone) => {
      const response = await api.post('/api/forgot-password', { phone });
      return response.data;
    },

    resetPassword: async (phone, otp, newPassword) => {
      const response = await api.post('/api/reset-password', { phone, otp, newPassword });
      return response.data;
    },

    getMe: async () => {
      const response = await api.get('/api/me');
      return response.data;
    },
  },

  // ====================
  // PATIENTS
  // ====================
  patients: {
    getAll: async (page = 1, limit = 10, search = '') => {
      const params = { page, limit, search };
      const response = await api.get('/api/patients', { params });
      return response.data;
    },

    getById: async (id) => {
      const response = await api.get(`/api/patients/${id}`);
      return response.data;
    },

    create: async (patientData) => {
      const response = await api.post('/api/patients', patientData);
      return response.data;
    },
  },

  // ====================
  // DOCTORS
  // ====================
  doctors: {
    getAll: async () => {
      const response = await api.get('/api/users?role=doctor');
      return response.data;
    },
  },

  // ====================
  // APPOINTMENTS
  // ====================
  appointments: {
    getAll: async (page = 1, limit = 10, search = '', status = 'All') => {
      const params = { page, limit, search, status };
      const response = await api.get('/api/appointments', { params });
      return response.data;
    },

    create: async (appointmentData) => {
      const response = await api.post('/api/appointments', appointmentData);
      return response.data;
    },

    update: async (id, updateData) => {
      const response = await api.put(`/api/appointments/${id}`, updateData);
      return response.data;
    },
  },

  // ====================
  // MEDICINES
  // ====================
  medicines: {
    getAll: async (page = 1, limit = 10, search = '') => {
      const params = { page, limit, search };
      const response = await api.get('/api/medicines', { params });
      return response.data;
    },

    getById: async (id) => {
      const response = await api.get(`/api/medicines/${id}`);
      return response.data;
    },

    create: async (medicineData) => {
      const response = await api.post('/api/medicines', medicineData);
      return response.data;
    },

    updateStock: async (id, stock) => {
      const response = await api.put(`/api/medicines/${id}/stock`, { stock });
      return response.data;
    },
  },

  // ====================
  // PRESCRIPTIONS
  // ====================
  prescriptions: {
    getAll: async () => {
      const response = await api.get('/api/prescriptions');
      return response.data;
    },

    create: async (prescriptionData) => {
      const response = await api.post('/api/prescriptions', prescriptionData);
      return response.data;
    },
  },

  // ====================
  // MEDICAL RECORDS
  // ====================
  medicalRecords: {
    getAll: async () => {
      const response = await api.get('/api/medical-records');
      return response.data;
    },

    create: async (recordData) => {
      const response = await api.post('/api/medical-records', recordData);
      return response.data;
    },
  },

  // ====================
  // INVOICES & BILLING
  // ====================
  invoices: {
    getAll: async () => {
      const response = await api.get('/api/invoices');
      return response.data;
    },

    create: async (invoiceData) => {
      const response = await api.post('/api/invoices', invoiceData);
      return response.data;
    },
  },

  // ====================
  // PAYMENT LEDGER
  // ====================
  paymentLedger: {
    getAll: async (page = 1, limit = 10, search = '') => {
      const params = { page, limit, search };
      const response = await api.get('/api/payment-ledger', { params });
      return response.data;
    },

    create: async (ledgerData) => {
      const response = await api.post('/api/payment-ledger', ledgerData);
      return response.data;
    },
  },

  // ====================
  // DASHBOARD & REPORTS
  // ====================
  dashboard: {
    getStats: async () => {
      const response = await api.get('/api/dashboard-stats');
      return response.data;
    },

    getReportsData: async () => {
      const response = await api.get('/api/reports-data');
      return response.data;
    },
  },

  // ====================
  // CHAT & MESSAGING
  // ====================
  chat: {
    getConversations: async () => {
      const response = await api.get('/api/conversations');
      return response.data;
    },

    getMessages: async (conversationId) => {
      const response = await api.get(`/api/conversations/${conversationId}/messages`);
      return response.data;
    },

    sendMessage: async (conversationId, messageData) => {
      const response = await api.post(`/api/conversations/${conversationId}/messages`, messageData);
      return response.data;
    },
  },

  // ====================
  // NOTIFICATIONS
  // ====================
  notifications: {
    getAll: async () => {
      const response = await api.get('/api/notifications');
      return response.data;
    },
  },
};

export default apiService;
