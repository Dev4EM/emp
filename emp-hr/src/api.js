const API_BASE_URL = 'http://localhost:5000/api';

// This function will handle the actual API request logic
const request = async (endpoint, options) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred with the API request.');
  }
  
  return data;
};

const api = {
  loginUser: async (credentials) => {
    return request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
  },

  // You can add more API functions here later
  // For example:
  // getProfile: async (token) => {
  //   return request('/user/profile', {
  //     headers: { 'Authorization': `Bearer ${token}` }
  //   });
  // }
};

export default api;
