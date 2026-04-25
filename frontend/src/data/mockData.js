export const users = [
  { id: 1, email: 'patient@clinic.com', password: 'patient123', role: 'patient', name: 'John Doe', phone: '+1234567890', verified: true },
  { id: 2, email: 'doctor@clinic.com', password: 'doctor123', role: 'doctor', name: 'Dr. Sunita Agarwalla', phone: '+1234567891', verified: true, specialization: 'General Dentistry', license: 'DEN-12345' },
  { id: 3, email: 'admin@clinic.com', password: 'admin123', role: 'admin', name: 'Admin User', phone: '+1234567892', verified: true },
  { id: 4, email: 'jane@clinic.com', password: 'patient123', role: 'patient', name: 'Jane Smith', phone: '+1234567893', verified: true },
  { id: 5, email: 'dr.johnson@clinic.com', password: 'doctor123', role: 'doctor', name: 'Dr. Michael Johnson', phone: '+1234567894', verified: true, specialization: 'Orthodontics', license: 'DEN-67890' }
]

export const patients = [
  {
    id: 1,
    userId: 1,
    name: 'John Doe',
    email: 'patient@clinic.com',
    phone: '+1234567890',
    dateOfBirth: '1985-03-15',
    gender: 'Male',
    address: '123 Main St, City, State 12345',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Mary Doe',
      relationship: 'Spouse',
      phone: '+1234567899'
    },
    medicalHistory: {
      allergies: ['Penicillin', 'Latex'],
      chronicConditions: ['Hypertension'],
      medications: ['Lisinopril 10mg'],
      previousSurgeries: ['Appendectomy (2010)'],
      familyHistory: ['Diabetes (Father)', 'Heart Disease (Mother)']
    },
    dentalHistory: {
      lastVisit: '2024-01-15',
      previousTreatments: ['Root Canal (2023)', 'Teeth Cleaning (2024)'],
      currentIssues: ['Tooth Sensitivity'],
      dentalInsurance: {
        provider: 'Delta Dental',
        policyNumber: 'DD123456',
        expiryDate: '2025-12-31'
      }
    },
    registrationDate: '2023-01-10',
    status: 'Active'
  },
  {
    id: 2,
    userId: 4,
    name: 'Jane Smith',
    email: 'jane@clinic.com',
    phone: '+1234567893',
    dateOfBirth: '1990-07-22',
    gender: 'Female',
    address: '456 Oak Ave, City, State 12345',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Robert Smith',
      relationship: 'Father',
      phone: '+1234567898'
    },
    medicalHistory: {
      allergies: ['None'],
      chronicConditions: [],
      medications: [],
      previousSurgeries: [],
      familyHistory: ['Asthma (Brother)']
    },
    dentalHistory: {
      lastVisit: '2024-02-20',
      previousTreatments: ['Teeth Whitening (2023)', 'Cavity Filling (2024)'],
      currentIssues: [],
      dentalInsurance: {
        provider: 'Cigna Dental',
        policyNumber: 'CG789012',
        expiryDate: '2025-06-30'
      }
    },
    registrationDate: '2023-06-15',
    status: 'Active'
  },
  {
    id: 3,
    userId: null,
    name: 'Robert Johnson',
    email: 'robert.j@email.com',
    phone: '+1234567895',
    dateOfBirth: '1978-11-30',
    gender: 'Male',
    address: '789 Pine Rd, City, State 12345',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Linda Johnson',
      relationship: 'Spouse',
      phone: '+1234567896'
    },
    medicalHistory: {
      allergies: ['Aspirin'],
      chronicConditions: ['Type 2 Diabetes'],
      medications: ['Metformin 500mg'],
      previousSurgeries: ['Knee Surgery (2015)'],
      familyHistory: ['Diabetes (Both Parents)']
    },
    dentalHistory: {
      lastVisit: '2023-12-10',
      previousTreatments: ['Crown Placement (2022)', 'Gum Treatment (2023)'],
      currentIssues: ['Gum Inflammation'],
      dentalInsurance: {
        provider: 'Aetna Dental',
        policyNumber: 'AE345678',
        expiryDate: '2024-12-31'
      }
    },
    registrationDate: '2022-08-20',
    status: 'Active'
  }
]

