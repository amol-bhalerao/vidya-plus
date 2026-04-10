import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, ListChecks, Send, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

const ExamForm = ({ instituteId, exam, onSave }) => {
    const [formData, setFormData] = useState(exam || { title: '', description: '', class_id: '', subject_id: '', scheduled_start_time: '', duration_minutes: 60, total_marks: 100 });
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setFormData(exam || { title: '', description: '', class_id: '', subject_id: '', scheduled_start_time: '', duration_minutes: 60, total_marks: 100 });
    }, [exam]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            if (!instituteId) return;
            try {
                const coursesResponse = await fetch(`/crud/courses?institute_id=${instituteId}`);
                const subjectsResponse = await fetch(`/crud/subjects?institute_id=${instituteId}`);
                
                if (coursesResponse.ok) {
                    const courseData = await coursesResponse.json();
                    setCourses(courseData);
                }
                
                if (subjectsResponse.ok) {
                    const subjectData = await subjectsResponse.json();
                    setSubjects(subjectData);
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching dropdown data', description: error.message });
            }
        };
        fetchDropdownData();
    }, [instituteId, toast]);
    
    useEffect(() => {
        const fetchClasses = async () => {
            if (formData.course_id) {
                try {
                    const response = await fetch(`/crud/classes?course_id=${formData.course_id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setClasses(data || []);
                    } else {
                        toast({variant: 'destructive', title: 'Error fetching classes'});
                    }
                } catch (error) {
                    toast({variant: 'destructive', title: 'Error fetching classes', description: error.message});
                }
            }
        };
        fetchClasses();
    }, [formData.course_id, toast]);

    const handleCourseChange = async (courseId) => {
        setFormData(prev => ({...prev, course_id: courseId, class_id: ''}));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const dataToSubmit = {
            ...formData,
            institute_id: instituteId,
            status: formData.status || 'upcoming'
        };
        
        delete dataToSubmit.course_id;

        try {
            let response;
            if (formData.id) {
                // Update existing exam
                response = await fetch(`/crud/online_exams/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSubmit)
                });
            } else {
                // Create new exam
                response = await fetch('/crud/online_exams', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSubmit)
                });
            }
            
            if (response.ok) {
                toast({ title: 'Success!', description: `Exam ${formData.id ? 'updated' : 'created'}.` });
                onSave();
            } else {
                const errorData = await response.json();
                toast({ variant: 'destructive', title: 'Error saving exam', description: errorData.error || 'Unknown error' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving exam', description: error.message });
        }
        setLoading(false);
    };

    return (
        <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>{formData.id ? 'Edit' : 'Create'} Online Exam</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <Input required placeholder="Exam Title" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} />
                <Textarea placeholder="Description..." value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} />
                <div className="grid grid-cols-2 gap-4">
                     <Select onValueChange={handleCourseChange}>
                        <SelectTrigger><SelectValue placeholder="Select Course..." /></SelectTrigger>
                        <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select required value={formData.class_id} onValueChange={val => setFormData(p => ({...p, class_id: val}))} disabled={!formData.course_id}>
                        <SelectTrigger><SelectValue placeholder="Select Class..." /></SelectTrigger>
                        <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={formData.subject_id} onValueChange={val => setFormData(p => ({...p, subject_id: val}))}>
                        <SelectTrigger><SelectValue placeholder="Select Subject (Optional)" /></SelectTrigger>
                        <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input required type="datetime-local" value={formData.scheduled_start_time} onChange={e => setFormData(p => ({...p, scheduled_start_time: e.target.value}))} />
                    <Input required type="number" placeholder="Duration (minutes)" value={formData.duration_minutes} onChange={e => setFormData(p => ({...p, duration_minutes: e.target.value}))} />
                    <Input required type="number" placeholder="Total Marks" value={formData.total_marks} onChange={e => setFormData(p => ({...p, total_marks: e.target.value}))} />
                </div>
                <DialogFooter><Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Exam'}</Button></DialogFooter>
            </form>
        </DialogContent>
    );
};

