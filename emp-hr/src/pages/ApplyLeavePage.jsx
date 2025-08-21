import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { applyLeave } from '../components/Api'; // Assuming you have this API function
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ApplyLeavePage() {
  const [leaveDate, setLeaveDate] = useState(new Date());
  const [leaveType, setLeaveType] = useState('paid');
  const [leaveDuration, setLeaveDuration] = useState(1); // 1 for full day, 0.5 for half
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await applyLeave({ 
        leaveDate: leaveDate.toISOString().split('T')[0], // format to YYYY-MM-DD
        leaveType, 
        leaveDuration, 
        reason 
      });
      
      toast.success(response.message || 'Leave applied successfully!');
      // Reset form
      setLeaveDate(new Date());
      setLeaveType('paid');
      setLeaveDuration(1);
      setReason('');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply for leave.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-400 mb-8">Apply for Leave</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Side: Calendar */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">Select Leave Date</h2>
            <DayPicker
              mode="single"
              selected={leaveDate}
              onSelect={setLeaveDate}
              className="text-emerald-400"
              styles={{
                head_cell: { color: 'white' },
                caption: { color: '#34d399' },
                nav_button: { color: '#34d399' },
              }}
            />
          </div>

          {/* Right Side: Form */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">Leave Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-bold text-gray-400 block mb-2">Leave Type</label>
                <select 
                  value={leaveType} 
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-400 block mb-2">Leave Duration</label>
                <select 
                  value={leaveDuration} 
                  onChange={(e) => setLeaveDuration(parseFloat(e.target.value))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1}>Full Day</option>
                  <option value={0.5}>Half Day</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-400 block mb-2">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows="4"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 font-semibold bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
              >
                {isLoading ? 'Submitting...' : 'Apply for Leave'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplyLeavePage;
