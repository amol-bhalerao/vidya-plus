import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

const ExamResultsPrint = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [resultsData, setResultsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef();
    
    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/crud/online_exam_results/${examId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch exam results');
                }
                
                const data = await response.json();
                setResultsData(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching results', description: error.message });
                navigate('/online-exam');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [examId, toast, navigate]);

    const handlePrint = () => {
        window.print();
    };
    
    if (loading) return <div>Loading results for printing...</div>;
    if (!resultsData) return <div>No results found.</div>;

    return (
        <div className="bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-lg p-4 mb-4 text-center print-hidden">
                <h1 className="text-xl font-bold">Print Preview</h1>
                <p>Printing results for: {resultsData.exam.title}</p>
                <Button onClick={handlePrint} className="mt-4"><Printer className="mr-2 h-4 w-4" /> Print Results</Button>
            </div>
            <div ref={printRef} className="a4-page font-sans text-black">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold">{resultsData.exam.title}</h1>
                    <p className="text-lg">Consolidated Marksheet</p>
                    <p className="text-sm text-gray-600">Date: {format(new Date(resultsData.exam.scheduled_start_time), 'PPp')}</p>
                </div>
                <table className="w-full text-sm border-collapse border border-gray-400">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-400 p-2">Sr. No.</th>
                            <th className="border border-gray-400 p-2 text-left">GR No.</th>
                            <th className="border border-gray-400 p-2 text-left">Student Name</th>
                            <th className="border border-gray-400 p-2">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resultsData.results.map((student, index) => (
                            <tr key={student.gr_no}>
                                <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
                                <td className="border border-gray-400 p-2">{student.gr_no}</td>
                                <td className="border border-gray-400 p-2">{student.full_name}</td>
                                <td className="border border-gray-400 p-2 text-center">{student.score} / {resultsData.exam.total_marks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="mt-24 flex justify-between text-sm">
                    <span>Checked By</span>
                    <span>Principal's Signature</span>
                </div>
            </div>
        </div>
    );
};

export default ExamResultsPrint;