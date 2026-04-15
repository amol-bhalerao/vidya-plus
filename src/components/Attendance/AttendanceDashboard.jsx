import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { Info, Calendar as CalendarIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AttendanceSheet from './AttendanceSheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceReport from './AttendanceReport';
import AttendanceAnalytics from './AttendanceAnalytics';

const AttendanceDashboard = () => {
  const { instituteId, user, isSuperAdmin } = useUser();
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [loading, setLoading] = useState({ institutes: false, courses: false, classes: false });

  const currentInstituteId = isSuperAdmin ? selectedInstitute : instituteId;

  useEffect(() => {
    const fetchInstitutes = async () => {
      if (!isSuperAdmin) {
        setSelectedInstitute(instituteId);
        return;
      }
      setLoading(prev => ({ ...prev, institutes: true }));
      try {
        const response = await fetch(`${API_BASE}/institutes`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok) {
          setInstitutes(data);
          if (data.length > 0 && !selectedInstitute) {
            setSelectedInstitute(data[0].id);
          }
        } else {
          console.error("Error fetching institutes:", data.error || 'Unknown error');
        }
      } catch (error) {
        console.error("Error fetching institutes:", error);
      } finally {
        setLoading(prev => ({ ...prev, institutes: false }));
      }
    };
    fetchInstitutes();
  }, [isSuperAdmin, instituteId]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!currentInstituteId) {
        setCourses([]);
        setSelectedCourse('');
        return;
      };
      setLoading(prev => ({ ...prev, courses: true }));
      try {
        const response = await fetch(`${API_BASE}/courses?institute_id=${currentInstituteId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok) {
          setCourses(data || []);
        } else {
          console.error("Error fetching courses:", data.error || 'Unknown error');
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };
    fetchCourses();
  }, [currentInstituteId]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedCourse) {
        setClasses([]);
        setSelectedClass('');
        return;
      };
      setLoading(prev => ({ ...prev, classes: true }));
      try {
        const response = await fetch(`${API_BASE}/classes?course_id=${selectedCourse}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok) {
          setClasses(data || []);
        } else {
          console.error("Error fetching classes:", data.error || 'Unknown error');
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(prev => ({ ...prev, classes: false }));
      }
    };
    fetchClasses();
  }, [selectedCourse]);

  return (
    <>
      <Helmet>
        <title>Attendance Management - Vidya+</title>
        <meta name="description" content="Manage daily student attendance efficiently." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Take attendance, view reports, and analyze trends.</p>
        </div>

        {isSuperAdmin && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Super Admin View</AlertTitle>
            <AlertDescription>
              <Select onValueChange={setSelectedInstitute} value={selectedInstitute || ''} disabled={loading.institutes}>
                <SelectTrigger><SelectValue placeholder="Select an institute..." /></SelectTrigger>
                <SelectContent>{institutes.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}</SelectContent>
              </Select>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="daily_attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily_attendance">Daily Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="daily_attendance">
            <div className="bg-white/80 p-6 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mt-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select id="course" onValueChange={setSelectedCourse} value={selectedCourse} disabled={!currentInstituteId || loading.courses}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loading.courses ? 'Loading...' : 'Select Course'} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select id="class" onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedCourse || loading.classes}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loading.classes ? 'Loading...' : 'Select Class'} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}{c.section && ` (${c.section})`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !attendanceDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {attendanceDate ? format(attendanceDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={attendanceDate} onSelect={setAttendanceDate} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent>
                </Popover>
              </div>
            </div>
            
            {selectedClass && attendanceDate && currentInstituteId ? (
              <div className="mt-6">
                <AttendanceSheet
                  key={`${selectedClass}-${attendanceDate.toISOString()}`}
                  classId={selectedClass}
                  date={attendanceDate}
                  instituteId={currentInstituteId}
                />
              </div>
            ) : (
              <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm mt-6">
                <p className="text-gray-500">Please select a class and date to view the attendance sheet.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="reports">
            <AttendanceReport instituteId={currentInstituteId} />
          </TabsContent>
          <TabsContent value="analytics">
            <AttendanceAnalytics instituteId={currentInstituteId} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
};

export default AttendanceDashboard;