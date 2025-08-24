import { useState, useEffect } from 'react';
import { getAllLeaves, approveLeave, rejectLeave } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import Modal from '../components/Modal';

function AllLeavesPage() {
  const [allLeaves, setAllLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingLeaves, setProcessingLeaves] = useState(new Set());

  const fetchAllLeaves = async () => {
    try {
      const response = await getAllLeaves();
      console.log('All leaves response:', response);
      
      const leaves = response.leaves || response;
      setAllLeaves(leaves);
      setFilteredLeaves(leaves);
    } catch (err) {
      console.error('Error fetching all leaves:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch leaves.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  // Filter leaves based on selected criteria
  useEffect(() => {
    let filtered = allLeaves;
    
    // Filter by department
    if (filterDepartment !== 'All') {
      filtered = filtered.filter(leave => leave.department === filterDepartment);
    }
    
    // Filter by month
    if (filterMonth !== 'All') {
      const now = new Date();
      let targetMonth;
      
      switch (filterMonth) {
        case 'this_month':
          targetMonth = now;
          break;
        case 'last_month':
          targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'last_3_months':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          filtered = filtered.filter(leave => {
            const leaveDate = new Date(leave.date);
            return leaveDate >= threeMonthsAgo;
          });
          break;
        default:
          break;
      }
      
      if (filterMonth === 'this_month' || filterMonth === 'last_month') {
        const monthStart = startOfMonth(targetMonth);
        const monthEnd = endOfMonth(targetMonth);
        
        filtered = filtered.filter(leave => {
          const leaveDate = new Date(leave.date);
          return isWithinInterval(leaveDate, { start: monthStart, end: monthEnd });
        });
      }
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(leave => leave.status === filterStatus);
    }
    
    setFilteredLeaves(filtered);
  }, [allLeaves, filterDepartment, filterMonth, filterStatus]);

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
      await approveLeave(selectedLeave.employeeId, selectedLeave.leaveId);
      toast.success(`Leave approved for ${selectedLeave.employeeName}!`);
      await fetchAllLeaves();
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
      await rejectLeave(selectedLeave.employeeId, selectedLeave.leaveId, rejectionReason);
      toast.success(`Leave rejected for ${selectedLeave.employeeName}!`);
      await fetchAllLeaves();
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
      return new Date(dateString).toLocaleDateString();
    }
  };

  const getLeaveTypeColor = (type) => {
    return type === 'paid' ? 'bg-emerald-500' : 'bg-orange-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <CancelIcon className="w-4 h-4" />;
      case 'pending':
        return <PendingIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStats = () => {
    const total = filteredLeaves.length;
    const approved = filteredLeaves.filter(leave => leave.status === 'approved').length;
    const rejected = filteredLeaves.filter(leave => leave.status === 'rejected').length;
    const pending = filteredLeaves.filter(leave => leave.status === 'pending').length;
    const totalDays = filteredLeaves.reduce((sum, leave) => sum + leave.duration, 0);
    
    return { total, approved, rejected, pending, totalDays };
  };

  const departments = ['All', ...new Set(allLeaves.map(leave => leave.department).filter(Boolean))];
  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
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
                  <span className="text-gray-400">Department:</span>
                  <span className="font-medium">{selectedLeave.department}</span>
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
          </div>
        )}
      </Modal>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            All Leaves Management
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Complete overview and management of all employee leave requests
          </p>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUpIcon className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircleIcon className="text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <PendingIcon className="text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <CancelIcon className="text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <AccessTimeIcon className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Days</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalDays}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Section */}
        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <FilterListIcon className="text-purple-400" />
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Department Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              {/* Time Period Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Time Period</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All Time</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="last_3_months">Last 3 Months</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Leaves Table */}
        {filteredLeaves.length === 0 ? (
          <div className="text-center py-16">
            <WorkIcon style={{ fontSize: 80 }} className="text-gray-600 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">No Leaves Found</h3>
            <p className="text-gray-500">No leaves match your current filter criteria.</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Leave Details</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Applied Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredLeaves.map((leave) => (
                    <tr key={`${leave.employeeId}-${leave.leaveId}`} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-500/20 rounded-full">
                            <PersonIcon className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{leave.employeeName}</p>
                            <p className="text-sm text-gray-400">{leave.department}</p>
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
                          {leave.appliedOn ? formatDate(leave.appliedOn) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(leave.status)}`}>
                          {getStatusIcon(leave.status)}
                          <span className="capitalize">{leave.status}</span>
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
                          {leave.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => openConfirmationModal(leave, 'approve')}
                                disabled={processingLeaves.has(leave.leaveId)}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center space-x-1 text-sm"
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
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center space-x-1 text-sm"
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
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">
                              {leave.status === 'approved' ? '✅ Processed' : '❌ Processed'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllLeavesPage;
