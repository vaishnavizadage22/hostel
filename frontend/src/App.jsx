import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { RoleRegisterPage } from './pages/RoleRegisterPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <Routes>
          {/* Main Registration Role Selection Page */}
          <Route path="/" element={<RoleSelectionPage />} />
          <Route path="/register" element={<RoleSelectionPage />} />

          {/* Role-Specific Registration Pages */}
          <Route path="/register/:role" element={<RoleRegisterPage />} />

          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
