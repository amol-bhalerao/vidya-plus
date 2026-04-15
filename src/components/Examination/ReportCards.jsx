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

const formatDisplayDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : format(parsed, 'dd-MMM-yyyy');
};

const formatMarksPair = (obtained, max) => {
  if (!max) return '--';
  if (obtained === null || obtained === undefined) return 'AB';
  return `${Number(obtained).toFixed(0)} / ${Number(max).toFixed(0)}`;
};

const ReportCardPrintable = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  const { student, exam, results, summary } = data;

  return (
    <div ref={ref} className="a4-page print-sheet bg-white p-6 font-serif text-black text-[11px]">
      <style>{`
        @page { size: A4; margin: 10mm; }
        .report-card-table th, .report-card-table td {
          border: 1px solid #111827;
          padding: 6px;
        }
      `}</style>

      <header className="border-b-2 border-black pb-3">
        <div className="flex items-center gap-4">
          {student.institute_logo && <img src={student.institute_logo} alt="Institute Logo" className="h-16 w-16 object-contain" />}
          <div className="flex-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide">Affiliated college demo pattern</p>
            <h1 className="text-lg font-bold uppercase">{student.university_name || 'Swami Ramanand Teerth Marathwada University, Nanded'}</h1>
            <p className="text-base font-semibold">{student.institute_name}</p>
            <p className="text-[10px]">Bachelor of Computer Applications • {student.year_label} • {student.semester_label}</p>
          </div>
        </div>
      </header>

      <div className="mt-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">{exam.report_heading || 'Statement of Marks / Semester Grade Card'}</p>
        <p className="text-sm font-semibold">{exam.name}</p>
        <p className="mt-1 text-[10px] text-gray-700">{exam.pattern_note}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border border-black p-3 text-[11px]">
        <p><strong>Student Name:</strong> {student.full_name}</p>
        <p><strong>Seat No.:</strong> {student.seat_no || 'N/A'}</p>
        <p><strong>GR No.:</strong> {student.gr_no}</p>
        <p><strong>ABC ID:</strong> {student.abc_number || 'N/A'}</p>
        <p><strong>Course / Class:</strong> {student.course_name} • {student.class_name} {student.section || ''}</p>
        <p><strong>Academic Year:</strong> {student.academic_year || 'N/A'}</p>
        <p><strong>Date of Birth:</strong> {formatDisplayDate(student.date_of_birth)}</p>
        <p><strong>Result Status:</strong> {summary.result || 'N/A'}</p>
      </div>

      <table className="report-card-table mt-4 w-full border-collapse text-[10px]">
        <thead className="bg-gray-100">
          <tr>
            <th>Code</th>
            <th className="text-left">Subject</th>
            <th>Cr</th>
            <th>IA / Practical</th>
            <th>ESE / Viva</th>
            <th>Total</th>
            <th>Grade</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res, index) => (
            <tr key={res.timetable_id ?? `${res.subject_id}-${index}`}>
              <td className="text-center">{res.subject_code || 'BCA'}</td>
              <td>
                <div className="font-semibold">{res.subject_name}</div>
                <div className="text-[9px] text-gray-600">{res.paper_type} • {res.component_label}</div>
              </td>
              <td className="text-center">{res.credits}</td>
              <td className="text-center">{formatMarksPair(res.internal_marks, res.internal_max)}</td>
              <td className="text-center">{res.external_max ? formatMarksPair(res.external_marks, res.external_max) : '--'}</td>
              <td className="text-center">{res.is_absent ? 'AB' : `${Number(res.marks_obtained || 0).toFixed(0)} / ${Number(res.total_max || res.max_marks || 0).toFixed(0)}`}</td>
              <td className="text-center font-semibold">{res.grade || 'N/A'}</td>
              <td className="text-center font-semibold">{res.result || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 grid grid-cols-2 gap-4 text-[11px]">
        <div className="border border-black p-3">
          <h3 className="mb-2 font-semibold uppercase">Summary</h3>
          <div className="space-y-1">
            <p><strong>Total Marks:</strong> {summary.total_marks_obtained} / {summary.total_max_marks}</p>
            <p><strong>Percentage:</strong> {summary.overall_percentage?.toFixed(2)}%</p>
            <p><strong>Overall Grade:</strong> {summary.overall_grade}</p>
            <p><strong>SGPA:</strong> {summary.sgpa ?? 'N/A'}</p>
            <p><strong>Credits Earned:</strong> {summary.credits_earned} / {summary.credits_registered}</p>
            <p><strong>Class Award:</strong> {summary.class_award}</p>
            <p><strong>Final Result:</strong> {summary.result}</p>
          </div>
        </div>

        <div className="border border-black p-3">
          <h3 className="mb-2 font-semibold uppercase">Pattern Note</h3>
          <p className="leading-relaxed text-[10px] text-gray-700">{exam.pattern_note}</p>
          <div className="mt-3 rounded border border-dashed border-gray-400 p-2 text-[10px]">
            <p><strong>Grade scale:</strong> O ≥ 90, A+ ≥ 80, A ≥ 70, B+ ≥ 60, B ≥ 50, C ≥ 40.</p>
            <p className="mt-1"><strong>Remark:</strong> This marksheet follows an SRTMUN-affiliated BCA demo structure prepared for the local showcase.</p>
          </div>
        </div>
      </div>

      <footer className="mt-8 grid grid-cols-3 gap-8 text-center text-[11px]">
        <div>
          <div className="h-10" />
          <p className="border-t border-black pt-1">Class Teacher</p>
        </div>
        <div>
          <div className="h-10" />
          <p className="border-t border-black pt-1">Exam In-Charge</p>
        </div>
        <div>
          <div className="h-10" />
          <p className="border-t border-black pt-1">Principal</p>
        </div>
      </footer>

      <p className="mt-4 text-right text-[10px]">Date of Issue: {formatDisplayDate(new Date())}</p>
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
    contentRef: printRef,
    documentTitle: reportData ? `${reportData.student.full_name}_report_card_${reportData.exam.name}` : 'report-card',
  });

  return (
    <Card className="mt-4">
      <CardHeader className="print-hidden">
        <CardTitle>Report Cards</CardTitle>
        <CardDescription>Generate and view student report cards.</CardDescription>
        <div className="flex flex-col md:flex-row gap-2 pt-4">
          <Select onValueChange={setSelectedExam} value={selectedExam}>
            <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
            <SelectContent>{exams.map(exam => <SelectItem key={exam.id} value={String(exam.id)}>{exam.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedExam}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.class_name}{c.section && ` - ${c.section}`}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedStudent} value={selectedStudent} disabled={!selectedClass}>
            <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
            <SelectContent>{students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.full_name} ({s.gr_no})</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={generateReport} disabled={!selectedStudent || loading}>{loading ? 'Generating...' : 'Generate Report'}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {reportData ? (
          <div>
            <div className="flex justify-end mb-4 print-hidden">
              <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Marksheet</Button>
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