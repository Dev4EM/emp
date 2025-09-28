import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getAllUsers, updateAttendance } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GrUpdate } from "react-icons/gr";

const UpdateAttendancePage = () => {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const resp = await getAllUsers();
      if (resp && Array.isArray(resp.users)) {
        setUsers(resp.users);
      } else {
        console.error('Unexpected getAllUsers response:', resp);
        setUsers([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((u) => {
    const fullName = `${u['First name'] || ''} ${u['Last name'] || ''}`.toLowerCase();
    const email = (u['Work email'] || '').toLowerCase();
    const empCode = (u['Employee Code'] || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return (
      fullName.includes(term) ||
      email.includes(term) ||
      empCode.includes(term)
    );
  });

  const openModalForUser = (user) => {
    setSelectedUser(user);
    setSelectedDate(null);
    setCheckIn('');
    setCheckOut('');
    setComment('');
    setShowModal(true);
  };
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
  const handleSubmitAttendance = async () => {
  if (!selectedUser) return toast.warning('No user selected');
  if (!selectedDate) return toast.warning('Please select a date');
  if (!comment.trim()) return toast.warning('Please enter a comment');

  const formattedDate = formatDateLocal(selectedDate);
  const payload = {
    userId: selectedUser._id,
    date: formattedDate,
    checkIn: checkIn || null,
    checkOut: checkOut || null,
    comment: comment.trim(),
  };
  
  console.log("Payload is:", payload);

  try {
    await updateAttendance(payload);
    toast.success('Attendance updated successfully');
    setShowModal(false);
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to update attendance');
    console.log(err);
  }
};

  return (
    <div className="min-h-screen bg-gray-300 py-8 px-4">
      <ToastContainer theme="dark" position="top-right" />

      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Update Attendance</h1>

        {/* Search */}
        <div className="mb-6 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search by name, email, or employee code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring focus:ring-emerald-300"
          />
        </div>

        {/* Loading */}
        {isLoadingUsers ? (
          <div className="text-center py-8 text-gray-600">Loading users...</div>
        ) : (
          <>
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredUsers.map((u) => (
                  <div
                    key={u._id}
                    className="bg-gray-100 relative p-4 pb-10 rounded-lg shadow-sm hover:shadow-md transition"
                  >
                    <h3 className="text-lg font-semibold mb-1">
                      {u['First name']} {u['Last name']}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">{u['Work email']}</p>
                    <p className="text-sm text-gray-500 mb-3">Emp Code: {u['Employee Code']}</p>
                    <button
                      onClick={() => openModalForUser(u)}
                      className="absolute top-3 right-3 text-blue-950 hover:text-blue-700"
                      title="Update Attendance"
                    >
                      <GrUpdate size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No users found.</div>
            )}
          </>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed z-50 top-1/2 left-1/2 w-full max-w-2xl transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Update Attendance for {selectedUser?.['First name']} {selectedUser?.['Last name']}
            </h2>

            {/* Calendar */}
            <div className="mb-4">
              <Calendar className="rounded-lg" onChange={setSelectedDate} value={selectedDate} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">Check-In Time</label>
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Check-Out Time</label>
                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSubmitAttendance}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Submit
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UpdateAttendancePage;
