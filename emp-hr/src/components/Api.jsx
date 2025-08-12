import axios from 'axios';

// Base URL for all API requests
const API = axios.create({
  baseURL: 'http://empbackend.esromagica.com/api', // 🔁 change this to your backend base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add auth token to every request (if needed)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // 🔐 get token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // ✅ attach token
  }
  return config;
});
// ----------------- API FUNCTIONS ------------------

// Example: Login
export const loginUser = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  return response.data; // returns { token, user, ... }
};
export const getUser = async (credentials) => {
  const response = await API.get('/auth/me', credentials);
  return response.data; // returns { token, user, ... }
};
export const checkIn = async (locationData) => {
  const response = await API.post('/employee/check-in', {
    checkInLocation: locationData,
  });
  return response.data; // contains attendance and message
};
export const checkOut = async (locationData) => {
  const response = await API.post('/employee/check-out', {
    checkOutLocation: locationData,
  });
  return response.data; // contains updated attendance and message
};
// Example: Get Attendance
export const getAttendance = (userId) => API.get(`/attendance/${userId}`);

// Example: Mark Attendance
export const markAttendance = (data) => API.post('/attendance', data);

// Example: Apply for Leave
export const applyLeave = (leaveData) => API.post('/leave/apply', leaveData);

// Add more APIs as needed...

export default API;
