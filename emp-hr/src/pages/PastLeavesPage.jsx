import { useState, useEffect } from 'react';
import { getPastLeaves } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';

const statusColors = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
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

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-400 mb-8">My Past Leaves</h1>
        {isLoading ? (
          <p>Loading leave details...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaves.map((leave) => (
                <div key={leave._id} className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="text-lg font-semibold">{new Date(leave.date).toLocaleDateString()}</p>
                      <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${statusColors[leave.status]}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{leave.duration === 1 ? 'Full Day' : 'Half Day'} - {leave.type}</p>
                    <p className="mt-4">{leave.reason}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-700 rounded-l-md hover:bg-gray-600 disabled:opacity-50">Previous</button>
              <span className="px-4 py-2 bg-gray-800">Page {currentPage} of {totalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-700 rounded-r-md hover:bg-gray-600 disabled:opacity-50">Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PastLeavesPage;
