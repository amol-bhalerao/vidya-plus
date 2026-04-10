import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TransactionHistory from '@/components/Finance/TransactionHistory';
import { Search, Printer } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const API_BASE = '/api/v1';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';

const StudentLedgerPrint = React.forwardRef(({ student, institute, children }, ref) => {
    return (
        <div ref={ref} className="p-8">
            <div className="text-center mb-6">
                {institute?.logo_url && <img src={institute.logo_url} alt="Institute Logo" className="h-16 mx-auto mb-2" />}
                <h1 className="text-2xl font-bold">{institute?.name}</h1>
                <p>{institute?.address}</p>
                <h2 className="text-xl font-semibold mt-4">Student Ledger</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 border-y py-2">
                <p><strong>Student Name:</strong> {student?.full_name}</p>
                <p><strong>GR No:</strong> {student?.gr_no}</p>
                <p><strong>Course:</strong> {student?.courses?.course_name}</p>
                <p><strong>Class:</strong> {student?.classes?.class_name}</p>
            </div>
            {children}
        </div>
    );
});

const StudentLedger = ({ instituteId }) => {
    const { user } = useUser();
    const institute = user?.institute;
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const printRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `${selectedStudent?.full_name || 'Student'} Ledger`,
    });
  
    useEffect(() => {
        const fetchStudents = async () => {
            if (!instituteId || searchTerm.length < 3) {
              setStudents([]);
              return;
            }
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('institute_id', instituteId);
                params.append('search', searchTerm);
                params.append('limit', '10');
                
                const res = await fetch(`${API_BASE}/students/search?${params}`, {
                    credentials: 'include'
                });
                
                const data = await res.json();
                
                if (res.ok && data.students) {
                    setStudents(data.students);
                } else {
                    console.error('Error fetching students:', data.error || 'Unknown error');
                    setStudents([]);
                }
            } catch (error) {
                console.error('Network error fetching students:', error);
                setStudents([]);
            }
            setLoading(false);
        };
      
        const debounceFetch = setTimeout(() => {
            fetchStudents();
        }, 500);
      
        return () => clearTimeout(debounceFetch);
      
    }, [instituteId, searchTerm]);

    const handleSelectStudent = (studentId) => {
        const student = students.find(s => s.id === studentId);
        setSelectedStudent(student);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Student Ledger</CardTitle>
                    <CardDescription>Search for a student to view their detailed financial ledger.</CardDescription>
                </div>
                 {selectedStudent && (
                    <Button onClick={handlePrint} variant="outline">
                        <Printer size={16} className="mr-2" />
                        <span>Print Ledger</span>
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input 
                            placeholder="Search by Name, GR No, or Admission No..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select onValueChange={handleSelectStudent} value={selectedStudent?.id || ''} disabled={!students.length}>
                        <SelectTrigger className="md:w-[400px]">
                            <SelectValue placeholder={loading ? "Searching..." : "Select Student"} />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.courses.course_name} | {s.gr_no || s.admission_no})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {searchTerm.length > 0 && searchTerm.length < 3 && <p className="text-sm text-gray-500 mt-2">Type at least 3 characters to search.</p>}

                {selectedStudent && (
                    <div className="mt-4 border-t pt-4">
                        <div className="print-only">
                            <StudentLedgerPrint ref={printRef} student={selectedStudent} institute={institute}>
                                <TransactionHistory student={selectedStudent} institute={institute} key={selectedStudent.id} isPrintView={true} />
                            </StudentLedgerPrint>
                        </div>
                        <div className="no-print">
                             <TransactionHistory student={selectedStudent} institute={institute} key={selectedStudent.id} isPrintView={false} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default StudentLedger;