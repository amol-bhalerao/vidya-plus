import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { API_BASE } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const AttendanceSheet = ({ classId, date, instituteId }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0, unmarked: 0 });

  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    const formattedDate = format(date, 'yyyy-MM-dd');

    try {
      // Fetch students in the class
      const studentsResponse = await fetch(`${API_BASE}/students/class/${classId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!studentsResponse.ok) {
        throw new Error(`Error fetching students: ${studentsResponse.status}`);
      }

      const studentsData = await studentsResponse.json();
      setStudents(studentsData.data || []);

      // Fetch existing attendance for that day
      const attendanceResponse = await fetch(`${API_BASE}/attendance/class/${classId}/date/${formattedDate}`, {
        method: 'GET',
        credentials: 'include'
      });

      const initialAttendance = {};
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        if (attendanceData.data) {
          attendanceData.data.forEach(att => {
            initialAttendance[att.student_id] = att.status;
          });
        }
      }

      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load attendance data.' });
      setStudents([]);
      setAttendance({});
    } finally {
      setLoading(false);
    }
  }, [classId, date, toast]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  useEffect(() => {
    const present = Object.values(attendance).filter(s => s === 'present').length;
    const absent = Object.values(attendance).filter(s => s === 'absent').length;
    const leave = Object.values(attendance).filter(s => s === 'leave').length;
    const unmarked = students.length - (present + absent + leave);
    setStats({ present, absent, leave, unmarked });
  }, [attendance, students]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status) => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    setSaving(true);
    const formattedDate = format(date, 'yyyy-MM-dd');

    const recordsToSave = Object.entries(attendance).map(([student_id, status]) => ({
      student_id,
      class_id: classId,
      institute_id: instituteId,
      date: formattedDate,
      status,
      marked_by: user.id,
    }));

    if (recordsToSave.length === 0) {
      toast({ description: "No attendance to save." });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/attendance/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ records: recordsToSave })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      toast({ title: 'Success!', description: 'Attendance has been saved.' });
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({ variant: 'destructive', title: 'Failed to save attendance', description: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading attendance sheet...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Attendance for {format(date, 'PPPP')}</CardTitle>
              <CardDescription>Total Students: {students.length}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="success">Present: {stats.present}</Badge>
              <Badge variant="destructive">Absent: {stats.absent}</Badge>
              <Badge variant="secondary">Leave: {stats.leave}</Badge>
              <Badge variant="outline">Unmarked: {stats.unmarked}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => markAll('present')}>Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={() => markAll('absent')}>Mark All Absent</Button>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GR No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(student => (
                <TableRow key={student.id}>
                  <TableCell>{student.gr_no}</TableCell>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant={attendance[student.id] === 'present' ? 'default' : 'outline'} onClick={() => handleStatusChange(student.id, 'present')}>Present</Button>
                      <Button size="sm" variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'} onClick={() => handleStatusChange(student.id, 'absent')}>Absent</Button>
                      <Button size="sm" variant={attendance[student.id] === 'leave' ? 'secondary' : 'outline'} onClick={() => handleStatusChange(student.id, 'leave')}>Leave</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AttendanceSheet;