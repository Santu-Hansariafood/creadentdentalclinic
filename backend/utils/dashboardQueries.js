const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getTodayDateString = () => new Date().toISOString().split("T")[0];

async function fetchAdminStats() {
  const Patient = require("../models/Patient");
  const Appointment = require("../models/Appointment");
  const Invoice = require("../models/Invoice");

  const { start, end } = getTodayRange();

  const [totalPatients, todayAppointments, pendingPayments, revenueAgg] =
    await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments({ date: { $gte: start, $lte: end } }),
      Invoice.countDocuments({ balance: { $gt: 0 } }),
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);

  const monthlyRevenue = revenueAgg[0]?.total ?? 0;

  return {
    totalPatients,
    todayAppointments,
    pendingPayments,
    monthlyRevenue,
  };
}

async function fetchReportsData() {
  const Appointment = require("../models/Appointment");
  const Invoice = require("../models/Invoice");
  const Patient = require("../models/Patient");
  const MedicalRecord = require("../models/MedicalRecord");

  const [revenueByMonth, appointmentsByTypeAgg, patients, treatmentAgg] =
    await Promise.all([
      Invoice.aggregate([
        { $match: { date: { $type: "date" } } },
        {
          $group: {
            _id: { $month: "$date" },
            revenue: { $sum: "$total" },
          },
        },
      ]),
      Appointment.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $project: { _id: 0, type: "$_id", count: 1 } },
      ]),
      Patient.find({}, { dateOfBirth: 1 }).lean(),
      MedicalRecord.aggregate([
        { $match: { diagnosis: { $exists: true, $nin: [null, ""] } } },
        {
          $group: {
            _id: "$diagnosis",
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

  const revenueMap = Object.fromEntries(
    revenueByMonth.map((row) => [row._id, row.revenue]),
  );
  const monthlyRevenue = MONTH_LABELS.map((month, index) => ({
    month,
    revenue: revenueMap[index + 1] || 0,
  }));

  const appointmentsByType = appointmentsByTypeAgg.map((row) => ({
    type: row.type || "Unknown",
    count: row.count,
  }));

  const ageGroups = {
    "0-18": 0,
    "19-35": 0,
    "36-50": 0,
    "51-65": 0,
    "65+": 0,
  };

  const today = new Date();
  patients.forEach((patient) => {
    if (!patient.dateOfBirth) return;
    const dob = new Date(patient.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return;

    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age <= 18) ageGroups["0-18"]++;
    else if (age <= 35) ageGroups["19-35"]++;
    else if (age <= 50) ageGroups["36-50"]++;
    else if (age <= 65) ageGroups["51-65"]++;
    else ageGroups["65+"]++;
  });

  const patientDemographics = Object.entries(ageGroups).map(([ageGroup, count]) => ({
    ageGroup,
    count,
  }));

  const treatmentSuccess = treatmentAgg.map((row) => ({
    treatment: row._id || "General Treatment",
    successRate: 100,
  }));

  return {
    monthlyRevenue,
    appointmentsByType,
    patientDemographics,
    treatmentSuccess,
  };
}

async function fetchPatientStats(userId) {
  const Appointment = require("../models/Appointment");
  const Invoice = require("../models/Invoice");
  const ChatMessage = require("../models/ChatMessage");

  const { start } = getTodayRange();

  const [upcomingAppointments, totalAppointments, pendingBills, unreadMessages] =
    await Promise.all([
      Appointment.countDocuments({
        patientId: userId,
        date: { $gte: start },
        status: "Scheduled",
      }),
      Appointment.countDocuments({ patientId: userId }),
      Invoice.countDocuments({ patientId: userId, balance: { $gt: 0 } }),
      ChatMessage.countDocuments({ receiverId: userId, read: false }),
    ]);

  return {
    upcomingAppointments,
    totalAppointments,
    pendingBills,
    unreadMessages,
  };
}

async function fetchDoctorStats(userId) {
  const Appointment = require("../models/Appointment");
  const MedicalRecord = require("../models/MedicalRecord");
  const ChatMessage = require("../models/ChatMessage");

  const { start, end } = getTodayRange();

  const [todayAppointments, doctorPatients, pendingReports, unreadMessages] =
    await Promise.all([
      Appointment.countDocuments({
        doctorId: userId,
        date: { $gte: start, $lte: end },
      }),
      Appointment.distinct("patientId", { doctorId: userId }).then((ids) => ids.length),
      MedicalRecord.countDocuments({
        doctorId: userId,
        diagnosis: { $exists: false },
      }),
      ChatMessage.countDocuments({ receiverId: userId, read: false }),
    ]);

  return {
    todayAppointments,
    totalPatients: doctorPatients,
    pendingReports,
    unreadMessages,
  };
}

async function fetchRecentActivities(limit = 10) {
  const Patient = require("../models/Patient");
  const Appointment = require("../models/Appointment");
  const Prescription = require("../models/Prescription");
  const Medicine = require("../models/Medicine");
  const MedicalRecord = require("../models/MedicalRecord");
  const Invoice = require("../models/Invoice");
  const PaymentLedger = require("../models/PaymentLedger");

  const [
    patients,
    appointments,
    prescriptions,
    medicines,
    medicalRecords,
    invoices,
    paymentLedgers,
  ] = await Promise.all([
    Patient.find().sort({ createdAt: -1 }).limit(limit).lean(),
    Appointment.find().sort({ createdAt: -1 }).limit(limit).lean(),
    Prescription.find().sort({ createdAt: -1 }).limit(limit).lean(),
    Medicine.find().sort({ createdAt: -1 }).limit(limit).lean(),
    MedicalRecord.find().sort({ createdAt: -1 }).limit(limit).lean(),
    Invoice.find().sort({ createdAt: -1 }).limit(limit).lean(),
    PaymentLedger.find().sort({ createdAt: -1 }).limit(limit).lean(),
  ]);

  const activities = [
    ...patients.map((p) => ({
      id: p._id.toString(),
      type: "patient",
      action: "New patient registered",
      user: p.name,
      timestamp: p.createdAt,
    })),
    ...appointments.map((a) => ({
      id: a._id.toString(),
      type: "appointment",
      action: "Appointment scheduled",
      user: a.patientName,
      timestamp: a.createdAt,
    })),
    ...prescriptions.map((p) => ({
      id: p._id.toString(),
      type: "prescription",
      action: "New prescription created",
      user: p.patientName,
      timestamp: p.createdAt,
    })),
    ...medicines.map((m) => ({
      id: m._id.toString(),
      type: "medicine",
      action: "New medicine added",
      user: m.name,
      timestamp: m.createdAt,
    })),
    ...medicalRecords.map((r) => ({
      id: r._id.toString(),
      type: "medical_record",
      action: "Medical record updated",
      user: r.patientName,
      timestamp: r.createdAt,
    })),
    ...invoices.map((i) => ({
      id: i._id.toString(),
      type: "invoice",
      action: "Invoice generated",
      user: i.patientName,
      timestamp: i.createdAt,
    })),
    ...paymentLedgers.map((l) => ({
      id: l._id.toString(),
      type: "payment",
      action: "Payment ledger entry added",
      user: l.lorryNo,
      timestamp: l.createdAt,
    })),
  ];

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities.slice(0, limit);
}

async function fetchDashboardStatsForUser(user) {
  const role = user.role;

  if (role === "admin" || role === "employee") {
    return {
      patient: null,
      doctor: null,
      admin: await fetchAdminStats(),
    };
  }

  if (role === "doctor") {
    return {
      patient: null,
      admin: null,
      doctor: await fetchDoctorStats(user._id),
    };
  }

  if (role === "patient") {
    return {
      admin: null,
      doctor: null,
      patient: await fetchPatientStats(user._id),
    };
  }

  return { patient: null, doctor: null, admin: null };
}

module.exports = {
  fetchAdminStats,
  fetchReportsData,
  fetchDashboardStatsForUser,
  fetchRecentActivities,
  getTodayRange,
};
