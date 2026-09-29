import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ApplicationForm from './components/ApplicationForm';
import VitalEventsSelection from './pages/VitalEventsSelection';
import AdminDashboard from './AdminDashboard';
import AddStaff from './AddStaff';
import UserFeedbacks from './UserFeedbacks';
import UserDashboard from './UserDashboard';
import VerifierDashboard from './VerifierDashboard';
import VitalDashboard from './pages/VitalDashboard';
import SupportDashboard from './pages/SupportDashboard';
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import About from './About';
import TrackStatus from './TrackStatus';
import DigitalIDCard from './DigitalIDCard';
import MarriageRegistration from './MarriageRegistration';
import BirthRegistration from './BirthRegistration';
import BirthCertificate from './BirthCertificate';
import DeathRegistration from './DeathRegistration';
import DivorceRegistration from './DivorceRegistration';
import MarriageCertificate from './MarriageCertificate';
import ProtectedRoute from './components/ProtectedRoute';
import OfficerDashboard from './OfficerDashboard';
import FinanceDashboard from './FinanceDashboard';
import NewIDApplicationForm from './NewIDApplicationForm';
import ManageFees from './ManageFees';
import Contact from './Contact';
import Navbar from './components/Navbar';

function RoutedApp({ darkMode, toggleDarkMode }) {
  const location = useLocation();
  const hideHeaderRoutes = ['/login', '/signup', '/admin-dashboard', '/finance-dashboard', '/officer-dashboard', '/digital-id-card'];
  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideHeader && <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/officer-dashboard" element={<ProtectedRoute allowedRoles={['officer']}><OfficerDashboard /></ProtectedRoute>} />
        <Route path="/finance-dashboard" element={<ProtectedRoute allowedRoles={['finance']}><FinanceDashboard /></ProtectedRoute>} />
        <Route path="/apply" element={<ProtectedRoute><NewIDApplicationForm /></ProtectedRoute>} />
        <Route path="/apply-id" element={<ProtectedRoute><NewIDApplicationForm /></ProtectedRoute>} />
        <Route path="/renew-id" element={<ProtectedRoute><NewIDApplicationForm /></ProtectedRoute>} />
        <Route path="/vital-events" element={<ProtectedRoute><VitalEventsSelection /></ProtectedRoute>} />
        <Route path="/birth-registration" element={<ProtectedRoute><BirthRegistration /></ProtectedRoute>} />
        <Route path="/birth-certificate/:applicationId" element={<BirthCertificate />} />
        <Route path="/marriage-registration" element={<ProtectedRoute><MarriageRegistration /></ProtectedRoute>} />
        <Route path="/divorce-registration" element={<ProtectedRoute><DivorceRegistration /></ProtectedRoute>} />
        <Route path="/death-registration" element={<ProtectedRoute><DeathRegistration /></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><TrackStatus /></ProtectedRoute>} />
        <Route path="/digital-id-card" element={<DigitalIDCard />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/manage-fees" element={<ProtectedRoute allowedRoles={['admin']}><ManageFees /></ProtectedRoute>} />
        <Route path="/marriage-certificate/:applicationId" element={<MarriageCertificate />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/add-staff" element={<ProtectedRoute allowedRoles={['admin']}><AddStaff /></ProtectedRoute>} />
        <Route path="/user-feedbacks" element={<ProtectedRoute allowedRoles={['admin']}><UserFeedbacks /></ProtectedRoute>} />
        <Route path="/verifier-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'verifier']}><VerifierDashboard /></ProtectedRoute>} />
        <Route path="/vital-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'vital']}><VitalDashboard /></ProtectedRoute>} />
        <Route path="/support-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'support']}><SupportDashboard /></ProtectedRoute>} />
        <Route path="/user-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'officer', 'finance', 'verifier', 'vital', 'support']}><UserDashboard /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode((currentMode) => !currentMode);

  return (
    <div className={darkMode ? 'app dark' : 'app'}>
      <Router>
        <RoutedApp darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      </Router>
    </div>
  );
}

export default App;
