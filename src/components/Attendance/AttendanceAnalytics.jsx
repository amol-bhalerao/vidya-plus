import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const AttendanceAnalytics = ({ instituteId }) => {
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/crud/classes?institute_id=${encodeURIComponent(instituteId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching classes');
      }

      const data = await response.json();
      setClasses(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching classes', description: error.message });
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const generateAnalytics = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setLoading(true);
    try {
      // Fetch students
      const studentsRes = await fetch(`${API_BASE}/crud/students?class_id=${encodeURIComponent(selectedClass)}&status=active`, {
        credentials: 'include'
      });
      const students = await studentsRes.json();

      // Fetch recent attendance (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      const attendanceRes = await fetch(`${API_BASE}/crud/attendance?class_id=${encodeURIComponent(selectedClass)}&subject_id=${encodeURIComponent(selectedSubject)}&date_gte=${dateStr}`, {
        credentials: 'include'
      });
      const attendanceData = await attendanceRes.json();

      // Calculate analytics
      const totalStudents = students.length;
      const attendanceByStudent = {};
      
      attendanceData.forEach(att => {
        if (!attendanceByStudent[att.student_id]) {
          attendanceByStudent[att.student_id] = { total: 0, present: 0 };
        }
        attendanceByStudent[att.student_id].total++;
        if (att.status === 'present') {
          attendanceByStudent[att.student_id].present++;
        }
      });

      const studentStats = Object.values(attendanceByStudent).map(stat => ({
        percentage: stat.total > 0 ? (stat.present / stat.total) * 100 : 0
      }));

      const avgAttendance = studentStats.length > 0 
        ? studentStats.reduce((sum, stat) => sum + stat.percentage, 0) / studentStats.length 
        : 0;

      const excellentCount = studentStats.filter(s => s.percentage >= 90).length;
      const goodCount = studentStats.filter(s => s.percentage >= 75 && s.percentage < 90).length;
      const poorCount = studentStats.filter(s => s.percentage < 75).length;

      setAnalytics({
        totalStudents,
        avgAttendance: avgAttendance.toFixed(1),
        excellentCount,
        goodCount,
        poorCount,
        attendanceRate: totalStudents > 0 ? ((excellentCount + goodCount) / totalStudents * 100).toFixed(1) : '0.0'
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error generating analytics', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSubjectsForClass = async () => {
      if (!selectedClass) {
        setSubjects([]);
        setSelectedSubject('');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/crud/class_subjects?class_id=${encodeURIComponent(selectedClass)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Error fetching subjects');
        }

        setSubjects(data || []);
        if ((data || []).length > 0) {
          setSelectedSubject(String(data[0].id));
        } else {
          setSelectedSubject('');
        }
      } catch (error) {
        setSubjects([]);
        setSelectedSubject('');
        toast({ variant: 'destructive', title: 'Error fetching subjects', description: error.message });
      }
    };

    fetchSubjectsForClass();
  }, [selectedClass, toast]);

  useEffect(() => {
    if (selectedClass) {
      generateAnalytics();
    } else {
      setAnalytics(null);
    }
  }, [selectedClass, selectedSubject]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Analytics</CardTitle>
          <CardDescription>Visualize attendance data with charts and statistics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium">Select Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.class_name} {cls.section || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Select Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass || subjects.length === 0}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={selectedClass ? 'Choose a subject' : 'Select class first'} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((sub) => (
                  <SelectItem key={sub.id} value={String(sub.id)}>
                    {sub.subject_name}{sub.subject_code ? ` (${sub.subject_code})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold">{analytics.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                  <p className="text-2xl font-bold">{analytics.avgAttendance}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Good Attendance (≥75%)</p>
                  <p className="text-2xl font-bold">{analytics.attendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Attendance (&lt;75%)</p>
                  <p className="text-2xl font-bold">{analytics.poorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Excellent (≥90%)</span>
                <span>{analytics.excellentCount} students</span>
              </div>
              <Progress value={(analytics.excellentCount / analytics.totalStudents) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Good (75-89%)</span>
                <span>{analytics.goodCount} students</span>
              </div>
              <Progress value={(analytics.goodCount / analytics.totalStudents) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Poor (&lt;75%)</span>
                <span>{analytics.poorCount} students</span>
              </div>
              <Progress value={(analytics.poorCount / analytics.totalStudents) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceAnalytics;