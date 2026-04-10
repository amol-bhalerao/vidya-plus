import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { format, isAfter, isBefore } from 'date-fns';

const StudentExamList = () => {
    const { user, instituteId } = useUser();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentAndExams = async () => {
            if (!user || !instituteId || !user.aadhaar_no) {
                setLoading(false);
                return;
            };

            try {
                // Fetch student data
                const studentResponse = await fetch(`/crud/students?aadhaar_no=${user.aadhaar_no}`);
                const studentData = await studentResponse.json();
                
                if (!studentData || !studentData[0]) {
                    setLoading(false);
                    return;
                }
                
                const studentId = studentData[0].id;
                const classId = studentData[0].class_id;
                
                // Fetch exams
                const examsResponse = await fetch(`/crud/online_exams?institute_id=${instituteId}&class_id=${classId}&status=published&student_id=${studentId}`);
                const data = await examsResponse.json();
                
                setExams(data);
            } catch (error) {
                console.error("Error fetching student exams:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStudentAndExams();
    }, [user, instituteId]);
    
    const getAction = (exam) => {
        const studentExam = exam.student_online_exams[0];
        const now = new Date();
        const startTime = new Date(exam.scheduled_start_time);
        const endTime = new Date(startTime.getTime() + exam.duration_minutes * 60000);
        
        if (studentExam?.status === 'completed') {
            return <Button onClick={() => navigate(`/online-exam/results/${studentExam.id}`)}>View Result</Button>;
        }
        
        if (isAfter(now, startTime) && isBefore(now, endTime)) {
             return <Button onClick={() => navigate(`/online-exam/take/${exam.id}`)}>Start Exam</Button>;
        }
        
        if (isBefore(now, startTime)) {
            return <Button disabled>Upcoming</Button>;
        }

        return <span className="text-sm text-red-500">Missed</span>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Exams</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Exam Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Total Marks</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={6} className="text-center">Loading exams...</TableCell></TableRow>}
                        {!loading && exams.length === 0 && <TableRow><TableCell colSpan={6} className="text-center">No exams scheduled for you yet.</TableCell></TableRow>}
                        {!loading && exams.map(exam => (
                            <TableRow key={exam.id}>
                                <TableCell>{exam.title}</TableCell>
                                <TableCell>{format(new Date(exam.scheduled_start_time), 'PPp')}</TableCell>
                                <TableCell>{exam.duration_minutes} mins</TableCell>
                                <TableCell>{exam.total_marks}</TableCell>
                                <TableCell className="capitalize">{exam.student_online_exams[0]?.status || 'Not Started'}</TableCell>
                                <TableCell className="text-right">{getAction(exam)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default StudentExamList;