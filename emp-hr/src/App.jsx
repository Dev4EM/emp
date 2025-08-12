import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import './index.css';
import HomePage from './pages/HomePage';
import Wrapper from './components/Wrapper';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ApplyLeavePage from './pages/ApplyLeavePage';
import LoginPage from './pages/LoginPage';


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
        <main className="flex-1  overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/applyLeave" element={<ApplyLeavePage />} />
            <Route path="/login" element={<LoginPage />} />
          
            {/* Add more routes here */}
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
