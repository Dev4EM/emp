import { useState, useEffect } from 'react';
import { getUser } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const renderDetail = (label, value) => (
    <div className="bg-gray-700 p-4 rounded-lg">
      <label className="text-sm font-bold text-gray-400">{label}</label>
      <p className="text-lg">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <p>Loading profile...</p>
        ) : user ? (
          <>
            <div className="bg-gray-800 shadow-lg rounded-2xl p-8 border border-gray-700 mb-8">
              <div className="flex flex-col items-center sm:flex-row sm:items-start">
                <AccountCircleIcon style={{ fontSize: 150 }} className="text-emerald-400" />
                <div className="mt-6 sm:mt-0 sm:ml-8 text-center sm:text-left">
                  <h2 className="text-4xl font-bold">{`${user.prefix || ''} ${user.firstName} ${user.middleName || ''} ${user.lastName}`}</h2>
                  <p className="text-lg text-gray-400">{user.workEmail}</p>
                  <span className="inline-block bg-emerald-600 text-white text-sm font-semibold px-3 py-1 rounded-full mt-2">
                    {user.designation}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Personal Details */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 lg:col-span-3">
                <h3 className="text-2xl font-bold mb-4">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderDetail("Date of Birth", new Date(user.dateOfBirth).toLocaleDateString())}
                  {renderDetail("Gender", user.gender)}
                  {renderDetail("Blood Group", user.bloodGroup)}
                  {renderDetail("Nationality", user.nationality)}
                </div>
              </div>

              {/* Employment Details */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 lg:col-span-3">
                <h3 className="text-2xl font-bold mb-4">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderDetail("Employee Code", user.employeeCode)}
                  {renderDetail("Biometric ID", user.biometricId)}
                  {renderDetail("Date of Joining", new Date(user.dateOfJoining).toLocaleDateString())}
                  {renderDetail("Employment Type", user.employmentType)}
                  {renderDetail("Employment Status", user.employmentStatus)}
                  {renderDetail("Company", user.company)}
                  {renderDetail("Business Unit", user.businessUnit)}
                  {renderDetail("Department", user.department)}
                  {renderDetail("Sub Department", user.subDepartment)}
                  {renderDetail("Region", user.region)}
                  {renderDetail("Branch", user.branch)}
                  {renderDetail("Sub Branch", user.subBranch)}
                  {renderDetail("Shift", user.shift)}
                  {renderDetail("Level", user.level)}
                  {renderDetail("Skill Type", user.skillType)}
                  {renderDetail("Date of Confirmation", new Date(user.dateOfConfirmation).toLocaleDateString())}
                  {renderDetail("Reporting Manager", user.reportingManager?.firstName + ' ' + user.reportingManager?.lastName)}
                  {renderDetail("Functional Manager", user.functionalManager?.firstName + ' ' + user.functionalManager?.lastName)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p>Could not load profile.</p>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
