import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EvaluateAnswers = ({ instituteId }) => {
    const { toast } = useToast();
    const [exams, setExams] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [answers, setAnswers] = useState([]);
    
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await fetch(`/crud/online_exams?institute_id=${instituteId}&status=completed`);
                if (response.ok) {
                    const data = await response.json();
                    setExams(data || []);
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching exams', description: error.message });
            }
        };
        fetchExams();
    }, [instituteId, toast]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!selectedExam) return;
            try {
                const response = await fetch(`/crud/student_online_exams?exam_id=${selectedExam}&status=completed&include_relations=true`);
                if (response.ok) {
                    const data = await response.json();
                    setSubmissions(data || []);
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching submissions', description: error.message });
            }
        };
        fetchSubmissions();
        setSelectedSubmission(null);
        setAnswers([]);
    }, [selectedExam, toast]);

    useEffect(() => {
        const fetchAnswers = async () => {
            if (!selectedSubmission) return;
            try {
                const response = await fetch(`/crud/student_exam_answers?student_exam_id=${selectedSubmission.id}&include_relations=true`);
                if (response.ok) {
                    const data = await response.json();
                    setAnswers(data?.filter(a => a.question?.question_type === 'descriptive') || []);
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching answers', description: error.message });
            }
        };
        fetchAnswers();
    }, [selectedSubmission, toast]);

    const handleMarksChange = (answerId, marks) => {
        const markValue = parseFloat(marks);
        const answer = answers.find(a => a.id === answerId);
        if (markValue > answer.question.marks) {
            toast({ variant: 'destructive', title: `Marks cannot exceed ${answer.question.marks}`});
            return;
        }
        setAnswers(prev => prev.map(a => a.id === answerId ? {...a, marks_awarded: isNaN(markValue) ? null : markValue } : a));
    };

    const handleSaveEvaluation = async () => {
        try {
            // Save the marks for each answer
            const updates = answers.map(a => ({ id: a.id, marks_awarded: a.marks_awarded || 0 }));
            const updateResponse = await fetch('/crud/student_exam_answers/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(errorData.error || 'Error saving marks');
            }
            
            // Recalculate and update total score via API
            const scoreResponse = await fetch(`/crud/student_online_exams/${selectedSubmission.id}/recalculate-score`, {
                method: 'POST'
            });
            
            if (!scoreResponse.ok) {
                const errorData = await scoreResponse.json();
                throw new Error(errorData.error || 'Error updating total score');
            }
            
            const { score: totalScore } = await scoreResponse.json();
            
            toast({ title: 'Evaluation saved successfully!' });
            setSelectedSubmission(p => ({...p, score: totalScore}));
            setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? {...s, score: totalScore } : s))
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Evaluate Descriptive Answers</CardTitle>
                <CardDescription>Review and score long-form answers from student submissions.</CardDescription>
                <Select onValueChange={setSelectedExam} value={selectedExam}>
                    <SelectTrigger><SelectValue placeholder="Select Completed Exam"/></SelectTrigger>
                    <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-bold mb-2">Submissions</h3>
                        <div className="border rounded-md h-96 overflow-y-auto">
                            {submissions.map(sub => (
                                <div key={sub.id} onClick={() => setSelectedSubmission(sub)} className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedSubmission?.id === sub.id ? 'bg-blue-100' : ''}`}>
                                    <p>{sub.students.full_name}</p>
                                    <p className="text-sm text-gray-500">GR No: {sub.students.gr_no}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        {selectedSubmission ? (
                             <div>
                                <h3 className="font-bold mb-2">Evaluating: {selectedSubmission.students.full_name}</h3>
                                <div className="space-y-4">
                                    {answers.length > 0 ? answers.map(answer => (
                                        <Card key={answer.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">{answer.question.question_text}</CardTitle>
                                                <CardDescription>Max Marks: {answer.question.marks}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="p-4 bg-gray-50 rounded-md border">{answer.answer_text}</p>
                                                <div className="mt-4 flex items-center gap-2">
                                                    <Label>Awarded Marks:</Label>
                                                    <Input type="number" value={answer.marks_awarded || ''} onChange={e => handleMarksChange(answer.id, e.target.value)} max={answer.question.marks} className="w-24"/>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )) : <p>No descriptive answers to evaluate for this student.</p>}
                                </div>
                                {answers.length > 0 && <Button onClick={handleSaveEvaluation} className="mt-4">Save Evaluation</Button>}
                             </div>
                        ): <p className="text-center">Select a submission to evaluate.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
};

export default EvaluateAnswers;