import { useState, useEffect } from 'react';
import { getPendingLeaves, approveLeave, rejectLeave } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format, parseISO } from 'date-fns';
import Modal from '../components/Modal';

function PendingLeavesPage() {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [processingLeaves, setProcessingLeaves] = useState(new Set());

  const fetchPendingLeaves = async () => {
    try {
      const response = await getPendingLeaves();
      console.log('Pending leaves response:', response);
      setPendingLeaves(response);
      setFilteredLeaves(response);
    } catch (err) {
      console.error('Error fetching pending leaves:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch pending leaves.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  // Filter leaves based on type
  useEffect(() => {
    if (filterType === 'all') {
      setFilteredLeaves(pendingLeaves);
    } else {
      setFilteredLeaves(pendingLeaves.filter(leave => leave.type === filterType));
    }
  }, [pendingLeaves, filterType]);

  const openConfirmationModal = (leave, action) => {
    setSelectedLeave(leave);
    setActionType(action);
    setIsModalOpen(true);
    setRejectionReason('');
  };

 const handleApprove = async () => {
  if (!selectedLeave) return;
  
  setProcessingLeaves(prev => new Set(prev).add(selectedLeave.leaveId));
  setIsModalOpen(false);
  
  try {
    // Pass individual parameters, not an object
    await approveLeave(selectedLeave.employeeId, selectedLeave.leaveId);
    toast.success(`Leave approved for ${selectedLeave.employeeName}!`);
    await fetchPendingLeaves();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to approve leave.');
  } finally {
    setProcessingLeaves(prev => {
      const newSet = new Set(prev);
      newSet.delete(selectedLeave.leaveId);
      return newSet;
    });
  }
};

const handleReject = async () => {
  if (!selectedLeave) return;
  
  setProcessingLeaves(prev => new Set(prev).add(selectedLeave.leaveId));
  setIsModalOpen(false);
  
  try {
    // Pass individual parameters, not an object
    await rejectLeave(selectedLeave.employeeId, selectedLeave.leaveId, rejectionReason);
    toast.success(`Leave rejected for ${selectedLeave.employeeName}!`);
    await fetchPendingLeaves();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to reject leave.');
  } finally {
    setProcessingLeaves(prev => {
      const newSet = new Set(prev);
      newSet.delete(selectedLeave.leaveId);
      return newSet;
    });
  }
};

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'EEE, MMM dd, yyyy');
    } catch {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatAppliedDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, HH:mm');
    } catch {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getLeaveTypeColor = (type) => {
    return type === 'paid' ? 'bg-emerald-500' : 'bg-orange-500';
  };

  const getStats = () => {
    const total = pendingLeaves.length;
    const paid = pendingLeaves.filter(leave => leave.type === 'paid').length;
    const unpaid = pendingLeaves.filter(leave => leave.type === 'unpaid').length;
    const totalDays = pendingLeaves.reduce((sum, leave) => sum + leave.duration, 0);
    
    return { total, paid, unpaid, totalDays };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <ToastContainer theme="dark" position="top-right" />
      
      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={actionType === 'approve' ? handleApprove : handleReject}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request`}
      >
        {selectedLeave && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-600">
              <h4 className="text-lg font-semibold mb-4 text-emerald-400">Leave Request Details</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Employee:</span>
                  <span className="font-medium">{selectedLeave.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="font-medium">{formatDate(selectedLeave.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className={`px-2 py-1 rounded text-white text-xs ${getLeaveTypeColor(selectedLeave.type)}`}>
                    {selectedLeave.type?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium">{selectedLeave.duration === 1 ? 'Full Day' : 'Half Day'}</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-300 mb-2">Reason:</p>
                <p className="text-sm">{selectedLeave.reason}</p>
              </div>
            </div>
            
            {actionType === 'reject' && (
              <div>
                <label className="block text-sm font-medium mb-2">Rejection Reason (Optional)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide reason for rejection..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows="3"
                />
              </div>
            )}
            
            <div className="text-center">
              <p className={`text-lg font-medium ${actionType === 'approve' ? 'text-green-400' : 'text-red-400'}`}>
                Are you sure you want to {actionType} this leave request?
              </p>
            </div>
          </div>
        )}
      </Modal>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Pending Leave Requests
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Review and manage your team's leave applications
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <PendingIcon className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Pending</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircleIcon className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Paid Leaves</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.paid}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <CancelIcon className="text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Unpaid Leaves</p>
                <p className="text-2xl font-bold text-orange-400">{stats.unpaid}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUpIcon className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Days</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalDays}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <FilterListIcon className="text-emerald-400" />
              <h3 className="text-lg font-semibold">Filter Requests</h3>
            </div>
            
            <div className="flex space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="paid">Paid Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="text-center py-16">
            <PendingIcon style={{ fontSize: 80 }} className="text-gray-600 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">No Pending Leave Requests</h3>
            <p className="text-gray-500">All caught up! There are no pending leave requests to review.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Desktop View */}
            <div className="hidden lg:block">
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Leave Details</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Applied</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {filteredLeaves.map((leave) => (
                        <tr key={leave.leaveId} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-emerald-500/20 rounded-full">
                                <PersonIcon className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{leave.employeeName}</p>
                                <p className="text-sm text-gray-400">{leave.employeeEmail}</p>
                                <p className="text-xs text-gray-500">{leave.employeeCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <CalendarTodayIcon className="w-4 h-4 text-blue-400" />
                                <span className="font-medium">{formatDate(leave.date)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <AccessTimeIcon className="w-4 h-4 text-green-400" />
                                <span className="text-sm">{leave.duration === 1 ? 'Full Day' : 'Half Day'}</span>
                              </div>
                              <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${getLeaveTypeColor(leave.type)}`}>
                                {leave.type?.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-400">
                              {formatAppliedDate(leave.appliedOn)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-300 truncate" title={leave.reason}>
                                {leave.reason}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => openConfirmationModal(leave, 'approve')}
                                disabled={processingLeaves.has(leave.leaveId)}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-1"
                              >
                                {processingLeaves.has(leave.leaveId) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <>
                                    <CheckCircleIcon className="w-4 h-4" />
                                    <span>Approve</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => openConfirmationModal(leave, 'reject')}
                                disabled={processingLeaves.has(leave.leaveId)}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-1"
                              >
                                {processingLeaves.has(leave.leaveId) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <>
                                    <CancelIcon className="w-4 h-4" />
                                    <span>Reject</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden space-y-4">
              {filteredLeaves.map((leave) => (
                <div key={leave.leaveId} className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
                  {/* Employee Info */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-full">
                      <PersonIcon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{leave.employeeName}</p>
                      <p className="text-sm text-gray-400">{leave.employeeEmail}</p>
                    </div>
                  </div>

                  {/* Leave Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CalendarTodayIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-400">Date:</span>
                      </div>
                      <span className="font-medium">{formatDate(leave.date)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AccessTimeIcon className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Duration:</span>
                      </div>
                      <span className="font-medium">{leave.duration === 1 ? 'Full Day' : 'Half Day'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Type:</span>
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getLeaveTypeColor(leave.type)}`}>
                        {leave.type?.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-3">
                      <div className="flex items-start space-x-2">
                        <DescriptionIcon className="w-4 h-4 text-orange-400 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-400">Reason:</span>
                          <p className="text-sm text-gray-300 mt-1">{leave.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openConfirmationModal(leave, 'approve')}
                      disabled={processingLeaves.has(leave.leaveId)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      {processingLeaves.has(leave.leaveId) ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openConfirmationModal(leave, 'reject')}
                      disabled={processingLeaves.has(leave.leaveId)}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      {processingLeaves.has(leave.leaveId) ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CancelIcon className="w-5 h-5" />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PendingLeavesPage;
