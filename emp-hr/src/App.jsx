import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import './index.css';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
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
import AddUserPage from './pages/AddUserPage';
 
// A component to conditionally render the layout
const AppContent = () => {
  const location = useLocation();
  const hideLayout = location.pathname === '/login';

  return (
    <>
      {hideLayout ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route element={<AuthWrapper />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/applyLeave" element={<ApplyLeavePage />} />
              <Route path="/team-members" element={<TeamMembersPage />} />
              <Route path="/pending-leaves" element={<PendingLeavesPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/all-leaves" element={<AllLeavesPage />} />
              <Route path="/my-attendance" element={<MyAttendancePage />} />
              <Route path="/leave-balance" element={<LeaveBalancePage />} />
              <Route path="/past-leaves" element={<PastLeavesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/add-employee" element={<AddUserPage />} />
              <Route path="/manage-employees" element={<ManageEmployeesPage />} />
              <Route path="/team-attendance" element={<TeamAttendancePage />} />
              <Route path="/manage-app" element={<ManageAppPage />} />
            </Route>

          </Routes>
        </Layout>
      )}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;