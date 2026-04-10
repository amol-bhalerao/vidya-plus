import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import LoginForm from '@/components/Auth/LoginForm';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
import WebsiteLayout from '@/components/Website/WebsiteLayout';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import RecentActivity from '@/components/Dashboard/RecentActivity';
import QuickActions from '@/components/Dashboard/QuickActions';
import ModuleContent from '@/components/Modules/ModuleContent';
import AddNewStudent from '@/components/Students/AddNewStudent';
import EditStudent from '@/components/Students/EditStudent';
import SettingsPage from '@/components/Settings/SettingsPage';
import AdmissionDashboard from '@/components/Admission/AdmissionDashboard';
import StudentManagementDashboard from '@/components/Students/StudentManagementDashboard';
import FinanceDashboard from '@/components/Finance/FinanceDashboard';
import AttendanceDashboard from '@/components/Attendance/AttendanceDashboard';
import ExaminationDashboard from '@/components/Examination/ExaminationDashboard';
import OnlineExamDashboard from '@/components/OnlineExam/OnlineExamDashboard';
import TakeExam from '@/components/OnlineExam/TakeExam';
import ViewResults from '@/components/OnlineExam/ViewResults';
import ExamResultsPrint from '@/components/OnlineExam/ExamResultsPrint';
import DocumentsDashboard from '@/components/Documents/DocumentsDashboard';
import { ScrollArea } from '@/components/ui/scroll-area';

const moduleConfig = {
    admission: { id: 'admission', title: 'Admission Management', description: 'Manage student admissions, registrations, and approval workflows', features: ['Student Registration', 'GR Number Generation', 'Aadhaar Verification', 'Admission Approval', 'Previous School Details', 'Admission Register'] },
    students: { id: 'students', title: 'Student Management', description: 'Complete student profile management and academic tracking', features: ['Student Profiles', 'Caste/Category Management', 'Document Upload', 'Student Promotion', 'Academic History', 'Parent Information'] },
    attendance: { id: 'attendance', title: 'Attendance Management', description: 'Track daily and monthly attendance with comprehensive reports', features: ['Daily Attendance', 'Attendance Report', 'Attendance Analytics', 'Defaulter Reports'] },
    examination: { id: 'examination', title: 'Examination & Academic Management', description: 'Comprehensive exam management and academic evaluation', features: ['Exam Timetable', 'Syllabus Management', 'Seating Arrangement', 'Marks Entry', 'Grade Calculation', 'Report Cards'] },
    finance: { id: 'finance', title: 'Finance & Accounts', description: 'Complete financial management with fee collection, expenses, ledgers, and reporting', features: ['Fee Collection', 'Expense Management', 'General Ledger', 'Student Ledger', 'Balance Sheet', 'Outstanding Dues'] },
    hr: { id: 'hr', title: 'HR Management', description: 'Employee management, payroll, and UDISE compliance', features: ['Employee Profiles', 'Payroll Management', 'Leave Tracking', 'Attendance System', 'Qualification Records', 'Performance Reviews'] },
    infrastructure: { id: 'infrastructure', title: 'Resource & Infrastructure', description: 'Manage classrooms, facilities, and resource allocation', features: ['Classroom Allocation', 'Resource Management', 'Facility Booking', 'Maintenance Tracking', 'Inventory Management', 'Asset Register'] },
    documents: { id: 'documents', title: 'Document & Certificate Management', description: 'Generate and manage all academic certificates and documents', features: ['Transfer Certificate', 'Bonafide Certificate', 'Character Certificate', 'Caste Certificate', 'Domicile Certificate', 'Document Storage'] },
    'online-exam': { id: 'online-exam', title: 'Online Examination System', description: 'Conduct online exams with automatic grading and result publishing', features: ['Question Bank', 'Exam Scheduling', 'MCQ Auto-grading', 'Descriptive Evaluation', 'Result Publishing', 'Performance Analytics'] },
    library: { id: 'library', title: 'Library Management', description: 'Complete library management with catalog and circulation', features: ['Book Catalog', 'Issue/Return System', 'Fine Calculation', 'Student History', 'Author Management', 'Subject Classification'] },
    hostel: { id: 'hostel', title: 'Hostel Management', description: 'Manage hostel accommodations, fees, and student welfare', features: ['Room Allocation', 'Bed Management', 'Hostel Fees', 'Attendance Tracking', 'Discipline Records', 'Mess Management'] },
    transport: { id: 'transport', title: 'Transport Management', description: 'Manage bus routes, fees, and transportation logistics', features: ['Route Management', 'Bus Allocation', 'Transport Fees', 'Driver Management', 'Vehicle Maintenance', 'Route Optimization'] },
    placement: { id: 'placement', title: 'Placement & Alumni Management', description: 'Career services, job placements, and alumni network', features: ['Company Database', 'Job Postings', 'Student Applications', 'Alumni Directory', 'Placement Statistics', 'Career Events'] },
    communication: { id: 'communication', title: 'Communication & Notifications', description: 'Multi-channel communication with students and parents', features: ['Email Notifications', 'SMS Gateway', 'WhatsApp Integration', 'Bulk Messaging', 'Template Management', 'Delivery Reports'] },
    udise: { id: 'udise', title: 'UDISE+ Integration', description: 'Government compliance and data reporting for UDISE+', features: ['UDISE Code Management', 'Data Mapping', 'Annual Reports', 'Compliance Tracking', 'Error Validation', 'Submission Reports'] },
};

