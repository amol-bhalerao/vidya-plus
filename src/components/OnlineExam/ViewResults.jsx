import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ViewResults = () => {
    const { studentExamId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/crud/student_online_exams/${studentExamId}?include_relations=true`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch exam results');
                }
                
                const data = await response.json();
                setResult(data);
            } catch (error) {
                console.error('Error fetching exam results:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [studentExamId]);

    if (loading) return <div>Loading results...</div>;
    if (!result) return <div>Results not found.</div>;

    const mcqAnswers = result.answers.filter(a => a.question.question_type === 'mcq');
    const correctAnswers = mcqAnswers.filter(a => a.is_correct).length;
    const incorrectAnswers = mcqAnswers.length - correctAnswers;
    
    const chartData = [
        { name: 'Correct', value: correctAnswers, color: '#10B981' },
        { name: 'Incorrect', value: incorrectAnswers, color: '#EF4444' }
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle>Exam Result: {result.exam.title}</CardTitle>
                    <CardDescription>Result for {result.student.full_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                             <h3 className="text-lg font-semibold">Your Score</h3>
                             <p className="text-5xl font-bold my-2">{result.score} / {result.exam.total_marks}</p>
                             <p className="text-2xl font-medium">{((result.score / result.exam.total_marks) * 100).toFixed(2)}%</p>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-lg mb-2">Answer Breakdown</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {result.answers.map((answer, index) => (
                                <div key={index} className="flex items-start p-3 border rounded-md">
                                    {answer.question.question_type === 'mcq' ? (
                                        answer.is_correct ? <CheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0"/> : <XCircle className="text-red-500 mr-3 mt-1 flex-shrink-0"/>
                                    ) : <div className="w-6 mr-3 flex-shrink-0"/>}
                                    <div>
                                      <p>{answer.question.question_text}</p>
                                      {answer.question.question_type === 'descriptive' && (
                                        <p className="text-sm text-blue-700 bg-blue-50 p-2 mt-2 rounded">Your Answer: {answer.answer_text}</p>
                                      )}
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ViewResults;