export const appointments = [
  {
    id: 1,
    patientId: 1,
    patientName: 'John Doe',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    date: '2024-06-15',
    time: '10:00 AM',
    duration: 30,
    type: 'Check-up',
    status: 'Scheduled',
    reason: 'Regular dental check-up and cleaning',
    notes: 'Patient requested morning appointment',
    reminderSent: true
  },
  {
    id: 2,
    patientId: 1,
    patientName: 'John Doe',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    date: '2024-05-20',
    time: '2:30 PM',
    duration: 60,
    type: 'Treatment',
    status: 'Completed',
    reason: 'Root canal treatment - Tooth #14',
    notes: 'Treatment completed successfully. Follow-up in 2 weeks.',
    reminderSent: true
  },
  {
    id: 3,
    patientId: 2,
    patientName: 'Jane Smith',
    doctorId: 5,
    doctorName: 'Dr. Michael Johnson',
    date: '2024-06-18',
    time: '11:30 AM',
    duration: 45,
    type: 'Consultation',
    status: 'Scheduled',
    reason: 'Orthodontic consultation for braces',
    notes: 'First-time consultation',
    reminderSent: false
  },
  {
    id: 4,
    patientId: 2,
    patientName: 'Jane Smith',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    date: '2024-06-10',
    time: '9:00 AM',
    duration: 30,
    type: 'Check-up',
    status: 'Cancelled',
    reason: 'Routine check-up',
    notes: 'Patient requested cancellation due to schedule conflict',
    reminderSent: true
  },
  {
    id: 5,
    patientId: 3,
    patientName: 'Robert Johnson',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    date: '2024-06-20',
    time: '3:00 PM',
    duration: 45,
    type: 'Treatment',
    status: 'Scheduled',
    reason: 'Gum disease treatment',
    notes: 'Follow-up from previous consultation',
    reminderSent: true
  }
]

export const medicalRecords = [
  {
    id: 1,
    patientId: 1,
    patientName: 'John Doe',
    date: '2024-05-20',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    visitType: 'Treatment',
    diagnosis: 'Pulpitis - Tooth #14',
    treatment: 'Root Canal Treatment',
    prescriptions: ['Amoxicillin 500mg - 3 times daily for 7 days', 'Ibuprofen 400mg - As needed for pain'],
    notes: 'Root canal completed successfully. Crown placement recommended in 2 weeks. Patient tolerated procedure well.',
    attachments: [
      { name: 'X-Ray-Tooth-14.jpg', type: 'image', size: '2.4 MB', url: '#' },
      { name: 'Treatment-Plan.pdf', type: 'pdf', size: '156 KB', url: '#' }
    ],
    vitalSigns: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6
    },
    followUpDate: '2024-06-03'
  },
  {
    id: 2,
    patientId: 1,
    patientName: 'John Doe',
    date: '2024-01-15',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    visitType: 'Check-up',
    diagnosis: 'Healthy oral condition',
    treatment: 'Professional teeth cleaning and fluoride treatment',
    prescriptions: [],
    notes: 'Regular check-up. No cavities detected. Good oral hygiene maintained. Recommended to continue current dental care routine.',
    attachments: [
      { name: 'Panoramic-XRay.jpg', type: 'image', size: '3.1 MB', url: '#' }
    ],
    vitalSigns: {
      bloodPressure: '118/78',
      heartRate: 70,
      temperature: 98.4
    },
    followUpDate: '2024-07-15'
  },
  {
    id: 3,
    patientId: 2,
    patientName: 'Jane Smith',
    date: '2024-02-20',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    visitType: 'Treatment',
    diagnosis: 'Dental Caries - Tooth #26',
    treatment: 'Composite filling',
    prescriptions: [],
    notes: 'Small cavity filled with composite resin. No anesthesia required. Patient advised to avoid hard foods for 24 hours.',
    attachments: [
      { name: 'Before-Treatment.jpg', type: 'image', size: '1.8 MB', url: '#' },
      { name: 'After-Treatment.jpg', type: 'image', size: '1.9 MB', url: '#' }
    ],
    vitalSigns: {
      bloodPressure: '115/75',
      heartRate: 68,
      temperature: 98.2
    },
    followUpDate: null
  },
  {
    id: 4,
    patientId: 3,
    patientName: 'Robert Johnson',
    date: '2023-12-10',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    visitType: 'Consultation',
    diagnosis: 'Chronic Periodontitis',
    treatment: 'Deep cleaning (Scaling and Root Planing)',
    prescriptions: ['Chlorhexidine mouthwash - Twice daily for 2 weeks', 'Doxycycline 100mg - Once daily for 7 days'],
    notes: 'Moderate to severe gum disease detected. Deep cleaning performed. Patient educated on proper oral hygiene. Follow-up in 6 weeks to assess healing.',
    attachments: [
      { name: 'Periodontal-Chart.pdf', type: 'pdf', size: '245 KB', url: '#' },
      { name: 'Gum-Photos.jpg', type: 'image', size: '2.7 MB', url: '#' }
    ],
    vitalSigns: {
      bloodPressure: '135/85',
      heartRate: 76,
      temperature: 98.8
    },
    followUpDate: '2024-01-21'
  }
]