const DashboardHome = ({ user }) => (
  <motion.div
    key="dashboard-home"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          Welcome back, {user?.user_metadata?.full_name || user?.email}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening at your institution today.
        </p>
      </div>
    </div>
    <DashboardStats />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RecentActivity />
      <QuickActions />
    </div>
  </motion.div>
);

const DashboardLayout = ({ user, sidebarCollapsed, setSidebarCollapsed, moduleVisibility }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pattern-bg">
    <Helmet>
      <title>Vidya+ College Management System</title>
      <meta name="description" content="Complete college management system with multi-tenant architecture, role-based access, and comprehensive modules for academic, financial, and administrative management." />
      <meta property="og:title" content="Vidya+ College Management System" />
      <meta property="og:description" content="Complete college management system with multi-tenant architecture, role-based access, and comprehensive modules for academic, financial, and administrative management." />
    </Helmet>
    <div className="flex h-screen">
      <Sidebar 
        collapsed={sidebarCollapsed}
        moduleVisibility={moduleVisibility}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>
    </div>
  </div>
);

const App = () => {
  const { user, loading, instituteId } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moduleVisibility, setModuleVisibility] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
        if (!user || !instituteId) {
            setSettingsLoading(false);
            const allVisible = Object.keys(moduleConfig).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {});
            setModuleVisibility(allVisible);
            return;
        };

        try {
            const res = await fetch(`${API_BASE}/settings/module-settings?institute_id=${encodeURIComponent(instituteId)}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                console.error("Error fetching module settings:", data.error || 'Failed to fetch module settings');
                
                // Set initial settings if API fails
                const initialSettings = Object.keys(moduleConfig).reduce((acc, key) => {
                    acc[key] = true; 
                    return acc;
                }, {});
                setModuleVisibility(initialSettings);
            } else if (data && data.settings) {
                setModuleVisibility(data.settings);
            } else {
                // No settings found, set all modules visible by default
                const initialSettings = Object.keys(moduleConfig).reduce((acc, key) => {
                    acc[key] = true; 
                    return acc;
                }, {});
                setModuleVisibility(initialSettings);
            }
        } catch (error) {
            console.error("Network error fetching module settings:", error.message);
            
            // Set initial settings if there's a network error
            const initialSettings = Object.keys(moduleConfig).reduce((acc, key) => {
                acc[key] = true; 
                return acc;
            }, {});
            setModuleVisibility(initialSettings);
        } finally {
            setSettingsLoading(false);
        }
    };

    if (!loading) {
        fetchSettings();
    }
  }, [user, loading, instituteId, API_BASE]);


  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Remove accounts module from visibility as it's merged into finance
  const finalModuleVisibility = {...moduleVisibility, accounts: false };
  delete finalModuleVisibility.accounts;

  // Handler for successful login
  const handleLoginSuccess = () => {
    window.location.href = '/dashboard/home';
  };

  return (
    <Routes location={location} key={location.pathname}>
      {/* Dashboard layout and protected routes */}
      <Route path="/dashboard/*" element={
        user ? (
          <DashboardLayout user={user} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} moduleVisibility={finalModuleVisibility} />
        ) : (
          <Navigate to="/" replace />
        )
      }>
        <Route path="home" element={<DashboardHome user={user} />} />
        <Route path="admission" element={<AdmissionDashboard />} />
        <Route path="students" element={<StudentManagementDashboard />} />
        <Route path="students/add" element={<AddNewStudent />} />
        <Route path="students/edit/:id" element={<EditStudent />} />
        <Route path="finance" element={<FinanceDashboard />} />
        <Route path="attendance" element={<AttendanceDashboard />} />
        <Route path="examination" element={<ExaminationDashboard />} />
        <Route path="online-exam" element={<OnlineExamDashboard />} />
        <Route path="online-exam/results/:studentExamId" element={<ViewResults />} />
        <Route path="documents" element={<DocumentsDashboard />} />
        <Route path="settings" element={<SettingsPage />} />
        {Object.keys(moduleConfig).map(moduleId => (
          (moduleId !== 'admission' && moduleId !== 'students' && moduleId !== 'finance' && moduleId !== 'attendance' && moduleId !== 'examination' && moduleId !== 'documents' && moduleId !== 'accounts' && moduleId !== 'online-exam') && <Route 
            key={moduleId}
            path={`${moduleId}`} 
            element={
              <motion.div
                key={moduleId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ModuleContent module={moduleId} />
              </motion.div>
            } 
          />
        ))}
      </Route>
      {/* Login route */}
      <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
      {/* Explicit website routes */}
      <Route path="/" element={<WebsiteLayout />} />
      <Route path="/about" element={<WebsiteLayout />} />
      <Route path="/gallery" element={<WebsiteLayout />} />
      <Route path="/iqac" element={<WebsiteLayout />} />
      <Route path="/team" element={<WebsiteLayout />} />
      <Route path="/contact" element={<WebsiteLayout />} />
      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