const ManageQuestions = ({ exam, onClose }) => {
    const { toast } = useToast();
    const [questions, setQuestions] = useState([]);
    const [assignedQuestions, setAssignedQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const qbResponse = await fetch(`/crud/online_exam_question_bank?institute_id=${exam.institute_id}`);
            const assignedResponse = await fetch(`/crud/online_exam_questions?exam_id=${exam.id}`);
            
            if (qbResponse.ok && assignedResponse.ok) {
                const qbData = await qbResponse.json();
                const assignedData = await assignedResponse.json();
                
                setQuestions(qbData || []);
                setAssignedQuestions(assignedData?.map(q => q.question_id) || []);
            } else {
                toast({ variant: 'destructive', title: 'Error fetching questions' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching questions', description: error.message });
        }
        setLoading(false);
    }, [exam.id, exam.institute_id, toast]);
    
    useEffect(() => { fetchQuestions() }, [fetchQuestions]);

    const handleToggleQuestion = async (questionId) => {
        const isAssigned = assignedQuestions.includes(questionId);
        
        try {
            let response;
            if (isAssigned) {
                // Find the question assignment ID
                const existingAssignments = await (await fetch(`/crud/online_exam_questions?exam_id=${exam.id}&question_id=${questionId}`)).json();
                if (existingAssignments.length > 0) {
                    response = await fetch(`/crud/online_exam_questions/${existingAssignments[0].id}`, {
                        method: 'DELETE'
                    });
                }
            } else {
                // Assign question to exam
                response = await fetch('/crud/online_exam_questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ exam_id: exam.id, question_id: questionId })
                });
            }
            
            if (response && response.ok) {
                fetchQuestions(); // Refresh state
            } else {
                toast({ variant: 'destructive', title: 'Error updating questions' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating questions', description: error.message });
        }
    };
    
    return (
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader><DialogTitle>Manage Questions for: {exam.title}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 h-[60vh]">
                <div>
                    <h3 className="font-semibold mb-2">Available Questions</h3>
                    <ScrollArea className="h-full border rounded-md p-2">
                        {loading ? <p>Loading...</p> : questions.filter(q => !assignedQuestions.includes(q.id)).map(q => (
                            <div key={q.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-100">
                                <p className="text-sm truncate">{q.question_text}</p>
                                <Button size="sm" variant="outline" onClick={() => handleToggleQuestion(q.id)}><PlusCircle className="h-4 w-4 mr-2" /> Add</Button>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Assigned Questions</h3>
                    <ScrollArea className="h-full border rounded-md p-2">
                        {loading ? <p>Loading...</p> : questions.filter(q => assignedQuestions.includes(q.id)).map(q => (
                            <div key={q.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-100 bg-green-50">
                                <p className="text-sm truncate">{q.question_text}</p>
                                <Button size="sm" variant="destructive" onClick={() => handleToggleQuestion(q.id)}><Trash2 className="h-4 w-4 mr-2" /> Remove</Button>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
            </div>
        </DialogContent>
    );
};

const OnlineExamManagement = ({ instituteId }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);

    const fetchExams = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const response = await fetch(`/crud/online_exams?institute_id=${instituteId}&include_relations=true&order_by=scheduled_start_time&order_direction=desc`);
            if (response.ok) {
                const data = await response.json();
                setExams(data || []);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch exams' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
        setLoading(false);
    }, [instituteId, toast]);

    useEffect(() => { fetchExams() }, [fetchExams]);
    
    const handleOpenForm = (exam = null) => { setSelectedExam(exam); setIsFormOpen(true); };
    const handleOpenQuestions = (exam) => { setSelectedExam(exam); setIsQuestionsOpen(true); };
    
    const handleSave = () => { setIsFormOpen(false); setSelectedExam(null); fetchExams(); };
    
    const handleDelete = async (examId) => {
        try {
            const response = await fetch(`/crud/online_exams/${examId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                toast({ title: 'Exam deleted.' });
                fetchExams();
            } else {
                const errorData = await response.json();
                toast({ variant: 'destructive', title: 'Error', description: errorData.error || 'Unknown error' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    const handlePublish = async (examId, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'upcoming' : 'published';
        try {
            const response = await fetch(`/crud/online_exams/${examId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.ok) {
                toast({ title: `Exam status changed to ${newStatus}` });
                fetchExams();
            } else {
                const errorData = await response.json();
                toast({ variant: 'destructive', title: 'Error updating status', description: errorData.error || 'Unknown error' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Exam Scheduling</CardTitle>
                        <CardDescription>Create, schedule, and manage online exams.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Schedule New Exam</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead>Date & Time</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>}
                        {!loading && exams.map(exam => (
                            <TableRow key={exam.id}>
                                <TableCell className="font-semibold">{exam.title}</TableCell>
                                <TableCell>{exam.classes?.class_name || 'N/A'}</TableCell>
                                <TableCell>{exam.subjects?.subject_name || 'N/A'}</TableCell>
                                <TableCell>{new Date(exam.scheduled_start_time).toLocaleString()}</TableCell>
                                <TableCell className="capitalize">{exam.status}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" title="Print Results" onClick={() => navigate(`/dashboard/online-exam/print/${exam.id}`)}><Printer className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" title="Publish/Unpublish" onClick={() => handlePublish(exam.id, exam.status)}><Send className={`h-4 w-4 ${exam.status === 'published' ? 'text-green-500' : ''}`} /></Button>
                                    <Button variant="ghost" size="icon" title="Manage Questions" onClick={() => handleOpenQuestions(exam)}><ListChecks className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => handleOpenForm(exam)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(exam.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) setSelectedExam(null); setIsFormOpen(isOpen) }}><ExamForm instituteId={instituteId} exam={selectedExam} onSave={handleSave} /></Dialog>
            <Dialog open={isQuestionsOpen} onOpenChange={(isOpen) => { if(!isOpen) setSelectedExam(null); setIsQuestionsOpen(isOpen) }}>{selectedExam && <ManageQuestions exam={selectedExam} onClose={() => setIsQuestionsOpen(false)} />}</Dialog>
        </Card>
    );
};

export default OnlineExamManagement;