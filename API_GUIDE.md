# Creadent Dental Clinic - API Guide

## 📋 Overview

This project uses a **dual API approach**:
- **GraphQL** (for complex queries and mutations)
- **REST API** (for simple operations, better caching, and scalability)

---

## 🚀 Frontend API Service (Easy to Use!)

We've created a centralized API service at `frontend/src/services/apiService.js` that makes API calls **super easy**!

### Basic Usage:

```jsx
import apiService from './services/apiService';

// Login
const loginUser = async () => {
  try {
    const result = await apiService.auth.login('phone', 'password');
    console.log('Logged in:', result);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Get all patients
const getPatients = async () => {
  try {
    const result = await apiService.patients.getAll(1, 10, 'search-term');
    console.log('Patients:', result);
  } catch (error) {
    console.error('Failed to get patients:', error);
  }
};

// Create appointment
const createAppointment = async (data) => {
  try {
    const result = await apiService.appointments.create(data);
    console.log('Appointment created:', result);
  } catch (error) {
    console.error('Failed to create appointment:', error);
  }
};
```

### Available Services:

1. **auth** - Authentication operations
2. **patients** - Patient management
3. **doctors** - Doctor management
4. **appointments** - Appointment management
5. **medicines** - Medicine inventory
6. **prescriptions** - Prescription management
7. **medicalRecords** - Medical records
8. **invoices** - Billing and invoices
9. **paymentLedger** - Payment tracking
10. **dashboard** - Dashboard stats and reports
11. **chat** - Messaging system
12. **notifications** - Notifications

---

## 🏗️ Backend Setup

### Environment Variables

Create a `.env` file in the backend folder (use `.env.example` as reference):

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/creadent-dental-clinic
JWT_SECRET=your-super-secret-jwt-key-here
```

### Running the Backend:

```bash
cd backend
npm install
npm run dev
```

The server will be available at:
- **REST API**: http://localhost:5000/api
- **GraphQL**: http://localhost:5000/graphql
- **Health Check**: http://localhost:5000/health

---

## ⚡ Scalability Optimizations

The backend is optimized to handle **10,000+ concurrent users** with:

1. **MongoDB Connection Pool**: 10-100 connections
2. **CORS Configuration**: Production-ready
3. **Increased Payload Limit**: 10MB for larger data
4. **GraphQL Caching**: Built-in cache control
5. **Health Check Endpoint**: For load balancers
6. **Error Handling**: Centralized error management
7. **Socket.io**: Real-time communication

---

## 📡 API Endpoints

### REST API - Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Login user |
| POST | `/api/register` | Register new user |
| POST | `/api/forgot-password` | Request OTP for password reset |
| POST | `/api/reset-password` | Reset password with OTP |
| GET | `/api/me` | Get current user info |

### GraphQL

Visit http://localhost:5000/graphql for the GraphQL playground and complete schema documentation!

---

## 🎯 Quick Start Guide

### Frontend:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Backend:
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB URI
npm run dev
```

---

## 💡 Key Improvements

1. **Centralized API**: All API calls from one place
2. **Type Safety**: Clear service structure
3. **Error Handling**: Built-in error management
4. **Logging**: Request/response logging
5. **Auto-redirect**: 401 errors redirect to login
6. **Environment Variables**: Easy configuration
7. **REST + GraphQL**: Best of both worlds
