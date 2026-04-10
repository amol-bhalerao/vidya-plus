import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import ModuleSettings from '@/components/Modules/ModuleSettings';
import BulkUploadStudents from './BulkUploadStudents';
import { useUser } from '@/contexts/UserContext';

const moduleConfigData = {
    admission: { id: 'admission', title: 'Admission Management', description: 'Manage student admissions, registrations, and approval workflows', features: ['Student Registration', 'GR Number Generation', 'Aadhaar Verification', 'Admission Approval', 'Previous School Details', 'Admission Register'] },
    students: { id: 'students', title: 'Student Management', description: 'Complete student profile management and academic tracking', features: ['Student Profiles', 'Caste/Category Management', 'Document Upload', 'Student Promotion', 'Academic History', 'Parent Information'] },
    attendance: { id: 'attendance', title: 'Attendance Management', description: 'Track daily and monthly attendance with comprehensive reports', features: ['Daily Attendance', 'Monthly Reports', 'Subject-wise Tracking', 'Parent Notifications', 'Attendance Analytics', 'Defaulter Reports'] },
    examination: { id: 'examination', title: 'Examination & Academic Management', description: 'Comprehensive exam management and academic evaluation', features: ['Exam Timetable', 'Syllabus Management', 'Seating Arrangement', 'Marks Entry', 'Grade Calculation', 'Report Cards'] },
    finance: { id: 'finance', title: 'Finance Management', description: 'Complete financial management with fee collection and reporting', features: ['Fee Collection', 'Payment Methods', 'Fee Receipts', 'Expense Management', 'Financial Reports', 'Outstanding Dues'] },
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


const ModuleContent = ({ module }) => {
  const user = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleFeatureClick = (featureName, moduleName) => {
    if (moduleName === 'attendance' && featureName === 'Daily Attendance') {
      navigate('/attendance');
      return;
    }

    if (moduleName === 'documents') {
      navigate('/documents', { state: { feature: featureName } });
      return;
    }

    toast({
      title: "Feature Access",
      description: `🚧 ${featureName} feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀`,
    });
  };

  const instituteId = user?.institute_id;
  const config = moduleConfigData[module];

  if (module === 'dashboard') {
    return null; 
  }

  if (!config) {
    return (
      <motion.div 
        className="text-center p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold">Module Not Found</h2>
        <p>The selected module could not be found or you do not have access.</p>
      </motion.div>
    );
  }
  
  if (module === 'settings' && user?.role !== 'super_admin') {
    const menuItems = Object.values(moduleConfigData).map(c => ({ id: c.id, label: c.title }));
    return <ModuleSettings instituteId={instituteId} menuItems={menuItems} />;
  }
  
  const isStudentModule = module === 'students';
  const canSeeBulkUpload = isStudentModule && user?.role !== 'super_admin' && instituteId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
        <p className="text-blue-100">{config.description}</p>
      </div>

      {canSeeBulkUpload && <BulkUploadStudents instituteId={instituteId} />}
      
      {module === 'settings' && user?.role === 'super_admin' && (
        <Card className="card-hover bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Super Admin View</CardTitle>
          </CardHeader>
          <CardContent>
            <p>As a super admin, your role is to manage institutes and system-wide configurations. Institute-specific settings are managed by Institute Admins.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {config.features.map((feature, index) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="card-hover bg-white/80 backdrop-blur-sm border-white/20 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {feature}
                  <Badge variant="secondary">Available</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Access and manage {feature.toLowerCase()} functionality with comprehensive tools and reports.
                </p>
                <Button 
                  onClick={() => handleFeatureClick(feature, module)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Open {feature}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ModuleContent;