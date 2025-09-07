import { useState, useEffect } from 'react';
import { getUser, changePassword } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Modal from '../components/Modal';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    personal: false,
    employment: false,
    attendance: false,
    leaves: false,
    additional: false
  });

  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch user data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderDetail = (label, value) => (
    <div className="bg-gray-700 p-4 rounded-lg">
      <label className="text-sm font-bold text-gray-400">{label}</label>
      <p className="text-lg">{value || 'N/A'}</p>
    </div>
  );

  const renderCollapsibleSection = (title, sectionKey, children) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 lg:col-span-3">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-2xl font-bold">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ExpandLessIcon className="text-emerald-400" />
        ) : (
          <ExpandMoreIcon className="text-emerald-400" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    setIsPasswordModalOpen(true);
  };

  const confirmPasswordChange = async () => {
    setIsPasswordModalOpen(false);
    setIsChangingPassword(true);
    
    try {
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success(response.message || 'Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Format attendance and leave nicely
  const renderAttendance = (attendance) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-gray-100">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Date</th>
            <th className="px-2 py-1 text-left">Check-in</th>
            <th className="px-2 py-1 text-left">Check-out</th>
            <th className="px-2 py-1 text-left">Location</th>
          </tr>
        </thead>
        <tbody>
          {attendance?.slice(0,5).map((a) => (
            <tr key={a._id}>
              <td className="border-t px-2 py-1">
                {a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}
              </td>
              <td className="border-t px-2 py-1">
                {a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A'}
              </td>
              <td className="border-t px-2 py-1">
                {a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : 'N/A'}
              </td>
              <td className="border-t px-2 py-1">
                {a.checkInLocation?.address || a.checkOutLocation?.address || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLeaves = (leaves) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-gray-100">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Date</th>
            <th className="px-2 py-1 text-left">Type</th>
            <th className="px-2 py-1 text-left">Duration</th>
            <th className="px-2 py-1 text-left">Status</th>
            <th className="px-2 py-1 text-left">Reason</th>
          </tr>
        </thead>
        <tbody>
          {leaves?.slice(0,5).map((l) => (
            <tr key={l._id}>
              <td className="border-t px-2 py-1">{l.date ? new Date(l.date).toLocaleDateString() : 'N/A'}</td>
              <td className="border-t px-2 py-1">
                <span className={`px-2 py-1 rounded text-xs ${l.type === 'paid' ? 'bg-green-600' : 'bg-orange-600'}`}>
                  {l.type || 'N/A'}
                </span>
              </td>
              <td className="border-t px-2 py-1">{l.duration || 'N/A'} day(s)</td>
              <td className="border-t px-2 py-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  l.status === 'approved' ? 'bg-green-600' : 
                  l.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
                  {l.status || 'N/A'}
                </span>
              </td>
              <td className="border-t px-2 py-1 truncate max-w-xs">{l.reason || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      
      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={confirmPasswordChange}
        title="Confirm Password Change"
      >
        <div className="space-y-4">
          <p className="text-gray-300">Are you sure you want to change your password?</p>
          <div className="bg-yellow-600/20 border border-yellow-600 p-3 rounded-lg">
            <p className="text-yellow-200 text-sm">
              ⚠️ You will need to login again with your new password after this change.
            </p>
          </div>
        </div>
      </Modal>

      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
          </div>
        ) : user ? (
          <>
            {/* Profile Header */}
            <div className="bg-gray-800 shadow-lg rounded-2xl p-8 border border-gray-700 mb-8">
              <div className="flex flex-col items-center sm:flex-row sm:items-start">
                <AccountCircleIcon style={{ fontSize: 150 }} className="text-emerald-400" />
                <div className="mt-6 sm:mt-0 sm:ml-8 text-center sm:text-left flex-1">
                  <h2 className="text-4xl font-bold">
                    {`${user.Prefix || ''} ${user["First name"] || ''} ${user["Last name"] || ''}`.trim()}
                  </h2>
                  <p className="text-lg text-gray-400">{user["Work email"]}</p>
                  <p className="text-md text-gray-400">{user["Mobile number"]}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-block bg-emerald-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                      {user.Designation || 'N/A'}
                    </span>
                    <span className="inline-block bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                      {user.userType || 'employee'}
                    </span>
                  </div>
                </div>
                
                {/* Change Password Button */}
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={() =>{ setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    document.getElementById('passwordChangeSection').scrollIntoView({ behavior: 'smooth' });
                  }}
                    className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                    data-toggle="modal"
  
                  >
                    <LockIcon className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div id="passwordChangeSection" className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                <LockIcon className="text-orange-400" />
                <span>Change Password</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="text-sm font-bold text-gray-400 block mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <label className="text-sm font-bold text-gray-400 block mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <label className="text-sm font-bold text-gray-400 block mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="mt-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Changing Password...</span>
                  </>
                ) : (
                  <>
                    <LockIcon className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Personal Details - Collapsible */}
              {renderCollapsibleSection("Personal Details", "personal", (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderDetail("Date of Birth", user["Date of birth"])}
                  {renderDetail("Gender", user.Gender)}
                  {renderDetail("Blood Group", user["Blood group"])}
                  {renderDetail("Nationality", user.Nationality)}
                  {renderDetail("Employee Code", user["Employee Code"])}
                  {renderDetail("Mobile Number", user["Mobile number"])}
                  {renderDetail("ISD Code", user.ISDcode)}
                </div>
              ))}

              {/* Employment Details - Collapsible */}
              {renderCollapsibleSection("Employment Details", "employment", (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderDetail("Date of Joining", user["Date of joining"])}
                  {renderDetail("Employment Type", user["Employment type"])}
                  {renderDetail("Employment Status", user["Employment status"])}
                  {renderDetail("Company", user.Company)}
                  {renderDetail("Business Unit", user["Business Unit"])}
                  {renderDetail("Department", user.Department)}
                  {renderDetail("Sub Department", user["Sub department"])}
                  {renderDetail("Designation", user.Designation)}
                  {renderDetail("Region", user.Region)}
                  {renderDetail("Branch", user.Branch)}
                  {renderDetail("Sub Branch", user["Sub branch"])}
                  {renderDetail("Shift", user.Shift)}
                  {renderDetail("Level", user.Level)}
                  {renderDetail("Skill Type", user["Skill Type"])}
                  {renderDetail("Date of Confirmation", user["Date of Confirmation"])}
                  {renderDetail("Reporting Manager", user["Reporting manager"])}
                  {renderDetail("Functional Manager", user["Functional manager"])}
                </div>
              ))}

              {/* Recent Attendance - Collapsible */}
              {user.attendance?.length > 0 && renderCollapsibleSection("Recent Attendance", "attendance", 
                renderAttendance(user.attendance)
              )}

              {/* Recent Leaves - Collapsible */}
              {user.leaves?.length > 0 && renderCollapsibleSection("Recent Leaves", "leaves", 
                renderLeaves(user.leaves)
              )}

              {/* Additional Information - Collapsible */}
              {renderCollapsibleSection("Additional Information", "additional", (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderDetail("Employee Other Status", user["Employee Other Status"])}
                  {renderDetail("User Type", user.userType)}
                  {renderDetail("Paid Leave Balance", user.paidLeaveBalance)}
                  {renderDetail("Total Leaves Applied", user.leaves?.length || 0)}
                  {renderDetail("Approved Leaves", user.leaves?.filter(l => l.status === 'approved').length || 0)}
                  {renderDetail("Considered for Future Opening", user.isConsideredForFutureOpening ? 'Yes' : 'No')}
                  {renderDetail("Blacklisted", user.isBlacklisted ? 'Yes' : 'No')}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl">Could not load profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
