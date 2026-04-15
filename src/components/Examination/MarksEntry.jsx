import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const MarksEntry = ({ instituteId }) => {
  const { toast } = useToast();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [timetableEntry, setTimetableEntry] = useState(null);
  
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [loading, setLoading] = useState({ exams: true, classes: true, subjects: false, students: false });

  const fetchData = useCallback(async (table, setter, extraFilters = {}) => {
    setLoading(prev => ({ ...prev, [table]: true }));
    try {
      let queryParams = `institute_id=${instituteId}`;
      for (const [key, value] of Object.entries(extraFilters)) {
        queryParams += `&${key}=${value}`;
      }
      
      const response = await fetch(`/crud/${table}?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setter(data);
    } catch (error) {
      toast({ variant: 'destructive', title: `Error fetching ${table}`, description: error.message });
    } finally {
      setLoading(prev => ({ ...prev, [table]: false }));
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchData('exams', setExams);
    fetchData('classes', setClasses);
  }, [fetchData]);

  useEffect(() => {
    if (selectedClass && selectedExam) {
      const fetchSubjectsForClass = async () => {
        setLoading(p => ({...p, subjects: true}));
        try {
          const response = await fetch(`/crud/exam_timetable?class_id=${selectedClass}&exam_id=${selectedExam}&expand=subjects`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const uniqueSubjects = Array.from(new Map(data.map(item => [item.subjects.id, item.subjects])).values());
          setSubjects(uniqueSubjects);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error fetching subjects', description: error.message });
        } finally {
          setLoading(p => ({...p, subjects: false}));
        }
      };
      fetchSubjectsForClass();
    } else {
      setSubjects([]);
    }
  }, [selectedClass, selectedExam, toast]);
  
  const fetchStudentsAndMarks = useCallback(async () => {
    if (!selectedClass || !selectedExam || !selectedSubject) return;

    setLoading(p => ({ ...p, students: true }));

    try {
      // 1. Get the timetable entry
      const timetableResponse = await fetch(`/crud/exam_timetable?exam_id=${selectedExam}&class_id=${selectedClass}&subject_id=${selectedSubject}`);
      if (!timetableResponse.ok) {
        throw new Error('Could not find a timetable entry for this selection.');
      }
      const timetableData = await timetableResponse.json();
      if (!timetableData || timetableData.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find a timetable entry for this selection.' });
        setLoading(p => ({ ...p, students: false }));
        return;
      }
      const ttEntry = timetableData[0];
      setTimetableEntry(ttEntry);

      // 2. Fetch students of the class
      const studentsResponse = await fetch(`/crud/students?class_id=${selectedClass}&status=active`);
      if (!studentsResponse.ok) {
        throw new Error('Error fetching students');
      }
      const studentsData = await studentsResponse.json();
      setStudents(studentsData);

      // 3. Fetch existing marks
      let marksData = [];
      const marksResponse = await fetch(`/crud/exam_marks?timetable_id=${ttEntry.id}`);
      if (marksResponse.ok) {
        marksData = await marksResponse.json();
      }

      const latestMarksByStudent = new Map();
      (marksData || []).forEach(mark => {
        latestMarksByStudent.set(String(mark.student_id), mark);
      });

      const marksMap = {};
      studentsData.forEach(student => {
        const mark = latestMarksByStudent.get(String(student.id));
        marksMap[student.id] = {
          marks_obtained: mark?.marks_obtained ?? '',
          is_absent: mark?.is_absent ?? false
        };
      });
      setMarks(marksMap);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(p => ({ ...p, students: false }));
    }
  }, [selectedClass, selectedExam, selectedSubject, toast]);

  useEffect(() => {
    fetchStudentsAndMarks();
  }, [fetchStudentsAndMarks]);

  const handleMarkChange = (studentId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks_obtained: value },
    }));
  };
  
  const handleAbsenceChange = (studentId, isAbsent) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { marks_obtained: '', is_absent: isAbsent },
    }));
  };

  const handleSaveMarks = async () => {
    if (!timetableEntry) return;

    const upsertData = Object.entries(marks).map(([student_id, markData]) => ({
      timetable_id: timetableEntry.id,
      student_id,
      marks_obtained: markData.is_absent ? null : (markData.marks_obtained === '' ? null : Number(markData.marks_obtained)),
      is_absent: markData.is_absent,
      institute_id: instituteId,
    }));

    try {
      const response = await fetch('/crud/exam_marks/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(upsertData)
      });
      
      if (!response.ok) {
        throw new Error('Error saving marks');
      }
      
      toast({ title: 'Marks saved successfully!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving marks', description: error.message });
    }
  };


  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Marks Entry</CardTitle>
        <CardDescription>Enter student marks for exams.</CardDescription>
        <div className="flex gap-2 pt-4">
          <Select onValueChange={setSelectedExam} value={selectedExam} disabled={loading.exams}>
            <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
            <SelectContent>{exams.map(exam => <SelectItem key={exam.id} value={String(exam.id)}>{exam.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedExam || loading.classes}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.class_name}{c.section && ` - ${c.section}`}</SelectItem>)}</SelectContent>
          </Select>
           <Select onValueChange={setSelectedSubject} value={selectedSubject} disabled={!selectedClass || loading.subjects}>
            <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
            <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.subject_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {students.length > 0 && timetableEntry ? (
          <>
            <div className="flex justify-between items-center mb-4">
               <p>Max Marks: <strong>{timetableEntry.max_marks}</strong></p>
               <Button onClick={handleSaveMarks}>Save Marks</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GR No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Marks Obtained</TableHead>
                  <TableHead>Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.gr_no}</TableCell>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        value={marks[student.id]?.marks_obtained ?? ''}
                        onChange={e => handleMarkChange(student.id, e.target.value)}
                        disabled={Boolean(marks[student.id]?.is_absent)}
                        max={timetableEntry.max_marks}
                        min={0}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`absent-${student.id}`}
                          checked={Boolean(marks[student.id]?.is_absent)}
                          onCheckedChange={checked => handleAbsenceChange(student.id, checked)}
                        />
                        <Label htmlFor={`absent-${student.id}`}>Mark as absent</Label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <p className="text-center text-gray-500 py-4">
            {loading.students ? 'Loading students...' : 'Please select an exam, class, and subject to enter marks.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MarksEntry;