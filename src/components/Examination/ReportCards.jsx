import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';

const ReportCardPrintable = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  const { student, exam, results, summary } = data;

  return (
    <div ref={ref} className="p-4 font-sans text-black text-[10px]">
      <style>{`
        @page { size: A5 landscape; margin: 10mm; }
        .report-card-table th, .report-card-table td {
          border: 1px solid black;
          padding: 4px;
        }
      `}</style>
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {student.institute_logo && <img src={student.institute_logo} alt="Logo" className="h-16 w-16 object-contain" />}
          <h1 className="text-xl font-bold">{student.institute_name}</h1>
        </div>
        <div className="text-right">
          <p className="font-semibold">ACADEMIC REPORT CARD</p>
          <p>{exam.name}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4 text-xs">
        <p><strong>Student Name:</strong> {student.full_name}</p>
        <p><strong>GR No:</strong> {student.gr_no}</p>
        <p><strong>Course:</strong> {student.course_name}</p>
        <p><strong>Class:</strong> {student.class_name} {student.section || ''}</p>
        <p><strong>Date of Birth:</strong> {format(new Date(student.date_of_birth), 'dd-MMM-yyyy')}</p>
        <p><strong>ABC Number:</strong> {student.abc_number || 'N/A'}</p>
      </div>

      <table className="w-full border-collapse report-card-table text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left">Subject</th>
            <th>Max Marks</th>
            <th>Marks Obtained</th>
            <th>Percentage</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {results.map(res => (
            <tr key={res.subject_name}>
              <td>{res.subject_name}</td>
              <td className="text-center">{res.max_marks}</td>
              <td className="text-center">{res.is_absent ? 'AB' : res.marks_obtained}</td>
              <td className="text-center">{res.is_absent ? 'AB' : `${res.percentage?.toFixed(2) || 'N/A'}%`}</td>
              <td className="text-center">{res.is_absent ? 'AB' : res.grade || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 p-2 border border-black grid grid-cols-3 gap-4 text-xs">
        <p><strong>Total Marks:</strong> {summary.total_marks_obtained} / {summary.total_max_marks}</p>
        <p><strong>Overall Percentage:</strong> {summary.overall_percentage?.toFixed(2) || 'N/A'}%</p>
        <p><strong>Overall Grade:</strong> {summary.overall_grade || 'N/A'}</p>
      </div>
      <p className="mt-2 text-xs font-semibold">Result: {parseFloat(summary.overall_percentage) >= 40 ? 'PASS' : 'FAIL'}</p>

      <footer className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-xs">
        <p>Date of Issue: {format(new Date(), 'dd-MMM-yyyy')}</p>
        <div className="text-center">
          <div className="h-12"></div>
          <p className="border-t border-black pt-1 px-8">Principal's Signature</p>
        </div>
      </footer>
    </div>
  );
});

const ReportCards = ({ instituteId }) => {
  const { toast } = useToast();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const fetchData = useCallback(async (table, setter, filters = {}) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({ institute_id: instituteId });
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, value);
      });

      const response = await fetch(`${API_BASE}/${table}?${queryParams}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching ${table}`);
      }

      const data = await response.json();
      setter(data);
    } catch (error) {
      toast({ variant: 'destructive', title: `Error fetching ${table}`, description: error.message });
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchData('exams', setExams);
    fetchData('classes', setClasses);
  }, [fetchData]);

  useEffect(() => {
    if (selectedClass) {
      fetchData('students', setStudents, { class_id: selectedClass, status: 'active' });
    } else {
      setStudents([]);
      setSelectedStudent('');
    }
  }, [selectedClass, fetchData]);

  const generateReport = async () => {
    if (!selectedExam || !selectedStudent) return;
    setLoading(true);
    setReportData(null);

    try {
      const response = await fetch(`${API_BASE}/student-report-card`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent,
          exam_id: selectedExam
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generating report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error generating report', description: error.message });
    }
    setLoading(false);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <Card className="mt-4">
      <CardHeader className="print-hidden">
        <CardTitle>Report Cards</CardTitle>
        <CardDescription>Generate and view student report cards.</CardDescription>
        <div className="flex flex-col md:flex-row gap-2 pt-4">
          <Select onValueChange={setSelectedExam} value={selectedExam}>
            <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
            <SelectContent>{exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedExam}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}{c.section && ` - ${c.section}`}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedStudent} value={selectedStudent} disabled={!selectedClass}>
            <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
            <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.gr_no})</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={generateReport} disabled={!selectedStudent || loading}>{loading ? 'Generating...' : 'Generate Report'}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {reportData ? (
          <div>
            <div className="flex justify-end mb-4 print-hidden">
              <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Report Card (A5 Landscape)</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <ReportCardPrintable data={reportData} ref={printRef} />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">Please generate a report to view details.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportCards;