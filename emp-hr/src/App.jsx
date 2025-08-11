import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';
import HomePage from './pages/HomePage';
import Wrapper from './components/Wrapper';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ApplyLeavePage from './pages/ApplyLeavePage';

function App() {
  return (
    <Router>
      <Wrapper>
        {/* Top Navbar */}
        <Navbar />

        {/* Sidebar + Main Content */}
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 overflow-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/applyLeave" element={<ApplyLeavePage />} />
              {/* Add more routes here */}
            </Routes>
          </main>
        </div>
      </Wrapper>
    </Router>
  );
}

export default App;