export const prescriptions = [
  {
    id: 1,
    patientId: 1,
    patientName: 'John Doe',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    date: '2024-05-20',
    medications: [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: '3 times daily',
        duration: '7 days',
        instructions: 'Take with food. Complete full course even if symptoms improve.',
        quantity: 21
      },
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'As needed',
        duration: '5 days',
        instructions: 'Take with food or milk. Do not exceed 3 doses per day.',
        quantity: 15
      }
    ],
    diagnosis: 'Post root canal treatment',
    notes: 'Antibiotics to prevent infection. Pain medication for discomfort management.',
    status: 'Active',
    refillsRemaining: 0
  },
  {
    id: 2,
    patientId: 3,
    patientName: 'Robert Johnson',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    date: '2023-12-10',
    medications: [
      {
        name: 'Chlorhexidine Gluconate Mouthwash',
        dosage: '0.12%',
        frequency: 'Twice daily',
        duration: '2 weeks',
        instructions: 'Rinse for 30 seconds after brushing. Do not swallow. Avoid eating or drinking for 30 minutes after use.',
        quantity: 1
      },
      {
        name: 'Doxycycline',
        dosage: '100mg',
        frequency: 'Once daily',
        duration: '7 days',
        instructions: 'Take with full glass of water. Avoid lying down for 30 minutes after taking.',
        quantity: 7
      }
    ],
    diagnosis: 'Chronic Periodontitis',
    notes: 'Antimicrobial therapy for gum disease treatment. Follow-up required.',
    status: 'Completed',
    refillsRemaining: 0
  },
  {
    id: 3,
    patientId: 1,
    patientName: 'John Doe',
    doctorId: 2,
    doctorName: 'Dr. Sunita Agarwalla',
    date: '2024-03-10',
    medications: [
      {
        name: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 6 hours as needed',
        duration: '3 days',
        instructions: 'For pain relief. Do not exceed 4000mg in 24 hours.',
        quantity: 12
      }
    ],
    diagnosis: 'Post-extraction pain management',
    notes: 'Wisdom tooth extraction. Pain medication for recovery.',
    status: 'Completed',
    refillsRemaining: 0
  }
]

