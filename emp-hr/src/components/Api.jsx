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
// In your Api.js file
export const updateUser = async (userId, userData) => {
  try {
    console.log('Updating user:', userId, 'with data:', userData); // Debug log
    
    const response = await API.put(`/admin/update-user/${userId}`, userData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
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
// Change password function
export const changePassword = async (passwordData) => {
  const response = await API.put('/auth/change-password', passwordData);
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
export const getTeamAttendance = async () => {
  const response = await API.get('/teamleader/team-attendance');
  return response.data;
};

export const getPendingLeaves = async () => {
  const response = await API.get('/teamleader/pending-leaves');
  return response.data;
};
export const approveLeave = async (employeeId, leaveId) => {
  try {
    const response = await API.put('/teamleader/approve-leave', {
      employeeId: employeeId,
      leaveId: leaveId
    });
    return response.data;
  } catch (error) {
    console.error('Approve leave error:', error);
    throw error;
  }
};
// Get all leaves (admin only)
export const getAllLeaves = async () => {
  const response = await API.get('/admin/all-leaves');
  return response.data;
};

export const rejectLeave = async (employeeId, leaveId, rejectionReason) => {
  try {
    const response = await API.put('/teamleader/reject-leave', {
      employeeId: employeeId,
      leaveId: leaveId,
      rejectionReason: rejectionReason || ''
    });
    return response.data;
  } catch (error) {
    console.error('Reject leave error:', error);
    throw error;
  }
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

export const getUserAttendance = async (userId) => {
  const response = await API.get(`/user/${userId}/attendance`);
  return response.data;
};

export const getUserLeaveBalance = async (userId) => {
  const response = await API.get(`/user/${userId}/leave-balance`);
  return response.data;
};

// Team Leader APIs
export const addEmployee = async (employeeData) => {
    const response = await API.post('/teamleader/add-employee', employeeData);
    return response.data;
};

export default API;
