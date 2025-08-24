import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import './index.css';
import HomePage from './pages/HomePage';
import Wrapper from './components/Wrapper';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ApplyLeavePage from './pages/ApplyLeavePage';
import LoginPage from './pages/LoginPage';
import AuthWrapper from './components/AuthWrapper';
import TeamMembersPage from './pages/TeamMembersPage';
import PendingLeavesPage from './pages/PendingLeavesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MyAttendancePage from './pages/MyAttendancePage';
import LeaveBalancePage from './pages/LeaveBalancePage';
import PastLeavesPage from './pages/PastLeavesPage';
import ProfilePage from './pages/ProfilePage';
import AllLeavesPage from './pages/AllPendingLeavesPage';
import AddEmployeePage from './pages/AddEmployeePage';
import ManageEmployeesPage from './pages/ManageEmployeesPage.jsx';
import TeamAttendancePage from './pages/TeamAttendancePage';
import ManageAppPage from './pages/ManageAppPage';

// Helper component to handle layout logic
function LayoutRoutes() {
  const location = useLocation();
  const hideLayout = location.pathname === '/login';

  return (
    <>
      <Wrapper>
        {!hideLayout && <Navbar />}
        <div className="flex flex-1">
          {!hideLayout && <Sidebar />}
          <main className={`flex-1 overflow-auto ${hideLayout ? '' : 'ml-24 mt-16'}`}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AuthWrapper />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/applyLeave" element={<ApplyLeavePage />} />
                <Route path="/team-members" element={<TeamMembersPage />} />
                <Route path="/pending-leaves" element={<PendingLeavesPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
              // Add this route to your existing routes
// Add this route to your App.js
<Route path="/all-leaves" element={<AllLeavesPage />} />

                <Route path="/my-attendance" element={<MyAttendancePage />} />
                <Route path="/leave-balance" element={<LeaveBalancePage />} />
                <Route path="/past-leaves" element={<PastLeavesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/add-employee" element={<AddEmployeePage />} />
                <Route path="/manage-employees" element={<ManageEmployeesPage />} />
                <Route path="/team-attendance" element={<TeamAttendancePage />} />
                <Route path="/manage-app" element={<ManageAppPage />} />
              </Route>
            </Routes>
          </main>
        </div>
      </Wrapper>
    </>
  );
}

function App() {
  return (
    <Router>
      <LayoutRoutes />
    </Router>
  );
}

export default App;
