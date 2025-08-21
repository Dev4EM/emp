import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { applyLeave, getLeaveBalance } from '../components/Api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from '../components/Modal';

function ApplyLeavePage() {
  const [leaveDate, setLeaveDate] = useState(new Date());
  const [leaveType, setLeaveType] = useState('paid');
  const [leaveDuration, setLeaveDuration] = useState(1);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await getLeaveBalance();
        setLeaveBalance(response);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch leave balance.');
      }
    };

    fetchLeaveBalance();
  }, []);

  const handleApplyClick = (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please fill in the reason for your leave.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmLeave = async () => {
    setIsModalOpen(false);
    setIsLoading(true);
    try {
      const response = await applyLeave({ 
        leaveDate: leaveDate.toISOString().split('T')[0],
        leaveType, 
        leaveDuration, 
        reason 
      });
      
      toast.success(response.message || 'Leave applied successfully!');
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
    <div className="p-4 sm:p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmLeave} 
        title="Confirm Leave Application"
      >
        Are you sure you want to apply for this leave?
      </Modal>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-6">Apply for Leave</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Form */}
          <div className="lg:col-span-7 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <form onSubmit={handleApplyClick} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="text-sm font-bold text-gray-400 block mb-2">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows="3"
                  required
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

          {/* Right Side: Calendar and Balance */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Select Leave Date</h2>
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
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Leave Balance</h2>
              {leaveBalance ? (
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-3xl font-bold text-emerald-400">{leaveBalance.remainingPaidLeave}</p>
                    <p className="text-sm">Remaining Paid</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{leaveBalance.paidLeavesTaken}</p>
                    <p className="text-sm">Paid Taken</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{leaveBalance.unpaidLeavesTaken}</p>
                    <p className="text-sm">Unpaid Taken</p>
                  </div>
                </div>
              ) : (
                <p>Loading balance...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplyLeavePage;