export const invoices = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    patientId: 1,
    patientName: 'John Doe',
    date: '2024-05-20',
    dueDate: '2024-06-20',
    items: [
      { description: 'Root Canal Treatment - Tooth #14', quantity: 1, unitPrice: 1200, total: 1200 },
      { description: 'Digital X-Ray', quantity: 2, unitPrice: 50, total: 100 },
      { description: 'Consultation Fee', quantity: 1, unitPrice: 100, total: 100 }
    ],
    subtotal: 1400,
    tax: 112,
    discount: 0,
    total: 1512,
    amountPaid: 1512,
    balance: 0,
    status: 'Paid',
    paymentMethod: 'Credit Card',
    paymentDate: '2024-05-20',
    insuranceClaim: {
      provider: 'Delta Dental',
      claimNumber: 'CLM-2024-0156',
      claimAmount: 800,
      status: 'Approved'
    },
    notes: 'Insurance covered $800. Patient paid remaining balance.'
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    patientId: 2,
    patientName: 'Jane Smith',
    date: '2024-02-20',
    dueDate: '2024-03-20',
    items: [
      { description: 'Composite Filling - Tooth #26', quantity: 1, unitPrice: 250, total: 250 },
      { description: 'Dental Examination', quantity: 1, unitPrice: 80, total: 80 }
    ],
    subtotal: 330,
    tax: 26.4,
    discount: 33,
    total: 323.4,
    amountPaid: 323.4,
    balance: 0,
    status: 'Paid',
    paymentMethod: 'Insurance',
    paymentDate: '2024-02-20',
    insuranceClaim: {
      provider: 'Cigna Dental',
      claimNumber: 'CLM-2024-0089',
      claimAmount: 323.4,
      status: 'Approved'
    },
    notes: 'Fully covered by insurance. 10% discount applied for prompt payment.'
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-003',
    patientId: 3,
    patientName: 'Robert Johnson',
    date: '2023-12-10',
    dueDate: '2024-01-10',
    items: [
      { description: 'Deep Cleaning (Scaling & Root Planing) - Full Mouth', quantity: 1, unitPrice: 800, total: 800 },
      { description: 'Periodontal Examination', quantity: 1, unitPrice: 120, total: 120 },
      { description: 'Panoramic X-Ray', quantity: 1, unitPrice: 150, total: 150 }
    ],
    subtotal: 1070,
    tax: 85.6,
    discount: 0,
    total: 1155.6,
    amountPaid: 500,
    balance: 655.6,
    status: 'Partial',
    paymentMethod: 'Cash',
    paymentDate: '2023-12-10',
    insuranceClaim: {
      provider: 'Aetna Dental',
      claimNumber: 'CLM-2023-0445',
      claimAmount: 600,
      status: 'Pending'
    },
    notes: 'Patient paid $500 upfront. Insurance claim pending for $600. Remaining balance due upon insurance approval.'
  },
  {
    id: 4,
    invoiceNumber: 'INV-2024-004',
    patientId: 1,
    patientName: 'John Doe',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    items: [
      { description: 'Professional Teeth Cleaning', quantity: 1, unitPrice: 150, total: 150 },
      { description: 'Fluoride Treatment', quantity: 1, unitPrice: 50, total: 50 },
      { description: 'Routine Examination', quantity: 1, unitPrice: 80, total: 80 }
    ],
    subtotal: 280,
    tax: 22.4,
    discount: 0,
    total: 302.4,
    amountPaid: 302.4,
    balance: 0,
    status: 'Paid',
    paymentMethod: 'Debit Card',
    paymentDate: '2024-01-15',
    insuranceClaim: null,
    notes: 'Routine preventive care. No insurance claim filed.'
  }
]

