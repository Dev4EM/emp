import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { applyLeave, getLeaveBalance } from '../components/Api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from '../components/Modal';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { format, isSameDay, isWeekend, isPast } from 'date-fns';

function ApplyLeavePage() {
  const [selectedDates, setSelectedDates] = useState([]);
  const [leaveType, setLeaveType] = useState('paid');
  const [dateDetails, setDateDetails] = useState({});
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await getLeaveBalance();
        setLeaveBalance(response);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch leave balance.');
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchLeaveBalance();
  }, []);

  const handleDayPickerSelect = (dates) => {
    const newDates = dates || [];
    setSelectedDates(newDates);

    setDateDetails(currentDetails => {
      const newDetails = {};
      newDates.forEach(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        if (currentDetails[dateString]) {
          newDetails[dateString] = currentDetails[dateString];
        } else {
          newDetails[dateString] = { duration: 1, half: null };
        }
      });
      return newDetails;
    });
  };

  const handleDateDetailsChange = (dateString, field, value) => {
    setDateDetails(currentDetails => {
      const newDetails = { ...currentDetails };
      if (!newDetails[dateString]) {
        newDetails[dateString] = { duration: 1, half: null };
      }
      newDetails[dateString][field] = value;
      if (field === 'duration' && value === 1) {
        newDetails[dateString].half = null;
      }
      return newDetails;
    });
  };

  const clearAllDates = () => {
    setSelectedDates([]);
  };

  const getTotalLeaveDays = () => {
    return Object.values(dateDetails).reduce((total, { duration }) => total + duration, 0);
  };

  const validateLeaveApplication = () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date for leave.');
      return false;
    }
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for your leave.');
      return false;
    }

    const totalDays = getTotalLeaveDays();
    if (leaveType === 'paid' && leaveBalance && totalDays > leaveBalance.remainingPaidLeave) {
      toast.error(`Insufficient paid leave balance. You have ${leaveBalance.remainingPaidLeave} days remaining.`);
      return false;
    }

    return true;
  };

  const handleApplyClick = (e) => {
    e.preventDefault();
    
    if (!validateLeaveApplication()) {
      return;
    }
    
    setIsModalOpen(true);
  };

  const handleConfirmLeave = async () => {
    setIsModalOpen(false);
    setIsLoading(true);
    
    try {
      // Apply leave for each selected date
      const leaveApplications = selectedDates.map(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        const details = dateDetails[dateString];
        return {
          leaveDate: dateString,
          leaveType,
          leaveDuration: details.duration,
          leaveHalf: details.half,
          reason
        };
      });

      // Apply leaves sequentially
      for (const application of leaveApplications) {
        await applyLeave(application);
      }
      
      toast.success(`Successfully applied for leave on ${selectedDates.length} day(s)!`);
      
      // Reset form
      setSelectedDates([]);
      setDateDetails({});
      setLeaveType('paid');
      setReason('');
      
      // Refresh leave balance
      const updatedBalance = await getLeaveBalance();
      setLeaveBalance(updatedBalance);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply for leave.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDateDisabled = (date) => {
    return isPast(date) && !isSameDay(date, new Date());
  };

  const formatSelectedDates = () => {
    return selectedDates
      .sort((a, b) => a - b)
      .map(date => format(date, 'EEE, MMM dd, yyyy'))
      .join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <ToastContainer theme="dark" position="top-right" />
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmLeave} 
        title="Confirm Leave Application"
      >
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-600">
            <h4 className="text-lg font-semibold mb-4 text-emerald-400">Leave Application Summary</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Selected Dates:</span>
                <span className="font-medium">{selectedDates.length} day(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Leave Type:</span>
                <span className="font-medium capitalize">{leaveType}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Total Days:</span>
                <span className="font-bold text-emerald-400">{getTotalLeaveDays()} day(s)</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-300 mb-2">Dates:</p>
              <p className="text-sm">{formatSelectedDates()}</p>
            </div>
            
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-300 mb-2">Reason:</p>
              <p className="text-sm">{reason}</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-300">Are you sure you want to submit this leave application?</p>
          </div>
        </div>
      </Modal>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Apply for Leave
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Select your preferred dates and submit your leave application with ease
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column - Calendar */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* Calendar Section */}
              <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-gray-700/50 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <CalendarTodayIcon className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Select Leave Dates</h2>
                  </div>
                  
                  {selectedDates.length > 0 && (
                    <button
                      onClick={clearAllDates}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Custom styled calendar */}
                <div className="calendar-wrapper">
                  <style jsx>{`
                    .calendar-wrapper .rdp {
                      --rdp-cell-size: 50px;
                      --rdp-accent-color: #10b981;
                      --rdp-background-color: #1f2937;
                      --rdp-accent-color-dark: #059669;
                      margin: 0;
                    }
                    
                    .calendar-wrapper .rdp-months {
                      justify-content: center;
                    }
                    
                    .calendar-wrapper .rdp-month {
                      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                      border-radius: 16px;
                      padding: 24px;
                      border: 1px solid #374151;
                    }
                    
                    .calendar-wrapper .rdp-caption {
                      color: #10b981;
                      font-weight: 700;
                      font-size: 1.25rem;
                      margin-bottom: 20px;
                    }
                    
                    .calendar-wrapper .rdp-nav_button {
                      color: #10b981;
                      background: #059669/20;
                      border-radius: 8px;
                      border: none;
                      width: 36px;
                      height: 36px;
                      transition: all 0.2s;
                    }
                    
                    .calendar-wrapper .rdp-nav_button:hover {
                      background: #059669/40;
                      transform: scale(1.05);
                    }
                    
                    .calendar-wrapper .rdp-head_cell {
                      color: #9ca3af;
                      font-weight: 600;
                      font-size: 0.875rem;
                    }
                    
                    .calendar-wrapper .rdp-day {
                      width: 50px;
                      height: 50px;
                      border-radius: 12px;
                      color: #e5e7eb;
                      font-weight: 500;
                      transition: all 0.2s;
                      border: none;
                      background: transparent;
                    }
                    
                    .calendar-wrapper .rdp-day:hover {
                      background: #374151;
                      color: #ffffff;
                      transform: scale(1.05);
                    }
                    
                    .calendar-wrapper .rdp-day_selected {
                      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                      color: white;
                      font-weight: 700;
                      transform: scale(1.1);
                      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
                    }
                    
                    .calendar-wrapper .rdp-day_disabled {
                      color: #6b7280;
                      background: transparent;
                    }
                    
                    .calendar-wrapper .rdp-day_disabled:hover {
                      background: transparent;
                      transform: none;
                    }
                    
                    .calendar-wrapper .rdp-day_today {
                      background: #3b82f6/20;
                      color: #60a5fa;
                      border: 2px solid #3b82f6;
                    }
                  `}</style>
                  
                  <DayPicker
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    disabled={isDateDisabled}
                    numberOfMonths={1}
                    showOutsideDays
                  />
                </div>

                {/* Weekend Notice */}
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-yellow-400 text-sm flex items-center">
                    <AccessTimeIcon className="w-4 h-4 mr-2" />
                    Weekend dates are highlighted differently. Consider your company's weekend policy.
                  </p>
                </div>
              </div>

              {/* Selected Dates Display */}
              {selectedDates.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <CheckCircleIcon className="text-emerald-400 mr-2" />
                    Selected Dates ({selectedDates.length})
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedDates.sort((a, b) => a - b).map((date, index) => {
                      const dateString = format(date, 'yyyy-MM-dd');
                      const details = dateDetails[dateString] || { duration: 1, half: null };

                      return (
                        <div
                          key={index}
                          className="flex flex-col bg-gray-700/50 p-3 rounded-xl border border-gray-600/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{format(date, 'EEE, MMM dd')}</p>
                              <p className="text-sm text-gray-400">{format(date, 'yyyy')}</p>
                              {isWeekend(date) && (
                                <span className="text-xs text-yellow-400">Weekend</span>
                              )}
                            </div>
                            <button
                              onClick={() => removeDate(date)}
                              className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <DeleteIcon className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                          <div className="mt-2">
                            <select
                              value={details.duration}
                              onChange={(e) => handleDateDetailsChange(dateString, 'duration', parseFloat(e.target.value))}
                              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md"
                            >
                              <option value={1}>Full Day</option>
                              <option value={0.5}>Half Day</option>
                            </select>
                          </div>
                          {details.duration === 0.5 && (
                            <div className="mt-2">
                              <select
                                value={details.half}
                                onChange={(e) => handleDateDetailsChange(dateString, 'half', e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md"
                              >
                                <option value="first">First Half</option>
                                <option value="second">Second Half</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Form & Balance */}
            <div className="space-y-8">
              
              {/* Leave Balance */}
              <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <AccountBalanceWalletIcon className="text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold">Leave Balance</h2>
                </div>
                
                {balanceLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-gray-700/50 rounded-lg"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-12 bg-gray-700/50 rounded-lg"></div>
                      <div className="h-12 bg-gray-700/50 rounded-lg"></div>
                    </div>
                  </div>
                ) : leaveBalance ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 p-4 rounded-xl border border-emerald-500/20">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-400">
                          {leaveBalance.remainingPaidLeave}
                        </p>
                        <p className="text-sm text-gray-400">Remaining Paid Leave</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700/50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-400">{leaveBalance.paidLeavesTaken}</p>
                        <p className="text-xs text-gray-400">Paid Taken</p>
                      </div>
                      <div className="bg-gray-700/50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-orange-400">{leaveBalance.unpaidLeavesTaken}</p>
                        <p className="text-xs text-gray-400">Unpaid Taken</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-400">Failed to load balance</p>
                )}
              </div>

              {/* Application Form */}
              <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/50 shadow-2xl">
                <form onSubmit={handleApplyClick} className="space-y-6">
                  
                  {/* Leave Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300 mb-3">
                        <AccountBalanceWalletIcon className="w-4 h-4 text-emerald-400" />
                        <span>Leave Type</span>
                      </label>
                      <select 
                        value={leaveType} 
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="w-full p-4 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="paid">💰 Paid Leave</option>
                        <option value="unpaid">📋 Unpaid Leave</option>
                      </select>
                    </div>

                    
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300 mb-3">
                      <DescriptionIcon className="w-4 h-4 text-orange-400" />
                      <span>Reason for Leave</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide a detailed reason for your leave application..."
                      className="w-full p-4 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all duration-200"
                      rows="4"
                      required
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{reason.length}/500 characters</span>
                      <span>{selectedDates.length > 0 ? `${getTotalLeaveDays()} day(s) selected` : 'No dates selected'}</span>
                    </div>
                  </div>

                  {/* Summary Card */}
                  {selectedDates.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-4 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-300">Total Leave Days</p>
                          <p className="text-2xl font-bold text-emerald-400">{getTotalLeaveDays()}</p>
                        </div>
                        <TrendingUpIcon className="text-emerald-400 w-8 h-8" />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={isLoading || selectedDates.length === 0}
                    className="w-full py-4 font-bold text-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting Applications...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Apply for Leave ({selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''})</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Quick Tips */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                <h3 className="font-semibold text-blue-200 mb-3 flex items-center">
                  💡 Pro Tips
                </h3>
                <ul className="text-sm text-blue-100 space-y-2">
                  <li>• Click dates to select/deselect them</li>
                  <li>• Apply at least 24 hours in advance</li>
                  <li>• Check your leave balance before applying</li>
                  <li>• Provide clear reasons for faster approval</li>
                  <li>• Weekend policies may vary by company</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplyLeavePage;
