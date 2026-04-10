import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit, Trash2, Check, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const QuestionForm = ({ question, subjects, onSave, onCancel }) => {
    const [formData, setFormData] = useState(question || {
        question_text: '',
        question_type: 'mcq',
        subject_id: '',
        marks: 1,
        options: [{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }]
    });

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...formData.options];
        if (field === 'is_correct') {
            newOptions.forEach((opt, i) => opt.is_correct = i === index);
        } else {
            newOptions[index][field] = value;
        }
        setFormData(p => ({ ...p, options: newOptions }));
    };

    const handleAddOption = () => {
        setFormData(p => ({ ...p, options: [...p.options, { option_text: '', is_correct: false }] }));
    };

    const handleRemoveOption = (index) => {
        setFormData(p => ({ ...p, options: p.options.filter((_, i) => i !== index) }));
    };

    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{question?.id ? 'Edit' : 'Add'} Question</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <Select value={formData.subject_id} onValueChange={val => setFormData(p => ({ ...p, subject_id: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Question Text" value={formData.question_text} onChange={e => setFormData(p => ({ ...p, question_text: e.target.value }))} />
                <div className="flex gap-4">
                    <Select value={formData.question_type} onValueChange={val => setFormData(p => ({ ...p, question_type: val }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="descriptive">Descriptive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Marks" value={formData.marks} onChange={e => setFormData(p => ({ ...p, marks: e.target.value }))} />
                </div>
                {formData.question_type === 'mcq' && (
                    <div className="space-y-2">
                        <Label>Options</Label>
                        {formData.options.map((opt, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Button size="icon" variant={opt.is_correct ? 'success' : 'outline'} onClick={() => handleOptionChange(index, 'is_correct', true)}>
                                    {opt.is_correct ? <Check /> : <X />}
                                </Button>
                                <Input value={opt.option_text} onChange={e => handleOptionChange(index, 'option_text', e.target.value)} placeholder={`Option ${index + 1}`} />
                                <Button size="icon" variant="destructive" onClick={() => handleRemoveOption(index)}><Trash2 /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddOption}>Add Option</Button>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(formData)}>Save Question</Button>
            </DialogFooter>
        </DialogContent>
    );
};

const QuestionBankManagement = ({ instituteId }) => {
    const { user } = useUser();
    const userRole = user?.role;
    const { toast } = useToast();
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/crud/online_exam_question_bank?institute_id=${instituteId}&order_by=created_at&order_direction=desc`);
            const data = await response.json();
            if (response.ok) {
                setQuestions(data);
            } else {
                toast({ variant: 'destructive', title: 'Error fetching questions' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching questions', description: error.message });
        }
        setLoading(false);
    }, [instituteId, toast]);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch(`/crud/subjects?institute_id=${instituteId}`);
                const data = await response.json();
                if (response.ok) {
                    setSubjects(data);
                } else {
                    toast({ variant: 'destructive', title: 'Error fetching subjects' });
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching subjects', description: error.message });
            }
        };
        fetchQuestions();
        fetchSubjects();
    }, [instituteId, toast, fetchQuestions]);

    const handleSaveQuestion = async (formData) => {
        const dataToSave = { ...formData, institute_id: instituteId, created_by: user.id };
        if (formData.question_type !== 'mcq') {
            delete dataToSave.options;
        }

        try {
            let response;
            if (formData.id) {
                // Update existing question
                response = await fetch(`/crud/online_exam_question_bank/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave)
                });
            } else {
                // Create new question
                response = await fetch('/crud/online_exam_question_bank', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave)
                });
            }
            
            if (response.ok) {
                toast({ title: 'Success!', description: 'Question saved.' });
                fetchQuestions();
                setIsFormOpen(false);
                setEditingQuestion(null);
            } else {
                const errorData = await response.json();
                toast({ variant: 'destructive', title: 'Error saving question', description: errorData.error || 'Unknown error' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving question', description: error.message });
        }
    };
    
    const handleDelete = async (questionId) => {
        try {
            const response = await fetch(`/crud/online_exam_question_bank/${questionId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                toast({ title: 'Question deleted.' });
                fetchQuestions();
            } else {
                const errorData = await response.json();
                toast({ variant: 'destructive', title: 'Error', description: errorData.error || 'Unknown error' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    const openForm = (question = null) => {
        setEditingQuestion(question);
        setIsFormOpen(true);
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Question Bank</CardTitle>
                        <CardDescription>Manage all questions for your online exams.</CardDescription>
                    </div>
                    <Button onClick={() => openForm(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add Question</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
                        {!loading && questions.map(q => (
                            <TableRow key={q.id}>
                                <TableCell className="max-w-md truncate">{q.question_text}</TableCell>
                                <TableCell>{q.subjects?.subject_name}</TableCell>
                                <TableCell>{q.question_type.toUpperCase()}</TableCell>
                                <TableCell>{q.marks}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openForm(q)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <QuestionForm 
                    question={editingQuestion} 
                    subjects={subjects}
                    onSave={handleSaveQuestion}
                    onCancel={() => { setIsFormOpen(false); setEditingQuestion(null); }}
                />
            </Dialog>
        </Card>
    );
};

export default QuestionBankManagement;