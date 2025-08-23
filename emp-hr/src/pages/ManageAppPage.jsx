
import React from 'react';

const ManageAppPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Manage Application</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Leave Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Leave Settings</h2>
          <form>
            <div className="mb-4">
              <label htmlFor="maxLeaves" className="block text-gray-600 font-medium mb-2">Maximum Leaves Per Year</label>
              <input type="number" id="maxLeaves" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="20" />
            </div>
            <div className="mb-4">
              <label htmlFor="leaveApprovalLevels" className="block text-gray-600 font-medium mb-2">Leave Approval Levels</label>
              <select id="leaveApprovalLevels" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>1</option>
                <option>2</option>
                <option>3</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Save Settings</button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Notification Preferences</h2>
          <form>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Email Notifications</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Push Notifications</span>
              <label className="switch">
                <input type="checkbox" />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">SMS Notifications</span>
              <label className="switch">
                <input type="checkbox" />
                <span className="slider round"></span>
              </label>
            </div>
          </form>
        </div>

        {/* User Role Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">User Role Management</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Admin</span>
              <button className="text-blue-600 hover:underline">Manage Permissions</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Team Leader</span>
              <button className="text-blue-600 hover:underline">Manage Permissions</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Employee</span>
              <button className="text-blue-600 hover:underline">Manage Permissions</button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for the toggle switch */}
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          -webkit-transition: .4s;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #2196F3;
        }
        input:focus + .slider {
          box-shadow: 0 0 1px #2196F3;
        }
        input:checked + .slider:before {
          -webkit-transform: translateX(26px);
          -ms-transform: translateX(26px);
          transform: translateX(26px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default ManageAppPage;
