import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getTeamAttendance } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const TeamAttendancePage = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch team attendance data
  useEffect(() => {
    const fetchTeamAttendance = async () => {
      setIsLoading(true);
      try {
        const response = await getTeamAttendance();
        setAttendanceData(response);
        setFilteredData(response);
      } catch (err) {
        toast.error('Failed to fetch team attendance data.');
        // Mock data for development
        const mockData = [
          {
            employeeId: '1',
            employeeName: 'John Doe',
            employeeCode: 'EMP001',
            date: '2025-08-23',
            checkIn: '2025-08-23T09:00:00Z',
            checkOut: '2025-08-23T17:30:00Z',
            status: 'Present',
            duration: '8h 30m',
            remarks: ''
          },
          {
            employeeId: '2',
            employeeName: 'Jane Smith',
            employeeCode: 'EMP002',
            date: '2025-08-23',
            checkIn: null,
            checkOut: null,
            status: 'Absent',
            duration: '0h 0m',
            remarks: 'Sick leave'
          },
          {
            employeeId: '3',
            employeeName: 'Peter Jones',
            employeeCode: 'EMP003',
            date: '2025-08-23',
            checkIn: '2025-08-23T09:15:00Z',
            checkOut: '2025-08-23T18:00:00Z',
            status: 'Present',
            duration: '8h 45m',
            remarks: ''
          },
          {
            employeeId: '4',
            employeeName: 'Mary Johnson',
            employeeCode: 'EMP004',
            date: '2025-08-22',
            checkIn: null,
            checkOut: null,
            status: 'On Leave',
            duration: '0h 0m',
            remarks: 'Vacation'
          }
        ];
        setAttendanceData(mockData);
        setFilteredData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamAttendance();
  }, [startDate, endDate]);

  // Filter data based on date range and status
  useEffect(() => {
    let filtered = attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      const isInDateRange = recordDate >= start && recordDate <= end;
      const matchesStatus = filterStatus === 'all' || record.status.toLowerCase() === filterStatus.toLowerCase();
      
      return isInDateRange && matchesStatus;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [attendanceData, startDate, endDate, filterStatus]);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedData = [...filteredData].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(sortedData);
  };

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      Present: { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="w-4 h-4" /> },
      Absent: { color: 'bg-red-100 text-red-800', icon: <CancelIcon className="w-4 h-4" /> },
      'On Leave': { color: 'bg-yellow-100 text-yellow-800', icon: <AccessTimeIcon className="w-4 h-4" /> },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: null };
    
    return (
      <span className={`px-3 py-1 inline-flex items-center space-x-1 text-xs leading-5 font-semibold rounded-full ${config.color}`}>
        {config.icon}
        <span>{status}</span>
      </span>
    );
  };

  // Get attendance statistics
  const getStats = () => {
    const present = filteredData.filter(record => record.status === 'Present').length;
    const absent = filteredData.filter(record => record.status === 'Absent').length;
    const onLeave = filteredData.filter(record => record.status === 'On Leave').length;
    const total = filteredData.length;
    
    return { present, absent, onLeave, total };
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
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-400 mb-2">Team Attendance</h1>
          <p className="text-gray-400">Monitor your team's attendance and presence</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <PeopleIcon className="text-blue-400" />
              <p className="text-sm text-gray-400">Total Records</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircleIcon className="text-green-400" />
              <p className="text-sm text-gray-400">Present</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.present}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <CancelIcon className="text-red-400" />
              <p className="text-sm text-gray-400">Absent</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.absent}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <AccessTimeIcon className="text-yellow-400" />
              <p className="text-sm text-gray-400">On Leave</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.onLeave}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <FilterListIcon className="text-emerald-400" />
              <h3 className="text-lg font-semibold">Filters</h3>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              {/* Date Range */}
              <div className="flex items-center space-x-2">
                <CalendarTodayIcon className="text-gray-400" />
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholderText="Start Date"
                />
                <span className="text-gray-400">to</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholderText="End Date"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="on leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                    onClick={() => handleSort('employeeName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Employee</span>
                      {sortConfig.key === 'employeeName' && (
                        sortConfig.direction === 'asc' ? 
                        <ArrowUpwardIcon className="w-4 h-4" /> : 
                        <ArrowDownwardIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {sortConfig.key === 'date' && (
                        sortConfig.direction === 'asc' ? 
                        <ArrowUpwardIcon className="w-4 h-4" /> : 
                        <ArrowDownwardIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? 
                        <ArrowUpwardIcon className="w-4 h-4" /> : 
                        <ArrowDownwardIcon className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentItems.map((record, index) => (
                  <tr key={`${record.employeeId}-${record.date}`} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{record.employeeName}</div>
                        <div className="text-sm text-gray-400">{record.employeeCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatTime(record.checkIn)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatTime(record.checkOut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-semibold">
                      {record.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {record.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* No Data State */}
        {filteredData.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <PeopleIcon style={{ fontSize: 80 }} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Attendance Records Found</h3>
            <p className="text-gray-500">No attendance data matches your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamAttendancePage;
