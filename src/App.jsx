import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Website Components
import Website from '@/components/Website/Website.jsx';

// Admin Panel Components
import AdminLayout from '@/components/Admin/AdminLayout';
import Dashboard from '@/components/Admin/Dashboard';
import LoginForm from '@/components/Auth/LoginForm';
import AuthTestPage from './pages/AuthTestPage';

// Move UserProvider outside main App component
const AppWithProviders = ({ children }) => {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};

const App = () => {
  const { user, loading, setUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  console.log(`[App] Main route: ${location.pathname}, User state:`, { loading, user: !!user });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppWithProviders>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pattern-bg">
        <Helmet>
          <title>Vidya+ College Management System</title>
          <meta name="description" content="Complete college management system with multi-tenant architecture, role-based access, and comprehensive modules for academic, financial, and administrative management." />
        </Helmet>
          <Routes location={location}>
            {/* Admin Login route */}
            <Route path="/admin/login" element={<LoginForm onLoginSuccess={(u) => {
              console.log('[App] onLoginSuccess callback called with user:', u);
              setUser(u);
              try {
                localStorage.setItem('user', JSON.stringify(u));
                console.log('[App] User stored in localStorage');
              } catch (e) {
                console.error('[App] Error storing user in localStorage:', e);
              }

              setTimeout(() => {
                console.log('[App] Navigating to admin dashboard after successful login');
                navigate('/admin', { replace: true });
              }, 300);
            }} />} />

            {/* Admin Panel routes - protected */}
            <Route path="/admin/*" element={<AdminLayout />} />

            {/* Public auth test route */}
            <Route path="/auth-test" element={<AuthTestPage />} />

            {/* Test route to verify routing is working */}
            <Route path="/test" element={
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-800">Routing Test Successful!</h1>
                  <p className="text-lg text-gray-600 mt-4">If you see this, the basic routing is working correctly.</p>
                  <div className="mt-8 flex flex-col gap-4 max-w-md mx-auto">
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/')}>Visit Public Website</Button>
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/admin')}>Visit Admin Panel {user ? '(Logged In)' : '(Requires Login)'}</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate('/admin/admission')}>Admission Module</Button>
                    <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/admin/students')}>Student Module</Button>
                  </div>
                </div>
              </div>
            } />

            {/* Website routes - accessible to everyone */}
            <Route path="/*" element={<Website />} />

            {/* Default route - redirect to website */}
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
      </div>
    </AppWithProviders>
  );
};

export default App;