export const chatMessages = [
  {
    id: 1,
    conversationId: 1,
    senderId: 1,
    senderName: 'John Doe',
    senderRole: 'patient',
    receiverId: 2,
    receiverName: 'Dr. Sunita Agarwalla',
    receiverRole: 'doctor',
    message: 'Hello Dr. Smith, I have some questions about my recent root canal treatment.',
    timestamp: '2024-05-21T10:30:00',
    read: true,
    attachments: []
  },
  {
    id: 2,
    conversationId: 1,
    senderId: 2,
    senderName: 'Dr. Sunita Agarwalla',
    senderRole: 'doctor',
    receiverId: 1,
    receiverName: 'John Doe',
    receiverRole: 'patient',
    message: 'Hello John! Of course, I\'m happy to help. What would you like to know?',
    timestamp: '2024-05-21T10:35:00',
    read: true,
    attachments: []
  },
  {
    id: 3,
    conversationId: 1,
    senderId: 1,
    senderName: 'John Doe',
    senderRole: 'patient',
    receiverId: 2,
    receiverName: 'Dr. Sunita Agarwalla',
    receiverRole: 'doctor',
    message: 'I\'m experiencing some sensitivity when drinking cold beverages. Is this normal after the procedure?',
    timestamp: '2024-05-21T10:37:00',
    read: true,
    attachments: []
  },
  {
    id: 4,
    conversationId: 1,
    senderId: 2,
    senderName: 'Dr. Sunita Agarwalla',
    senderRole: 'doctor',
    receiverId: 1,
    receiverName: 'John Doe',
    receiverRole: 'patient',
    message: 'Yes, mild sensitivity is completely normal for a few days after a root canal. It should gradually decrease. However, if it persists beyond a week or becomes severe, please let me know immediately.',
    timestamp: '2024-05-21T10:40:00',
    read: true,
    attachments: []
  },
  {
    id: 5,
    conversationId: 1,
    senderId: 1,
    senderName: 'John Doe',
    senderRole: 'patient',
    receiverId: 2,
    receiverName: 'Dr. Sunita Agarwalla',
    receiverRole: 'doctor',
    message: 'Thank you! Also, when should I schedule the crown placement?',
    timestamp: '2024-05-21T10:42:00',
    read: true,
    attachments: []
  },
  {
    id: 6,
    conversationId: 1,
    senderId: 2,
    senderName: 'Dr. Sunita Agarwalla',
    senderRole: 'doctor',
    receiverId: 1,
    receiverName: 'John Doe',
    receiverRole: 'patient',
    message: 'I recommend scheduling it within the next 2 weeks. I\'ll have my assistant reach out to you with available appointment slots. In the meantime, try to avoid chewing on that side.',
    timestamp: '2024-05-21T10:45:00',
    read: true,
    attachments: []
  },
  {
    id: 7,
    conversationId: 2,
    senderId: 2,
    senderName: 'Jane Smith',
    senderRole: 'patient',
    receiverId: 5,
    receiverName: 'Dr. Michael Johnson',
    receiverRole: 'doctor',
    message: 'Hi Dr. Johnson, I\'m interested in getting braces. What are my options?',
    timestamp: '2024-05-22T14:20:00',
    read: false,
    attachments: []
  },
  {
    id: 8,
    conversationId: 3,
    senderId: 3,
    senderName: 'Robert Johnson',
    senderRole: 'patient',
    receiverId: 2,
    receiverName: 'Dr. Sunita Agarwalla',
    senderRole: 'doctor',
    message: 'Doctor, I wanted to share my progress photos after the gum treatment.',
    timestamp: '2024-05-23T09:15:00',
    read: true,
    attachments: [
      { name: 'gum-progress-1.jpg', type: 'image', size: '1.2 MB', url: '#' },
      { name: 'gum-progress-2.jpg', type: 'image', size: '1.4 MB', url: '#' }
    ]
  }
]

export const conversations = [
  {
    id: 1,
    participants: [
      { id: 1, name: 'John Doe', role: 'patient' },
      { id: 2, name: 'Dr. Sunita Agarwalla', role: 'doctor' }
    ],
    lastMessage: 'I recommend scheduling it within the next 2 weeks...',
    lastMessageTime: '2024-05-21T10:45:00',
    unreadCount: 0
  },
  {
    id: 2,
    participants: [
      { id: 4, name: 'Jane Smith', role: 'patient' },
      { id: 5, name: 'Dr. Michael Johnson', role: 'doctor' }
    ],
    lastMessage: 'Hi Dr. Johnson, I\'m interested in getting braces...',
    lastMessageTime: '2024-05-22T14:20:00',
    unreadCount: 1
  },
  {
    id: 3,
    participants: [
      { id: 3, name: 'Robert Johnson', role: 'patient' },
      { id: 2, name: 'Dr. Sunita Agarwalla', role: 'doctor' }
    ],
    lastMessage: 'Doctor, I wanted to share my progress photos...',
    lastMessageTime: '2024-05-23T09:15:00',
    unreadCount: 0
  }
]

export const dashboardStats = {
  patient: {
    upcomingAppointments: 2,
    totalAppointments: 5,
    pendingBills: 1,
    unreadMessages: 0
  },
  doctor: {
    todayAppointments: 4,
    totalPatients: 45,
    pendingReports: 3,
    unreadMessages: 1
  },
  admin: {
    totalPatients: 156,
    todayAppointments: 12,
    pendingPayments: 8,
    monthlyRevenue: 45600
  }
}

