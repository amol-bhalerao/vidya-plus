import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const AttendanceReport = ({ instituteId }) => {
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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

  useEffect(() => {
    const fetchStudentsForClass = async () => {
      if (!selectedClass) { setStudents([]); return; }
      try {
        const response = await fetch(`${API_BASE}/crud/students?class_id=${encodeURIComponent(selectedClass)}&status=active`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching students');
        }

        const data = await response.json();
        setStudents(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching students', description: error.message });
      }
    }
    fetchStudentsForClass();
  }, [selectedClass, toast]);

  const generateReport = async () => {
    if (!selectedClass || !selectedMonth) return;
    
    setLoading(true);
    try {
      const monthStr = format(selectedMonth, 'yyyy-MM');
      const response = await fetch(`${API_BASE}/crud/attendance?class_id=${encodeURIComponent(selectedClass)}&month=${monthStr}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching attendance data');
      }

      const data = await response.json();
      
      // Process data to create report
      const report = students.map(student => {
        const studentAttendance = data.filter(att => att.student_id == student.id);
        const totalDays = studentAttendance.length;
        const presentDays = studentAttendance.filter(att => att.status === 'present').length;
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;
        
        return {
          student_id: student.id,
          student_name: student.full_name,
          gr_no: student.gr_no,
          total_days: totalDays,
          present_days: presentDays,
          percentage: percentage
        };
      });
      
      setAttendanceData(report);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error generating report', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (attendanceData.length === 0) return;
    
    const csvContent = [
      ['GR No', 'Student Name', 'Total Days', 'Present Days', 'Attendance %'],
      ...attendanceData.map(row => [row.gr_no, row.student_name, row.total_days, row.present_days, row.percentage])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${format(selectedMonth, 'yyyy_MM')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Attendance Reports</CardTitle>
        <CardDescription>Generate and view detailed attendance reports by class and month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">Select Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
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
          <div className="flex-1">
            <label className="text-sm font-medium">Select Month</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedMonth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedMonth ? format(selectedMonth, "MMMM yyyy") : "Pick a month"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={setSelectedMonth}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={generateReport} disabled={!selectedClass || !selectedMonth || loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          {attendanceData.length > 0 && (
            <Button variant="outline" onClick={exportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

        {attendanceData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GR No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Present Days</TableHead>
                <TableHead>Attendance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((row) => (
                <TableRow key={row.student_id}>
                  <TableCell>{row.gr_no}</TableCell>
                  <TableCell>{row.student_name}</TableCell>
                  <TableCell>{row.total_days}</TableCell>
                  <TableCell>{row.present_days}</TableCell>
                  <TableCell className={row.percentage < 75 ? 'text-red-600 font-semibold' : ''}>
                    {row.percentage}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceReport;