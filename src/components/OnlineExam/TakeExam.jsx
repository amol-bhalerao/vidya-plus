import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.jsx';

const TakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [studentExamId, setStudentExamId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [loading, setLoading] = useState(true);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const startExam = useCallback(async (studentId) => {
        try {
            // Check if student exam session exists
            let studentExam;
            const checkResponse = await fetch(`/crud/student_online_exams?student_id=${studentId}&exam_id=${examId}`);
            const existingExams = await checkResponse.json();
            
            if (existingExams && existingExams.length > 0) {
                studentExam = existingExams[0];
                
                // Update if not ongoing
                if (studentExam.status !== 'ongoing') {
                    const updateResponse = await fetch(`/crud/student_online_exams/${studentExam.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: 'ongoing', started_at: new Date() })
                    });
                    if (!updateResponse.ok) throw new Error('Failed to update exam session');
                    studentExam = await updateResponse.json();
                }
            } else {
                // Create new session
                const createResponse = await fetch('/crud/student_online_exams', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ student_id: studentId, exam_id: examId, status: 'ongoing', started_at: new Date() })
                });
                if (!createResponse.ok) throw new Error('Failed to create exam session');
                studentExam = await createResponse.json();
            }

            setStudentExamId(studentExam.id);
            const startTime = new Date(studentExam.started_at);
            const endTime = new Date(startTime.getTime() + exam.duration_minutes * 60000);
            const remaining = Math.max(0, Math.floor((endTime - new Date()) / 1000));
            setTimeLeft(remaining);
        } catch (error) {
            console.error("Error starting exam session", error);
        }
    }, [exam, examId]);

    useEffect(() => {
        const fetchExamData = async () => {
            setLoading(true);
            try {
                // Fetch exam data
                const examResponse = await fetch(`/crud/online_exams/${examId}`);
                if (!examResponse.ok) { navigate('/'); return; }
                const examData = await examResponse.json();
                
                // Fetch student data using aadhaar_no
                const studentResponse = await fetch(`/crud/students?aadhaar_no=${user.aadhaar_no}`);
                if (!studentResponse.ok) { navigate('/'); return; }
                const studentData = await studentResponse.json();
                if (!studentData || studentData.length === 0) { navigate('/'); return; }
                
                // Fetch questions
                const questionsResponse = await fetch(`/crud/online_exam_questions?exam_id=${examId}&expand=questions`);
                if (!questionsResponse.ok) { navigate('/'); return; }
                const questionsData = await questionsResponse.json();
                
                setExam(examData);
                setQuestions(questionsData.map(q => q.questions));
                await startExam(studentData[0].id);
            } catch (error) {
                console.error('Error fetching exam data:', error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchExamData();
    }, [examId, user, navigate, startExam]);

    useEffect(() => {
        if (timeLeft <= 0 && !loading) {
            if(studentExamId) handleSubmitExam();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, loading]);

    const handleSubmitExam = async () => {
        setShowConfirmDialog(false);
        try {
            // Prepare answer payload
            const answerPayload = Object.entries(answers).map(([question_id, answer]) => {
                const question = questions.find(q => q.id === question_id);
                const isMCQ = question.question_type === 'mcq';
                const payload = {
                    student_exam_id: studentExamId,
                    question_id,
                    answer_text: isMCQ ? null : answer,
                    selected_option_index: isMCQ ? answer : null,
                    marks_awarded: 0
                };
                if(isMCQ) {
                    const correctOptionIndex = question.options.findIndex(opt => opt.is_correct);
                    payload.is_correct = parseInt(answer) === correctOptionIndex;
                    if(payload.is_correct) {
                        payload.marks_awarded = question.marks;
                    }
                }
                return payload;
            });

            // Submit answers
            const answersResponse = await fetch('/crud/student_exam_answers/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(answerPayload)
            });
            if (!answersResponse.ok) throw new Error('Failed to submit answers');

            // Calculate total score
            const scoredAnswers = await answersResponse.json();
            const totalScore = scoredAnswers.reduce((acc, curr) => acc + (curr.marks_awarded || 0), 0);

            // Update exam status
            const examUpdateResponse = await fetch(`/crud/student_online_exams/${studentExamId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'completed', completed_at: new Date(), score: totalScore })
            });
            if (!examUpdateResponse.ok) throw new Error('Failed to update exam status');
            
            navigate(`/online-exam/results/${studentExamId}`);
        } catch (error) {
            console.error('Error submitting exam:', error);
        }
    };

    if (loading) return <div>Loading exam...</div>;
    
    const currentQuestion = questions[currentQuestionIndex];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-4xl">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>{exam.title}</CardTitle>
                    <div className="text-2xl font-bold text-red-600">{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</div>
                </CardHeader>
                <CardContent>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h3 className="text-xl font-semibold mb-4">{currentQuestion.question_text}</h3>
                            {currentQuestion.question_type === 'mcq' ? (
                                <RadioGroup onValueChange={val => handleAnswerChange(currentQuestion.id, val)} value={answers[currentQuestion.id]}>
                                    {currentQuestion.options.map((opt, index) => (
                                        <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                                            <RadioGroupItem value={index.toString()} id={`q${currentQuestion.id}-opt${index}`} />
                                            <Label htmlFor={`q${currentQuestion.id}-opt${index}`}>{opt.option_text}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <Textarea value={answers[currentQuestion.id] || ''} onChange={e => handleAnswerChange(currentQuestion.id, e.target.value)} rows={8} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                    <div className="flex justify-between mt-6">
                        <Button onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0}>Previous</Button>
                        {currentQuestionIndex < questions.length - 1 ? (
                            <Button onClick={() => setCurrentQuestionIndex(p => p + 1)}>Next</Button>
                        ) : (
                            <Button onClick={() => setShowConfirmDialog(true)} variant="destructive">Submit Exam</Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                        <AlertDialogDescription>You cannot change your answers after submission.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                        <AlertDialogAction onClick={handleSubmitExam}>Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default TakeExam;