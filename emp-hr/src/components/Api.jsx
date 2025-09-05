import axios from 'axios';

// Base URL for all API requests
const API = axios.create({
  // baseURL: 'http://localhost:5000/api', // 🔁 change this to your backend base URL
  baseURL: 'https://api.empeople.esromagica.in/api', // 🔁 change this to your backend base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
const handleApiRequest = async (apiCall) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An unexpected error occurred';
    
    console.error('API Error:', errorMessage);
    throw new Error(errorMessage);
  }
};

// Notification APIs
export const createNotification = async (notificationData) => {
  return handleApiRequest(() => API.post('/notifications', notificationData));
};

export const getUserNotifications = async (userId) => {
  return handleApiRequest(() => API.get(`/notifications/user/${userId}`));
};

export const markNotificationAsRead = async (notificationId) => {
  return handleApiRequest(() => API.put(`/notifications/${notificationId}/read`));
};

export const deleteNotification = async (notificationId) => {
  return handleApiRequest(() => API.delete(`/notifications/${notificationId}`));
};

// ----------------- API FUNCTIONS ------------------
// Replace the URL return functions with actual API calls
export const downloadAllAttendanceCSV = async () => {
  try {
    const response = await API.get('/admin/attendance/all/csv', {
      responseType: 'blob', // Important for file downloads
      headers: {
        'Accept': 'text/csv'
      }
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all_employees_attendance.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download attendance CSV');
  }
};

// Replace the URL return function with actual API call
export const downloadEmployeeAttendanceCSV = async (employeeId) => {
  try {
    const response = await API.get(`/admin/attendance/${employeeId}/csv`, {
      responseType: 'blob', // Important for file downloads
      headers: {
        'Accept': 'text/csv'
      }
    });
    
    // Extract filename from response headers if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = `employee_attendance.csv`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[18];
      }
    }
    
    // Create blob and trigger download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download employee attendance CSV');
  }
};

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
export const cancelLeave = async (leaveToCancel, leaves, setLeaves, closeCancelModal, toast) => {
  const response = await API.delete(`/employee/delete-leave/${leaveToCancel}`);
  console.log('Cancel leave response:', response); // Debug log
  return response.data;
}
 
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

export const getDepartmentLeaves = async () => {
  const response = await API.get('/teamleader/department-leaves');
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
