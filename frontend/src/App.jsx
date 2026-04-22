import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import ConsultationWindow from "./pages/doctor/ConsultationWindow";
import Login from "./pages/auth/Login";

// Initial role-specific dashboard views
const Unauthorized = () => (
  <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg mx-auto">
    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
    <p className="text-slate-500 mb-8">You do not have the required permissions to access this clinical module.</p>
    <button onClick={() => window.history.back()} className="medical-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Go Back</button>
  </div>
);

const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin Module */}
            <Route element={<ProtectedRoute requiredGroup="Admin" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Receptionist Module */}
            <Route element={<ProtectedRoute requiredGroup="Receptionist" />}>
              <Route path="/receptionist" element={<ReceptionistDashboard />} />
            </Route>

            {/* Pharmacist Module */}
            <Route element={<ProtectedRoute requiredGroup="Pharmacist" />}>
              <Route path="/pharmacy" element={<PharmacyDashboard />} />
            </Route>

            {/* Doctor Module */}
            <Route element={<ProtectedRoute requiredGroup="Doctor" />}>
              <Route path="/doctor" element={<DoctorDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* Doctor Consultation Route (Full Screen, No Nav) */}
        <Route element={<ProtectedRoute requiredGroup="Doctor" />}>
          <Route path="/doctor/consultation" element={<ConsultationWindow />} />
        </Route>

        {/* Redirect Root to relevant Dashboard or Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
