import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StudentReportCard = ({ title, data }) => (
    <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
            {data && data.length > 0 ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : <p>No data available.</p>}
        </CardContent>
    </Card>
);

const StudentReports = ({ instituteId }) => {
    const { toast } = useToast();
    const [reports, setReports] = useState({});
    const [loading, setLoading] = useState(true);
    const printRef = useRef();

    const fetchReports = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/students?institute_id=${instituteId}&status=active&select=caste,gender,courses.course_name,date_of_birth`);

            if (!response.ok) {
                throw new Error('Error fetching reports');
            }

            const data = await response.json();
            const processData = (key, nameMapper = (k) => k) => {
                const counts = data.reduce((acc, student) => {
                    const value = key(student);
                    if (value) {
                        acc[value] = (acc[value] || 0) + 1;
                    }
                    return acc;
                }, {});
                return Object.entries(counts).map(([name, value]) => ({ name: nameMapper(name), value }));
            };

            const calculateAge = (dob) => {
                if (!dob) return null;
                return new Date().getFullYear() - new Date(dob).getFullYear();
            }

            const ageGroups = data.reduce((acc, student) => {
                const age = calculateAge(student.date_of_birth);
                if (age) {
                    const group = age < 18 ? 'Under 18' : age <= 22 ? '18-22' : 'Over 22';
                    acc[group] = (acc[group] || 0) + 1;
                }
                return acc;
            }, {});

            setReports({ byCaste: processData(s => s.caste), byGender: processData(s => s.gender), byCourse: processData(s => s.courses?.course_name), byAge: Object.entries(ageGroups).map(([name, value]) => ({ name, value })) });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching reports', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handlePrint = useReactToPrint({ content: () => printRef.current });

    if (loading) return <p>Loading reports...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-end print-hidden">
                <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print All Reports</Button>
            </div>
            <div ref={printRef} className="space-y-8 a4-page-print-container">
                <h1 className="text-2xl font-bold text-center hidden print-block">Student Demographic Reports</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StudentReportCard title="Students by Caste" data={reports.byCaste} />
                    <StudentReportCard title="Students by Gender" data={reports.byGender} />
                    <StudentReportCard title="Students by Course" data={reports.byCourse} />
                    <StudentReportCard title="Students by Age Group" data={reports.byAge} />
                </div>
            </div>
        </div>
    );
};

export default StudentReports;