import { useState, useEffect } from 'react';
import { getPastLeaves } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';

const statusColors = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

const typeColors = {
  paid: 'bg-blue-500',
  unpaid: 'bg-orange-500',
};

function PastLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeaves = async (page) => {
    setIsLoading(true);
    try {
      const response = await getPastLeaves(page);
      setLeaves(response.leaves || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.currentPage || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch leave details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatAppliedDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveStats = () => {
    const approved = leaves.filter(leave => leave.status === 'approved').length;
    const pending = leaves.filter(leave => leave.status === 'pending').length;
    const rejected = leaves.filter(leave => leave.status === 'rejected').length;
    const totalDays = leaves
      .filter(leave => leave.status === 'approved')
      .reduce((total, leave) => total + leave.duration, 0);

    return { approved, pending, rejected, totalDays };
  };

  const stats = getLeaveStats();

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-400 mb-4">My Past Leaves</h1>
          
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold">{leaves.length}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Days Taken</p>
              <p className="text-2xl font-bold text-blue-400">{stats.totalDays}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
          </div>
        ) : leaves.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Leave Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Type</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Duration</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Applied On</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-300">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {leaves.map((leave, index) => (
                      <tr key={leave._id} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <CalendarTodayIcon className="w-4 h-4 mr-2 text-emerald-400" />
                            <span className="font-medium">{formatDate(leave.date)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${typeColors[leave.type] || 'bg-gray-500'}`}>
                            {leave.type?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <AccessTimeIcon className="w-4 h-4 mr-2 text-blue-400" />
                            <span>{leave.duration === 1 ? 'Full Day' : 'Half Day'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${statusColors[leave.status] || 'bg-gray-500'}`}>
                            {leave.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {leave.appliedOn ? formatAppliedDate(leave.appliedOn) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-300 max-w-xs truncate" title={leave.reason}>
                            {leave.reason || 'No reason provided'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4 mb-8">
              {leaves.map((leave) => (
                <div key={leave._id} className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <CalendarTodayIcon className="w-5 h-5 mr-2 text-emerald-400" />
                      <h3 className="text-lg font-semibold">{formatDate(leave.date)}</h3>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${statusColors[leave.status]}`}>
                      {leave.status?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Type:</span>
                      <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${typeColors[leave.type] || 'bg-gray-500'}`}>
                        {leave.type?.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Duration:</span>
                      <div className="flex items-center">
                        <AccessTimeIcon className="w-4 h-4 mr-1 text-blue-400" />
                        <span className="text-sm">{leave.duration === 1 ? 'Full Day' : 'Half Day'}</span>
                      </div>
                    </div>
                    
                    {leave.appliedOn && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Applied On:</span>
                        <span className="text-sm">{formatAppliedDate(leave.appliedOn)}</span>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-1">Reason:</p>
                      <p className="text-sm bg-gray-700 p-3 rounded">
                        {leave.reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="px-4 py-2 bg-gray-700 text-white rounded-l-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded transition-colors ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="px-4 py-2 bg-gray-700 text-white rounded-r-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <CalendarTodayIcon style={{ fontSize: 80 }} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Leave Records Found</h3>
            <p className="text-gray-500">You haven't applied for any leaves yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PastLeavesPage;
