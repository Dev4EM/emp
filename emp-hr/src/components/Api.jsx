import axios from 'axios';

// Base URL for all API requests
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // 🔁 change this to your backend base URL
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

// Auth APIs
export const loginUser = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  return response.data;
};
export const registerUser = async (userData) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};
export const getUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};
export const updateUser = async (userData) => {
  const response = await API.put('/auth/me/update', userData);
  return response.data;
};

// Employee APIs
export const getMyAttendance = async () => {
    const response = await API.get('/employee/my-attendance');
    return response.data;
};
export const getLeaveBalance = async () => {
    const response = await API.get('/employee/leave-balance');
    return response.data;
};
export const applyLeave = (leaveData) => API.post('/employee/apply-leave', leaveData);
export const getPastLeaves = async (page = 1, limit = 10) => {
    const response = await API.get(`/employee/past-leaves?page=${page}&limit=${limit}`);
    return response.data;
};
export const checkIn = async (locationData) => {
  const response = await API.post('/employee/check-in', {
    location: locationData,
  });
  return response.data;
};
export const checkOut = async (locationData) => {
  const response = await API.post('/employee/check-out', {
    location: locationData,
  });
  return response.data;
};

// Team Leader APIs
export const getTeamMembers = async () => {
  const response = await API.get('/teamleader/team-members');
  return response.data;
};
export const getPendingLeaves = async () => {
  const response = await API.get('/teamleader/pending-leaves');
  return response.data;
};
export const approveLeave = async (data) => {
  const response = await API.put('/teamleader/approve-leave', data);
  return response.data;
};
export const rejectLeave = async (data) => {
  const response = await API.put('/teamleader/reject-leave', data);
  return response.data;
};

// Admin APIs
export const getAllUsers = async () => {
  const response = await API.get('/admin/all-users');
  return response.data;
};
export const assignReportingManager = async (data) => {
  const response = await API.put('/admin/assign-reporting-manager', data);
  return response.data;
};

export default API;
