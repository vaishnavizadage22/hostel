import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { RoleRegisterPage } from './pages/RoleRegisterPage';
import { AdminRegisterPage } from './pages/AdminRegisterPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { StudentRegistration } from './pages/StudentRegistration';
import { StudentLogin } from './pages/StudentLogin';
import { StudentFaceVerify } from './pages/StudentFaceVerify';
import { StudentDashboard } from './pages/StudentDashboard';
import { WardenRegistration } from './pages/WardenRegistration';
import { WardenLoginPage } from './pages/WardenLoginPage';
import { WardenDashboardPage } from './pages/WardenDashboardPage';
import { WardenProtectedRoute } from './components/WardenProtectedRoute';
import { StaffRegistrationPage } from './pages/StaffRegistrationPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffProtectedRoute } from './components/StaffProtectedRoute';
import { HostelGatePage } from './pages/HostelGatePage';
import { ParentLoginPage } from './pages/ParentLoginPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { ParentProtectedRoute } from './components/ParentProtectedRoute';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <Routes>
            {/* Main Role Selection Page (Unchanged) */}
            <Route path="/" element={<RoleSelectionPage />} />
            <Route path="/register" element={<RoleSelectionPage />} />

            {/* Public Informational Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Dedicated Admin Registration with Single-Admin Enforcement */}
            <Route path="/register/admin" element={<AdminRegisterPage />} />

            {/* Dedicated Real Student Biometric Registration */}
            <Route path="/register/student" element={<StudentRegistration />} />

            {/* Dedicated Warden Registration */}
            <Route path="/register/warden" element={<WardenRegistration />} />

            {/* Dedicated College Staff Registration */}
            <Route path="/register/staff" element={<StaffRegistrationPage />} />

            {/* Other Role-Specific Registration Pages (Unchanged) */}
            <Route path="/register/:role" element={<RoleRegisterPage />} />


            {/* Admin Login Page */}
            <Route path="/login/admin" element={<AdminLoginPage />} />
            <Route path="/login" element={<Navigate to="/login/admin" replace />} />

            {/* Warden Auth & Protected Dashboard Flow */}
            <Route path="/login/warden" element={<WardenLoginPage />} />
            <Route
              path="/warden/dashboard"
              element={
                <WardenProtectedRoute>
                  <WardenDashboardPage />
                </WardenProtectedRoute>
              }
            />
            <Route path="/warden" element={<Navigate to="/warden/dashboard" replace />} />

            {/* College Staff Auth & Protected Dashboard Flow */}
            <Route path="/login/staff" element={<StaffLoginPage />} />
            <Route
              path="/staff/dashboard"
              element={
                <StaffProtectedRoute>
                  <StaffDashboardPage />
                </StaffProtectedRoute>
              }
            />
            <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />


            {/* Student Auth & Biometric Flow */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/face-verify" element={<StudentFaceVerify />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

            {/* Hostel Gate Biometric Scanner Route */}
            <Route path="/hostel-gate" element={<HostelGatePage />} />

            {/* Parent Auth & Protected Dashboard Flow */}
            <Route path="/login/parent" element={<ParentLoginPage />} />
            <Route path="/parent/login" element={<Navigate to="/login/parent" replace />} />
            <Route
              path="/parent/dashboard"
              element={
                <ParentProtectedRoute>
                  <ParentDashboardPage />
                </ParentProtectedRoute>
              }
            />
            <Route path="/parent" element={<Navigate to="/parent/dashboard" replace />} />

            {/* Admin Dashboard Protected Route (Accessible ONLY to authenticated Admin) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
