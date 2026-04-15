import React, { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';

// Import all admin components
import Dashboard from './Dashboard';
import AdmissionDashboard from '@/components/Admission/AdmissionDashboard';
import AddNewStudent from '@/components/Students/AddNewStudent';
import StudentManagementDashboard from '@/components/Students/StudentManagementDashboard';
import EditStudent from '@/components/Students/EditStudent';
import FinanceDashboard from '@/components/Finance/FinanceDashboard';
import AttendanceDashboard from '@/components/Attendance/AttendanceDashboard';
import ExaminationDashboard from '@/components/Examination/ExaminationDashboard';
import OnlineExamDashboard from '@/components/OnlineExam/OnlineExamDashboard';
import TakeExam from '@/components/OnlineExam/TakeExam';
import ViewResults from '@/components/OnlineExam/ViewResults';
import ExamResultsPrint from '@/components/OnlineExam/ExamResultsPrint';
import DocumentsDashboard from '@/components/Documents/DocumentsDashboard';
import FeeCollectionPage from '@/components/Finance/FeeCollectionPage';
import SettingsPage from '@/components/Settings/SettingsPage';
import WebsiteManager from '@/components/WebsiteManager/WebsiteManager';
import ModuleContent from '@/components/Modules/ModuleContent';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, loading, instituteId } = useUser();

    // If not logged in, redirect to login
    if (!loading && !user) {
        return <Navigate to="/admin/login" replace />;
    }

    // If user is already logged in and trying to access login page, redirect to dashboard
    if (user && location.pathname === '/admin/login') {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="flex h-screen">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route index element={<Dashboard />} />
                            <Route path="admission" element={<AdmissionDashboard />} />
                            <Route path="students" element={<StudentManagementDashboard />} />
                            <Route path="students/add" element={<AddNewStudent instituteId={instituteId || user?.institute_id} />} />
                            <Route path="students/edit/:id" element={<EditStudent instituteId={instituteId || user?.institute_id} />} />
                            <Route path="finance" element={<FinanceDashboard />} />
                            <Route path="finance/collect" element={<FeeCollectionPage />} />
                            <Route path="attendance" element={<AttendanceDashboard />} />
                            <Route path="examination" element={<ExaminationDashboard />} />
                            <Route path="online-exam" element={<OnlineExamDashboard />} />
                            <Route path="online-exam/take/:examId" element={<TakeExam />} />
                            <Route path="online-exam/results/:studentExamId" element={<ViewResults />} />
                            <Route path="online-exam/print/:examId" element={<ExamResultsPrint />} />
                            <Route path="documents" element={<DocumentsDashboard />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="website" element={<WebsiteManager />} />

                            {/* Generic module routes */}
                            <Route path="hr" element={<ModuleContent module="hr" />} />
                            <Route path="infrastructure" element={<ModuleContent module="infrastructure" />} />
                            <Route path="library" element={<ModuleContent module="library" />} />
                            <Route path="hostel" element={<ModuleContent module="hostel" />} />
                            <Route path="transport" element={<ModuleContent module="transport" />} />
                            <Route path="placement" element={<ModuleContent module="placement" />} />
                            <Route path="communication" element={<ModuleContent module="communication" />} />
                            <Route path="udise" element={<ModuleContent module="udise" />} />
                        </Routes>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