export const appointmentSlots = [
  { time: '09:00 AM', available: true },
  { time: '09:30 AM', available: true },
  { time: '10:00 AM', available: false },
  { time: '10:30 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '11:30 AM', available: false },
  { time: '12:00 PM', available: true },
  { time: '02:00 PM', available: true },
  { time: '02:30 PM', available: false },
  { time: '03:00 PM', available: true },
  { time: '03:30 PM', available: true },
  { time: '04:00 PM', available: true },
  { time: '04:30 PM', available: false },
  { time: '05:00 PM', available: true }
]

export const treatmentTypes = [
  { id: 1, name: 'Check-up', duration: 30, price: 80 },
  { id: 2, name: 'Cleaning', duration: 45, price: 150 },
  { id: 3, name: 'Filling', duration: 60, price: 250 },
  { id: 4, name: 'Root Canal', duration: 90, price: 1200 },
  { id: 5, name: 'Crown', duration: 90, price: 1500 },
  { id: 6, name: 'Extraction', duration: 45, price: 300 },
  { id: 7, name: 'Whitening', duration: 60, price: 500 },
  { id: 8, name: 'Orthodontic Consultation', duration: 45, price: 150 },
  { id: 9, name: 'Gum Treatment', duration: 60, price: 400 },
  { id: 10, name: 'Emergency', duration: 30, price: 200 }
]

export const doctors = [
  {
    id: 2,
    name: 'Dr. Sunita Agarwalla',
    specialization: 'General Dentistry',
    license: 'DEN-12345',
    email: 'doctor@clinic.com',
    phone: '+1234567891',
    experience: '12 years',
    education: 'DDS, University of Dental Medicine',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workingHours: '9:00 AM - 5:00 PM'
  },
  {
    id: 5,
    name: 'Dr. Michael Johnson',
    specialization: 'Orthodontics',
    license: 'DEN-67890',
    email: 'dr.johnson@clinic.com',
    phone: '+1234567894',
    experience: '8 years',
    education: 'DDS, MSD Orthodontics',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    workingHours: '10:00 AM - 6:00 PM'
  }
]

export const notifications = [
  {
    id: 1,
    userId: 1,
    type: 'appointment',
    title: 'Upcoming Appointment Reminder',
    message: 'You have an appointment with Dr. Sunita Agarwalla tomorrow at 10:00 AM',
    timestamp: '2024-05-14T09:00:00',
    read: false,
    priority: 'high'
  },
  {
    id: 2,
    userId: 1,
    type: 'billing',
    title: 'Payment Confirmation',
    message: 'Your payment of $1,512.00 has been processed successfully',
    timestamp: '2024-05-20T14:30:00',
    read: true,
    priority: 'medium'
  },
  {
    id: 3,
    userId: 1,
    type: 'prescription',
    title: 'Prescription Reminder',
    message: 'Remember to complete your Amoxicillin course (3 days remaining)',
    timestamp: '2024-05-24T08:00:00',
    read: false,
    priority: 'high'
  },
  {
    id: 4,
    userId: 2,
    type: 'appointment',
    title: 'New Appointment Request',
    message: 'Jane Smith has requested an appointment for June 18th',
    timestamp: '2024-05-22T11:15:00',
    read: false,
    priority: 'medium'
  }
]

export const reportsData = {
  monthlyRevenue: [
    { month: 'Jan', revenue: 38000 },
    { month: 'Feb', revenue: 42000 },
    { month: 'Mar', revenue: 39500 },
    { month: 'Apr', revenue: 45000 },
    { month: 'May', revenue: 48000 },
    { month: 'Jun', revenue: 45600 }
  ],
  appointmentsByType: [
    { type: 'Check-up', count: 45 },
    { type: 'Treatment', count: 32 },
    { type: 'Consultation', count: 28 },
    { type: 'Emergency', count: 15 },
    { type: 'Follow-up', count: 20 }
  ],
  patientDemographics: [
    { ageGroup: '0-18', count: 25 },
    { ageGroup: '19-35', count: 48 },
    { ageGroup: '36-50', count: 52 },
    { ageGroup: '51-65', count: 31 },
    { ageGroup: '65+', count: 20 }
  ],
  treatmentSuccess: [
    { treatment: 'Root Canal', successRate: 95 },
    { treatment: 'Filling', successRate: 98 },
    { treatment: 'Extraction', successRate: 99 },
    { treatment: 'Crown', successRate: 96 },
    { treatment: 'Gum Treatment', successRate: 92 }
  ]
}

export const paymentMethods = [
  {
    id: 1,
    userId: 1,
    stripePaymentMethodId: 'pm_1234567890',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: '12',
    expiryYear: '2025',
    isDefault: true,
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    userId: 1,
    stripePaymentMethodId: 'pm_0987654321',
    brand: 'Mastercard',
    last4: '5555',
    expiryMonth: '08',
    expiryYear: '2026',
    isDefault: false,
    createdAt: '2024-03-20'
  },
  {
    id: 3,
    userId: 2,
    stripePaymentMethodId: 'pm_1122334455',
    brand: 'Amex',
    last4: '1234',
    expiryMonth: '06',
    expiryYear: '2025',
    isDefault: true,
    createdAt: '2024-02-10'
  }
]

export const paymentTransactions = [
  {
    id: 1,
    invoiceId: 1,
    userId: 1,
    amount: 1512,
    stripePaymentIntentId: 'pi_1234567890abcdef',
    stripeChargeId: 'ch_1234567890abcdef',
    paymentMethodId: 1,
    status: 'succeeded',
    currency: 'usd',
    description: 'Payment for Invoice INV-2024-001',
    receiptUrl: 'https://stripe.com/receipt/123',
    createdAt: '2024-05-20T14:30:00',
    metadata: {
      invoiceNumber: 'INV-2024-001',
      patientName: 'John Doe'
    },
    transactionId: 'txn_1234567890abcdef',
    cardLast4: '4242',
    installmentPlan: null
  },
  {
    id: 2,
    invoiceId: 2,
    userId: 2,
    amount: 323.4,
    stripePaymentIntentId: 'pi_0987654321fedcba',
    stripeChargeId: 'ch_0987654321fedcba',
    paymentMethodId: 3,
    status: 'succeeded',
    currency: 'usd',
    description: 'Payment for Invoice INV-2024-002',
    receiptUrl: 'https://stripe.com/receipt/456',
    createdAt: '2024-02-20T10:15:00',
    metadata: {
      invoiceNumber: 'INV-2024-002',
      patientName: 'Jane Smith'
    },
    transactionId: 'txn_0987654321fedcba',
    cardLast4: '1234',
    installmentPlan: null
  },
  {
    id: 3,
    invoiceId: 3,
    userId: 3,
    amount: 500,
    stripePaymentIntentId: 'pi_1122334455667788',
    stripeChargeId: 'ch_1122334455667788',
    paymentMethodId: null,
    status: 'succeeded',
    currency: 'usd',
    description: 'Partial payment for Invoice INV-2024-003',
    receiptUrl: 'https://stripe.com/receipt/789',
    createdAt: '2023-12-10T16:45:00',
    metadata: {
      invoiceNumber: 'INV-2024-003',
      patientName: 'Robert Johnson'
    },
    transactionId: null,
    cardLast4: null,
    installmentPlan: {
      enabled: true,
      totalPayments: 6,
      remainingPayments: 4,
      monthlyAmount: 192.6,
      nextDueDate: '2024-06-10'
    },
    transactionId: 'txn_1122334455667788',
    cardLast4: '4242',
    installmentPlan: null
  }
]

export const stripeCustomers = [
  {
    userId: 1,
    stripeCustomerId: 'cus_1234567890',
    email: 'patient@clinic.com',
    name: 'John Doe',
    createdAt: '2024-01-10'
  },
  {
    userId: 2,
    stripeCustomerId: 'cus_0987654321',
    email: 'jane@clinic.com',
    name: 'Jane Smith',
    createdAt: '2024-02-15'
  },
  {
    userId: 3,
    stripeCustomerId: 'cus_1122334455',
    email: 'robert.j@email.com',
    name: 'Robert Johnson',
    createdAt: '2024-03-20'
  }
]

export const refundRecords = [
  {
    id: 1,
    transactionId: 1,
    invoiceId: 1,
    userId: 1,
    amount: 150,
    stripeRefundId: 'rf_1234567890',
    reason: 'Duplicate charge',
    status: 'succeeded',
    requestedBy: 'admin',
    requestedAt: '2024-05-22T09:00:00',
    processedAt: '2024-05-22T09:05:00'
  }
]