import { useState } from 'react';
import { registerUser } from '../components/Api';
import { toast, ToastContainer } from 'react-toastify';

function AddEmployeePage() {
  const [formData, setFormData] = useState({
    prefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    workEmail: '',
    password: '',
    // ... add all other fields from the User model
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerUser(formData);
      toast.success('Employee added successfully!');
      // Reset form
      setFormData({
        prefix: '',
        firstName: '',
        middleName: '',
        lastName: '',
        workEmail: '',
        password: '',
        // ... reset all other fields
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add employee.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-400 mb-8">Add New Employee</h1>
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Personal Details */}
            <input type="text" name="prefix" placeholder="Prefix" value={formData.prefix} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" required />
            <input type="text" name="middleName" placeholder="Middle Name" value={formData.middleName} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" required />
            <input type="email" name="workEmail" placeholder="Work Email" value={formData.workEmail} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" required />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" required />
            {/* ... add all other input fields for the User model */}
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 font-semibold bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding Employee...' : 'Add Employee'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddEmployeePage;