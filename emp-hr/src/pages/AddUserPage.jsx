import { useState } from 'react';
import api from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddUserPage() {
  const [formData, setFormData] = useState({
    "Prefix": '',
    "First name": '',
    "Last name": '',
    "Date of birth": '',
    "Gender": 'Male',
    "Blood group": '',
    "Nationality": '',
    "Work email": '',
    "Mobile number": '',
    "ISDcode": 91,
    password: '',
    "Employee Code": '',
    "Date of joining": '',
    "Employment type": '',
    "Employment status": 'Active',
    "Company": '',
    "Business Unit": '',
    "Department": '',
    "Sub department": '',
    "Designation": '',
    "Region": '',
    "Branch": '',
    "Sub branch": '',
    "Shift": '',
    "Level": '',
    "Skill Type": '',
    "Date of Confirmation": '',
    "Employee Other Status": '',
    userType: 'employee',
    "Reporting manager": '',
    "Functional manager": '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.addUser(formData);
      toast.success('User added successfully!');
      // Reset form
      setFormData({
        "Prefix": '',
        "First name": '',
        "Last name": '',
        "Date of birth": '',
        "Gender": 'Male',
        "Blood group": '',
        "Nationality": '',
        "Work email": '',
        "Mobile number": '',
        "ISDcode": 91,
        password: '',
        "Employee Code": '',
        "Date of joining": '',
        "Employment type": '',
        "Employment status": 'Active',
        "Company": '',
        "Business Unit": '',
        "Department": '',
        "Sub department": '',
        "Designation": '',
        "Region": '',
        "Branch": '',
        "Sub branch": '',
        "Shift": '',
        "Level": '',
        "Skill Type": '',
        "Date of Confirmation": '',
        "Employee Other Status": '',
        userType: 'employee',
        "Reporting manager": '',
        "Functional manager": '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <ToastContainer theme="colored" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-400 mb-8">Add New User</h1>
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Personal Details */}
            <input type="text" name="Prefix" placeholder="Prefix" value={formData["Prefix"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="First name" placeholder="First Name" value={formData["First name"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" required />
            <input type="text" name="Last name" placeholder="Last Name" value={formData["Last name"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" required />
            <input type="text" name="Date of birth" placeholder="Date of Birth (DD/MM/YYYY)" value={formData["Date of birth"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <select name="Gender" value={formData["Gender"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="text" name="Blood group" placeholder="Blood Group" value={formData["Blood group"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Nationality" placeholder="Nationality" value={formData["Nationality"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />

            {/* Contact Details */}
            <input type="email" name="Work email" placeholder="Work Email" value={formData["Work email"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" required />
            <input type="text" name="Mobile number" placeholder="Mobile Number" value={formData["Mobile number"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="number" name="ISDcode" placeholder="ISD Code" value={formData["ISDcode"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />

            {/* Authentication */}
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" required />

            {/* Employment Details */}
            <input type="text" name="Employee Code" placeholder="Employee Code" value={formData["Employee Code"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Date of joining" placeholder="Date of Joining (DD/MM/YYYY)" value={formData["Date of joining"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Employment type" placeholder="Employment Type" value={formData["Employment type"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <select name="Employment status" value={formData["Employment status"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <input type="text" name="Company" placeholder="Company" value={formData["Company"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Business Unit" placeholder="Business Unit" value={formData["Business Unit"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Department" placeholder="Department" value={formData["Department"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Sub department" placeholder="Sub Department" value={formData["Sub department"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Designation" placeholder="Designation" value={formData["Designation"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Region" placeholder="Region" value={formData["Region"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Branch" placeholder="Branch" value={formData["Branch"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Sub branch" placeholder="Sub Branch" value={formData["Sub branch"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Shift" placeholder="Shift" value={formData["Shift"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Level" placeholder="Level" value={formData["Level"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Skill Type" placeholder="Skill Type" value={formData["Skill Type"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Date of Confirmation" placeholder="Date of Confirmation (DD/MM/YYYY)" value={formData["Date of Confirmation"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Employee Other Status" placeholder="Employee Other Status" value={formData["Employee Other Status"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />

            {/* Hierarchy and Roles */}
            <select name="userType" value={formData.userType} onChange={handleChange} className="p-3 bg-gray-700 rounded-md">
              <option value="employee">Employee</option>
              <option value="teamleader">Team Leader</option>
              <option value="admin">Admin</option>
            </select>
            <input type="text" name="Reporting manager" placeholder="Reporting Manager" value={formData["Reporting manager"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
            <input type="text" name="Functional manager" placeholder="Functional Manager" value={formData["Functional manager"]} onChange={handleChange} className="p-3 bg-gray-700 rounded-md" />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 font-semibold bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding User...' : 'Add User'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddUserPage;
