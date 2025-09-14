import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages publiques
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterPatient from './pages/RegisterPatient';
import RegisterProfessional from './pages/RegisterProfessional';
import RegisterChoice from './pages/RegisterChoice';
import TestAccess from './pages/TestAccess';
import TestRoleLogin from './pages/TestRoleLogin';

// Pages privées
import Profile from './pages/Profile';

// Pages patient
import PatientSpace from './pages/PatientSpace';
import MyPrescriptions from './pages/patient/MyPrescriptions';
import Reminders from './pages/patient/Reminders';
import MedicalHistory from './pages/patient/MedicalHistory';

// Pages admin/pharmacien
import Dashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
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
            <Route path="/register" element={<RegisterChoice />} />
            <Route path="/register-patient" element={<RegisterPatient />} />
            <Route path="/register-professional" element={<RegisterProfessional />} />
            <Route path="/test-access" element={<TestAccess />} />
            <Route path="/test-role-login" element={<TestRoleLogin />} />

            {/* Routes privées */}
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

            {/* Routes patient */}
            <Route path="/patient" element={<PrivateRoute allowedRoles={['client']}><PatientSpace /></PrivateRoute>} />
            <Route path="/patient/prescriptions" element={<PrivateRoute allowedRoles={['client']}><MyPrescriptions /></PrivateRoute>} />
            <Route path="/patient/reminders" element={<PrivateRoute allowedRoles={['client']}><Reminders /></PrivateRoute>} />
            <Route path="/patient/history" element={<PrivateRoute allowedRoles={['client']}><MedicalHistory /></PrivateRoute>} />

            {/* Routes admin/pharmacien */}
            <Route path="/admin" element={<PrivateRoute allowedRoles={['admin', 'pharmacien']}><Dashboard /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute allowedRoles={['admin']}><AdminUsers /></PrivateRoute>} />
            
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