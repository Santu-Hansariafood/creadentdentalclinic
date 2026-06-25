import { gql } from "@apollo/client";

export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      role
    }
  }
`;

export const GET_USERS_BY_ROLE = gql`
  query GetUsersByRole($role: String!) {
    getUsersByRole(role: $role) {
      id
      name
      specialization
    }
  }
`;

export const GET_MEDICINES = gql`
  query GetMedicines($page: Int, $limit: Int, $search: String) {
    getMedicines(page: $page, limit: $limit, search: $search) {
      medicines {
        id
        name
        category
        description
      }
      totalCount
      totalPages
      currentPage
    }
  }
`;

export const GET_MEDICINE_CATEGORIES = gql`
  query GetMedicineCategories {
    getMedicineCategories
  }
`;

export const GET_APPOINTMENTS = gql`
  query GetAppointments(
    $page: Int
    $limit: Int
    $search: String
    $status: String
  ) {
    getAppointments(
      page: $page
      limit: $limit
      search: $search
      status: $status
    ) {
      appointments {
        id
        patientName
        doctorName
        date
        time
        type
        status
      }
      totalCount
      totalPages
      currentPage
    }
  }
`;

export const GET_MEDICAL_RECORDS = gql`
  query GetMedicalRecords {
    getMedicalRecords {
      id
      patientName
      doctorName
      date
      visitType
      diagnosis
      treatment
    }
  }
`;

export const GET_INVOICES = gql`
  query GetInvoices {
    getInvoices {
      id
      invoiceNumber
      patientName
      date
      total
      status
      balance
    }
  }
`;

export const GET_PRESCRIPTIONS = gql`
  query GetPrescriptions {
    getPrescriptions {
      id
      patientName
      doctorName
      date
      diagnosis
      medications {
        name
        dosage
        frequency
        duration
        instructions
      }
      notes
      status
    }
  }
`;

export const GET_PAYMENT_LEDGERS = gql`
  query GetPaymentLedgers($page: Int, $limit: Int, $search: String) {
    getPaymentLedgers(page: $page, limit: $limit, search: $search) {
      paymentLedgers {
        id
        slNo
        lorryNo
        paymentDate
        paymentAmount
        dueAmount
        status
        remarks
      }
      totalCount
      totalPages
      currentPage
    }
  }
`;

export const GET_PATIENTS = gql`
  query GetPatients($page: Int, $limit: Int, $search: String) {
    getPatients(page: $page, limit: $limit, search: $search) {
      patients {
        id
        name
        email
        phone
        dateOfBirth
        gender
        address
        bloodGroup
        status
      }
      totalCount
      totalPages
      currentPage
    }
  }
`;

export const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    getPatient(id: $id) {
      id
      name
      email
      phone
      dateOfBirth
      gender
      address
      bloodGroup
      status
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      patient {
        upcomingAppointments
        totalAppointments
        pendingBills
        unreadMessages
      }
      doctor {
        todayAppointments
        totalPatients
        pendingReports
        unreadMessages
      }
      admin {
        totalPatients
        todayAppointments
        pendingPayments
        monthlyRevenue
      }
    }
  }
`;

export const GET_REPORTS_DATA = gql`
  query GetReportsData {
    getReportsData {
      monthlyRevenue {
        month
        revenue
      }
      appointmentsByType {
        type
        count
      }
      patientDemographics {
        ageGroup
        count
      }
      treatmentSuccess {
        treatment
        successRate
      }
    }
  }
`;

export const GET_CONVERSATIONS = gql`
  query GetConversations {
    getConversations {
      id
      participants {
        id
        name
        role
      }
      lastMessage
      lastMessageTime
      unreadCount
    }
  }
`;

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($conversationId: ID!) {
    getChatMessages(conversationId: $conversationId) {
      id
      conversationId
      senderId
      senderName
      senderRole
      receiverId
      receiverName
      receiverRole
      message
      timestamp
      read
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    getNotifications {
      id
      userId
      type
      title
      message
      timestamp
      read
      priority
    }
  }
`;

export const GET_RECENT_ACTIVITIES = gql`
  query GetRecentActivities($limit: Int) {
    getRecentActivities(limit: $limit) {
      id
      type
      action
      user
      timestamp
    }
  }
`;
