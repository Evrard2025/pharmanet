import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages publiques
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Pages privées
import Profile from './pages/Profile';
import Loyalty from './pages/Loyalty';

// Pages admin/pharmacien
import Dashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminLoyalty from './pages/admin/Loyalty';
import Patients from './pages/admin/Patients';
import Consultations from './pages/admin/Consultations';
import Medicaments from './pages/admin/Medicaments';
import Surveillance from './pages/admin/Surveillance';
import SurveillanceBiologique from './pages/admin/SurveillanceBiologique';
import ConsultationMedicaments from './pages/admin/ConsultationMedicaments';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Routes privées */}
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/loyalty" element={<PrivateRoute requiredRole="client"><Loyalty /></PrivateRoute>} />

            {/* Routes admin/pharmacien */}
            <Route path="/admin" element={<PrivateRoute allowedRoles={['admin', 'pharmacien']}><Dashboard /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute allowedRoles={['admin']}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/loyalty" element={<PrivateRoute allowedRoles={['admin']}><AdminLoyalty /></PrivateRoute>} />
            
                    {/* Routes spécifiques au métier de pharmacien */}
        <Route path="/admin/patients" element={<PrivateRoute allowedRoles={['admin', 'pharmacien']}><Patients /></PrivateRoute>} />
        <Route path="/admin/consultations" element={<PrivateRoute allowedRoles={['admin', 'pharmacien']}><Consultations /></PrivateRoute>} />
        <Route path="/admin/medicaments" element={<PrivateRoute allowedRoles={['admin', 'pharmacien']}><Medicaments /></PrivateRoute>} />
        <Route path="/admin/surveillance" element={<PrivateRoute allowedRoles={['admin', 'pharmacien']}><Surveillance /></PrivateRoute>} />
        <Route path="/admin/surveillance-biologique" element={<PrivateRoute allowedRoles={['admin', 'pharmacien']}><SurveillanceBiologique /></PrivateRoute>} />
        <Route path="/admin/consultation-medicaments" element={<PrivateRoute allowedRoles={['admin', 'pharmacien']}><ConsultationMedicaments /></PrivateRoute>} />
          </Routes>
        </Layout>
      </div>
    </AuthProvider>
  );
}

export default App; 