import React, { useState, useEffect } from 'react';
import { createNotification, getAllUsers } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ManageAppPage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'system',
    priority: 'normal',
    isGlobal: false,
    expiresAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await getAllUsers();
      setEmployees(response.users || response);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp._id));
    }
    setSelectAll(!selectAll);
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
    setSelectAll(false);
  };

  const resetForm = () => {
    setNotificationData({
      title: '',
      message: '',
      type: 'system',
      priority: 'normal',
      isGlobal: false,
      expiresAt: ''
    });
    setSelectedEmployees([]);
    setSelectAll(false);
  };

  // 🔔 CREATE GLOBAL NOTIFICATION FUNCTION
  const createGlobalNotification = async () => {
    try {
      await createNotification({
        title: notificationData.title || "System Maintenance",
        message: notificationData.message || "The system will be down for maintenance on Sunday.",
        isGlobal: true,
        type: notificationData.type || "announcement",
        priority: notificationData.priority || "high"
      });
      toast.success("Notification sent to all users!");
    } catch (error) {
      toast.error("Failed to send notification");
    }
  };

  // 🎯 CREATE TARGETED NOTIFICATION FUNCTION
  const createUserNotification = async (userId) => {
    try {
      await createNotification({
        title: notificationData.title || "Welcome!",
        message: notificationData.message || "Welcome to the EM People platform!",
        recipient: userId,
        type: notificationData.type || "welcome",
        priority: notificationData.priority || "normal"
      });
      toast.success("Welcome notification sent!");
    } catch (error) {
      toast.error("Failed to send notification");
    }
  };

  // 📤 MAIN SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!notificationData.title.trim() || !notificationData.message.trim()) {
      toast.error('Please provide both title and message');
      return;
    }

    if (!notificationData.isGlobal && selectedEmployees.length === 0) {
      toast.error('Please select at least one employee or choose to send to all');
      return;
    }

    setLoading(true);
    
    try {
      if (notificationData.isGlobal) {
        // Send global notification using the function
        await createGlobalNotification();
      } else {
        // Send individual notifications to selected employees
        const promises = selectedEmployees.map(employeeId =>
          createUserNotification(employeeId)
        );
        
        await Promise.all(promises);
        toast.success(`Notification sent to ${selectedEmployees.length} employee(s)!`);
      }

      resetForm();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 QUICK ACTION FUNCTIONS FOR TESTING
  const sendTestGlobalNotification = async () => {
    try {
      await createNotification({
        title: "🧪 Test Global Notification",
        message: "This is a test global notification to all users!",
        isGlobal: true,
        type: "system",
        priority: "normal"
      });
      toast.success("Test global notification sent!");
    } catch (error) {
      toast.error("Failed to send test notification");
    }
  };

  const sendWelcomeNotification = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee first');
      return;
    }

    try {
      const promises = selectedEmployees.map(employeeId =>
        createNotification({
          title: "🎉 Welcome to EM People!",
          message: "Welcome to the EM People platform! We're excited to have you on board.",
          recipient: employeeId,
          type: "welcome",
          priority: "normal"
        })
      );
      
      await Promise.all(promises);
      toast.success(`Welcome notifications sent to ${selectedEmployees.length} employee(s)!`);
    } catch (error) {
      toast.error("Failed to send welcome notifications");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <ToastContainer theme="light" position="top-right" />
      
      <div className="container mx-auto px-4 sm:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <NotificationsIcon className="text-blue-600 mr-3" fontSize="large" />
            Send Notifications
          </h1>
          <p className="text-lg text-gray-600">
            Send announcements and updates to your team members
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Notification Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center">
              <SendIcon className="text-green-600 mr-2" />
              Create Notification
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={notificationData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter notification title..."
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content *
                </label>
                <textarea
                  name="message"
                  value={notificationData.message}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                  placeholder="Enter your message here..."
                  required
                />
                <div className="text-right text-xs text-gray-500 mt-2">
                  {notificationData.message.length}/500 characters
                </div>
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    name="type"
                    value={notificationData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="system">🔧 System</option>
                    <option value="announcement">📢 Announcement</option>
                    <option value="update">📋 Update</option>
                    <option value="meeting">📅 Meeting</option>
                    <option value="reminder">⏰ Reminder</option>
                    <option value="welcome">👋 Welcome</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={notificationData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">🔵 Low</option>
                    <option value="normal">🟡 Normal</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              {/* Global Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center">
                  <PublicIcon className="text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">Send to Everyone</p>
                    <p className="text-sm text-gray-600">Make this a global notification for all users</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isGlobal"
                    checked={notificationData.isGlobal}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="expiresAt"
                  value={notificationData.expiresAt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for permanent notification
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2" />
                    Send Notification
                  </>
                )}
              </button>
            </form>

            {/* Quick Action Buttons */}
            <div className="mt-6 space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-3">Quick Actions:</div>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={sendTestGlobalNotification}
                  className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  🧪 Send Test Global Notification
                </button>
                <button
                  onClick={sendWelcomeNotification}
                  className="w-full bg-purple-100 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                >
                  🎉 Send Welcome to Selected Users
                </button>
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-700 flex items-center">
                <PeopleIcon className="text-blue-600 mr-2" />
                Select Recipients
              </h2>
              {!notificationData.isGlobal && (
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {selectedEmployees.length} selected
                </div>
              )}
            </div>

            {notificationData.isGlobal ? (
              <div className="text-center py-12">
                <PublicIcon className="text-blue-400 mb-4" style={{ fontSize: '4rem' }} />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Global Notification Enabled
                </p>
                <p className="text-gray-600">
                  This notification will be sent to all users in the system
                </p>
              </div>
            ) : (
              <>
                {/* Selection Controls */}
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </button>
                  
                  {selectedEmployees.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      <CancelIcon className="w-4 h-4 mr-2" />
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Employee List */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {employeesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading employees...</p>
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No employees found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {employees.map((employee) => (
                        <div
                          key={employee._id}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedEmployees.includes(employee._id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => handleEmployeeSelection(employee._id)}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee._id)}
                              onChange={() => handleEmployeeSelection(employee._id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {employee['First name']} {employee['Last name']}
                              </p>
                              <div className="text-sm text-gray-600 flex items-center gap-4">
                                <span>{employee['Work email']}</span>
                                {employee.userType && (
                                  <span className="px-2 py-1 bg-gray-200 rounded-full text-xs capitalize">
                                    {employee.userType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary Card */}
        {(notificationData.title || notificationData.message) && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <CheckCircleIcon className="text-green-600 mr-2" />
                Notification Preview
              </h3>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {notificationData.title || 'Notification Title'}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    notificationData.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    notificationData.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    notificationData.priority === 'normal' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {notificationData.priority}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">
                  {notificationData.message || 'Your notification message will appear here...'}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  {notificationData.isGlobal ? (
                    <span>📢 Global notification • All users</span>
                  ) : (
                    <span>👥 Targeted notification • {selectedEmployees.length} recipient(s)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAppPage;
