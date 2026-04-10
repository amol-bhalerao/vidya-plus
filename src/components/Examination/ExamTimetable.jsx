import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarPlus as CalendarIcon, PlusCircle, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ExamTimetable = ({ instituteId }) => {
  const { toast } = useToast();
  const [exams, setExams] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isTimetableDialogOpen, setIsTimetableDialogOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [currentTimetableEntry, setCurrentTimetableEntry] = useState(null);

  const fetchExams = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/exams?institute_id=${encodeURIComponent(instituteId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching exams');
      }

      const data = await response.json();
      setExams(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching exams', description: error.message });
    }
  }, [instituteId, toast]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/courses?institute_id=${encodeURIComponent(instituteId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching courses');
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching courses', description: error.message });
    }
  }, [instituteId, toast]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchExams(), fetchCourses()]).finally(() => setLoading(false));
  }, [fetchExams, fetchCourses]);

  useEffect(() => {
    const fetchClassesForCourse = async () => {
      if (!selectedCourse) { setClasses([]); return; }
      try {
        const response = await fetch(`${API_BASE}/classes?course_id=${encodeURIComponent(selectedCourse)}`, {
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
    }
    fetchClassesForCourse();
  }, [selectedCourse, toast, API_BASE]);

  useEffect(() => {
    const fetchSubjectsForClass = async () => {
      if (!selectedClass) { setSubjects([]); return; }
      try {
        const response = await fetch(`${API_BASE}/class-subjects?class_id=${encodeURIComponent(selectedClass)}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching subjects');
        }

        const data = await response.json();
        // Assuming the API returns subjects directly without needing to map
        setSubjects(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching subjects', description: error.message });
      }
    };
    fetchSubjectsForClass();
  }, [selectedClass, toast, API_BASE]);

  const fetchTimetable = async (examId, classId) => {
    if (!examId || !classId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/exam-timetable?exam_id=${encodeURIComponent(examId)}&class_id=${encodeURIComponent(classId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching timetable');
      }

      const data = await response.json();
      setTimetables(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching timetable', description: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedExam && selectedClass) {
      fetchTimetable(selectedExam, selectedClass);
    } else {
      setTimetables([]);
    }
  }, [selectedExam, selectedClass]);

  const handleCreateExam = async () => {
    if (!newExamName.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/exams`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newExamName, institute_id: instituteId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating exam');
      }

      const data = await response.json();
      toast({ title: 'Exam created successfully!' });
      setExams(prev => [...prev, data]);
      setNewExamName('');
      setIsExamDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error creating exam', description: error.message });
    }
  };

  const handleSaveTimetableEntry = async () => {
    if (!currentTimetableEntry || !currentTimetableEntry.subject_id || !currentTimetableEntry.exam_date || !currentTimetableEntry.start_time || !currentTimetableEntry.end_time || !currentTimetableEntry.max_marks) {
      toast({ variant: 'destructive', title: 'All fields are required.' });
      return;
    }

    const entryToSave = {
      ...currentTimetableEntry,
      exam_id: selectedExam,
      class_id: selectedClass,
      institute_id: instituteId,
    };

    try {
      const response = await fetch(`${API_BASE}/exam-timetable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToSave)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving timetable entry');
      }

      toast({ title: 'Timetable entry saved!' });
      fetchTimetable(selectedExam, selectedClass);
      setIsTimetableDialogOpen(false);
      setCurrentTimetableEntry(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving timetable entry', description: error.message });
    }
  };

  const openTimetableDialog = (entry = null) => {
    setCurrentTimetableEntry(entry || { subject_id: '', exam_date: new Date(), start_time: '10:00', end_time: '13:00', max_marks: 100 });
    setIsTimetableDialogOpen(true);
  };

  const handleDeleteEntry = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/exam-timetable`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting entry');
      }

      toast({ title: 'Entry deleted successfully' });
      fetchTimetable(selectedExam, selectedClass);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting entry', description: error.message });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Exam Timetable</CardTitle>
        <CardDescription>Create and manage exam schedules.</CardDescription>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-4">
          <Select onValueChange={setSelectedExam} value={selectedExam || ''}>
            <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
            <SelectContent>{exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedCourse} value={selectedCourse || ''} disabled={!selectedExam}>
            <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
            <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedClass} value={selectedClass || ''} disabled={!selectedCourse}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}{c.section && ` - ${c.section}`}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
            <DialogTrigger asChild><Button>Create New Exam</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Exam</DialogTitle></DialogHeader>
              <Input placeholder="E.g., Mid-Term Examination" value={newExamName} onChange={e => setNewExamName(e.target.value)} />
              <DialogFooter><Button onClick={handleCreateExam}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {selectedExam && selectedClass ? (
          <>
            <div className="flex justify-end mb-4">
              <Dialog open={isTimetableDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentTimetableEntry(null); setIsTimetableDialogOpen(isOpen); }}>
                <DialogTrigger asChild><Button onClick={() => openTimetableDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add Entry</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><DialogTitle>{currentTimetableEntry?.id ? 'Edit' : 'Add'} Timetable Entry</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="subject" className="text-right">Subject</Label>
                      <Select value={currentTimetableEntry?.subject_id} onValueChange={(val) => setCurrentTimetableEntry(p => ({ ...p, subject_id: val }))}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !currentTimetableEntry?.exam_date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentTimetableEntry?.exam_date ? format(new Date(currentTimetableEntry.exam_date), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentTimetableEntry?.exam_date ? new Date(currentTimetableEntry.exam_date) : null} onSelect={(d) => setCurrentTimetableEntry(p => ({ ...p, exam_date: format(d, 'yyyy-MM-dd') }))} initialFocus /></PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="start_time" className="text-right">Start Time</Label>
                      <Input id="start_time" type="time" value={currentTimetableEntry?.start_time} onChange={(e) => setCurrentTimetableEntry(p => ({ ...p, start_time: e.target.value }))} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="end_time" className="text-right">End Time</Label>
                      <Input id="end_time" type="time" value={currentTimetableEntry?.end_time} onChange={(e) => setCurrentTimetableEntry(p => ({ ...p, end_time: e.target.value }))} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="max_marks" className="text-right">Max Marks</Label>
                      <Input id="max_marks" type="number" value={currentTimetableEntry?.max_marks} onChange={(e) => setCurrentTimetableEntry(p => ({ ...p, max_marks: e.target.value }))} className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleSaveTimetableEntry}>Save</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timetables.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.subjects.subject_name}</TableCell>
                    <TableCell>{format(new Date(entry.exam_date), 'dd-MMM-yyyy')}</TableCell>
                    <TableCell>{entry.start_time} - {entry.end_time}</TableCell>
                    <TableCell>{entry.max_marks}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openTimetableDialog(entry)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {timetables.length === 0 && !loading && <p className="text-center text-gray-500 py-4">No timetable entries found.</p>}
          </>
        ) : (
          <p className="text-center text-gray-500 py-4">Please select an exam and class to view the timetable.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamTimetable;