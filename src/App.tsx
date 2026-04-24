import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RoleSelection from "./pages/RoleSelection";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/role-selection" /> : <LoginPage />} 
          />
          <Route 
            path="/role-selection" 
            element={!user ? <Navigate to="/login" /> : (profile ? <Navigate to={profile.role === 'manager' ? '/manager' : '/employee'} /> : <RoleSelection />)} 
          />
          <Route 
            path="/manager/*" 
            element={profile?.role === 'manager' ? <ManagerDashboard /> : <Navigate to="/role-selection" />} 
          />
          <Route 
            path="/employee/*" 
            element={profile?.role === 'employee' ? <EmployeeDashboard /> : <Navigate to="/role-selection" />} 
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
