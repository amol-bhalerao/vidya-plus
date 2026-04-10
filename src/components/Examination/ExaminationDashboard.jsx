import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { API_BASE } from '@/lib/constants';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ExamTimetable from './ExamTimetable';
import SyllabusManagement from './SyllabusManagement';
import SeatingArrangement from './SeatingArrangement';
import MarksEntry from './MarksEntry';
import GradeCalculation from './GradeCalculation';
import ReportCards from './ReportCards';

const ExaminationDashboard = () => {
  const { user } = useUser();
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [loading, setLoading] = useState({ institutes: false });

  const userInstituteId = user?.institute_id;
  const userRole = user?.role;
  const isSuperAdmin = userRole === 'super_admin';
  const currentInstituteId = isSuperAdmin ? selectedInstitute : userInstituteId;

  useEffect(() => {
    const fetchInstitutes = async () => {
      if (!isSuperAdmin) {
        if (userInstituteId) setSelectedInstitute(userInstituteId);
        return;
      }
      setLoading(prev => ({ ...prev, institutes: true }));
      try {
        const response = await fetch(`${API_BASE}/institutes`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setInstitutes(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0 && !selectedInstitute) {
          setSelectedInstitute(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching institutes:", error);
        setInstitutes([]);
      } finally {
        setLoading(prev => ({ ...prev, institutes: false }));
      }
    };
    fetchInstitutes();
  }, [isSuperAdmin, userInstituteId]);

  const handleInstituteChange = (instituteId) => {
    setSelectedInstitute(instituteId);
  }

  return (
    <>
      <Helmet>
        <title>Examination Management - Vidya+</title>
        <meta name="description" content="Manage all aspects of academic examinations." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Examination Management</h1>
          <p className="text-gray-600 mt-1">Schedule exams, manage marks, and generate report cards.</p>
        </div>

        {isSuperAdmin && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Super Admin View</AlertTitle>
            <AlertDescription>
              <Select onValueChange={handleInstituteChange} value={selectedInstitute || ''} disabled={loading.institutes}>
                <SelectTrigger><SelectValue placeholder="Select an institute..." /></SelectTrigger>
                <SelectContent>{institutes.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}</SelectContent>
              </Select>
            </AlertDescription>
          </Alert>
        )}

        {currentInstituteId ? (
          <Tabs defaultValue="timetable" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="timetable">Exam Timetable</TabsTrigger>
              <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
              <TabsTrigger value="seating">Seating Plan</TabsTrigger>
              <TabsTrigger value="marks_entry">Marks Entry</TabsTrigger>
              <TabsTrigger value="grades">Grade Calculation</TabsTrigger>
              <TabsTrigger value="report_cards">Report Cards</TabsTrigger>
            </TabsList>
            <TabsContent value="timetable"><ExamTimetable instituteId={currentInstituteId} /></TabsContent>
            <TabsContent value="syllabus"><SyllabusManagement instituteId={currentInstituteId} /></TabsContent>
            <TabsContent value="seating"><SeatingArrangement instituteId={currentInstituteId} /></TabsContent>
            <TabsContent value="marks_entry"><MarksEntry instituteId={currentInstituteId} /></TabsContent>
            <TabsContent value="grades"><GradeCalculation instituteId={currentInstituteId} /></TabsContent>
            <TabsContent value="report_cards"><ReportCards instituteId={currentInstituteId} /></TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Select an Institute</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Please select an institute to manage examinations.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </>
  );
};

export default ExaminationDashboard;