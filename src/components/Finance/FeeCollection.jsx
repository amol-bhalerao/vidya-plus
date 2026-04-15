// Using PHP backend for data fetching
import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, PlusCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StudentFeeDetails from './StudentFeeDetails';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import FeeReceipt from './FeeReceipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '../ui/use-toast';

const TodaysCollections = ({ instituteId }) => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [printingReceiptId, setPrintingReceiptId] = useState(null);
    const printRef = useRef();

    useEffect(() => {
        const fetchCollections = async () => {
            if (!instituteId) return;
            setLoading(true);
            try {
                const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
                const today = format(new Date(), 'yyyy-MM-dd');
                const response = await fetch(`${API_BASE}/fee_transactions?institute_id=${instituteId}&payment_date=${today}&include=students,fee_bills&sort=created_at&order=desc`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (!response.ok) throw new Error('Failed to fetch collections');
                
                const data = await response.json();
                setCollections(data || []);
            } catch (error) {
                console.error("Error fetching today's collections:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCollections();
    }, [instituteId]);
    
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Daily_Collection_Report_${format(new Date(), 'yyyy-MM-dd')}`,
    });

    const totalCollected = collections.reduce((sum, item) => sum + (Number.parseFloat(item.amount_paid) || 0), 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Today's Fee Collections</CardTitle>
                        <CardDescription>A summary of all fees collected today, {format(new Date(), 'PPP')}.</CardDescription>
                    </div>
                    <Button onClick={handlePrint} variant="outline" className="print-hidden"><Printer className="mr-2 h-4 w-4"/> Print Report</Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                    <div ref={printRef} className="p-2 printable-area">
                        <div className="text-center mb-4 hidden print-block">
                            <h1 className="text-xl font-bold">Daily Collection Report</h1>
                            <p className="text-sm">{format(new Date(), 'PPP')}</p>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Bill</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead className="text-right">Amount Paid</TableHead>
                                    <TableHead className="text-right print-hidden">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>}
                                {!loading && collections.length === 0 && <TableRow><TableCell colSpan="5" className="text-center">No collections today.</TableCell></TableRow>}
                                {!loading && collections.map(col => {
                                    const amountPaid = Number.parseFloat(col.amount_paid) || 0;
                                    const studentName = col.students?.full_name || col.student_full_name || 'Unknown Student';
                                    const grNo = col.students?.gr_no || col.student_gr_no || col.students?.admission_no || col.student_admission_no || 'N/A';
                                    const billName = col.fee_bills?.bill_name || col.fee_bill_name || 'Fee Bill';

                                    return (
                                    <TableRow key={col.id}>
                                        <TableCell>{studentName} ({grNo})</TableCell>
                                        <TableCell>{billName}</TableCell>
                                        <TableCell className="capitalize">{col.payment_mode}</TableCell>
                                        <TableCell className="text-right font-medium">₹{amountPaid.toFixed(2)}</TableCell>
                                        <TableCell className="text-right print-hidden">
                                            <Button variant="ghost" size="sm" onClick={() => setPrintingReceiptId(col.id)}>
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
                <div className="text-right font-bold text-lg mt-4 pr-4">
                    Total Collected Today: ₹{totalCollected.toFixed(2)}
                </div>
            </CardContent>

             <Dialog open={!!printingReceiptId} onOpenChange={() => setPrintingReceiptId(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>Fee Receipt</DialogTitle></DialogHeader>
                    {printingReceiptId && <FeeReceipt transactionId={printingReceiptId} />}
                </DialogContent>
            </Dialog>
        </Card>
    )
}

const AssignFeeGroupDialog = ({ studentId, instituteId, onClose }) => {
    const [feeGroups, setFeeGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchFeeGroups = async () => {
            setLoading(true);
            try {
                const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
                const response = await fetch(`${API_BASE}/fee_groups?institute_id=${instituteId}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (response.ok) {
                    setFeeGroups(data);
                } else {
                    toast({ variant: "destructive", title: "Error fetching fee groups.", description: data.error || 'Unknown error' });
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error fetching fee groups.", description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchFeeGroups();
    }, [instituteId, toast]);

    const handleAssign = async () => {
        if (!selectedGroupId) {
            toast({ variant: "destructive", title: "Please select a fee group."});
            return;
        }

        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            
            // First get student class_id
            const studentResponse = await fetch(`${API_BASE}/students/${studentId}?select=class_id`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!studentResponse.ok) throw new Error('Failed to fetch student data');
            
            const student = await studentResponse.json();
            
            // Then assign fees
            const assignResponse = await fetch(`${API_BASE}/assign_fees_to_student`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: studentId,
                    fee_group_id: selectedGroupId,
                    class_id: student.class_id,
                    institute_id: instituteId,
                    is_admission: false
                })
            });
            
            if (!assignResponse.ok) throw new Error('Failed to assign fees');
            
            toast({ title: "Success!", description: "Fee group has been assigned to the student."});
            onClose(true);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to assign fee group.", description: error.message });
        }
    };

    return (
        <Dialog open onOpenChange={() => onClose(false)}>
            <DialogContent>
                <DialogHeader><DialogTitle>Assign Fee Group to Student</DialogTitle></DialogHeader>
                <div className="py-4 space-y-4">
                    <p>Select a fee group to create a new fee bill for this student.</p>
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={loading}>
                        <SelectTrigger>
                            <SelectValue placeholder={loading ? "Loading groups..." : "Select a fee group"} />
                        </SelectTrigger>
                        <SelectContent>
                            {feeGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.group_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onClose(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedGroupId || loading}>Assign</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const FeeCollection = ({ instituteId }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAssignGroupOpen, setIsAssignGroupOpen] = useState(false);

  useEffect(() => {
    setSelectedStudentId(null);
    setSearchTerm('');
    setStudents([]);
  }, [instituteId]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!instituteId || searchTerm.length < 3) {
          setStudents([]);
          return;
      }
      
      setLoading(true);
      try {
        const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/students?institute_id=${instituteId}&search=${encodeURIComponent(searchTerm)}&select=id,full_name,admission_no,gr_no&limit=10`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch students');
        
        const data = await response.json();
        setStudents(data || []);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
        fetchStudents();
    }, 500);

    return () => clearTimeout(debounceFetch);

  }, [instituteId, searchTerm]);

  const handleAssignGroupClose = (success) => {
      setIsAssignGroupOpen(false);
      if (success) {
          // Force a refresh of the student details by temporarily unsetting and resetting the ID
          const currentStudentId = selectedStudentId;
          setSelectedStudentId(null);
          setTimeout(() => setSelectedStudentId(currentStudentId), 0);
      }
  }

  return (
    <div className="space-y-6">
        <TodaysCollections instituteId={instituteId} />

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Search Student & Collect Fee</CardTitle>
                        <CardDescription>Search for any student to view their fee details and collect payments.</CardDescription>
                    </div>
                    {selectedStudentId && (
                        <Button onClick={() => setIsAssignGroupOpen(true)} variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />Assign Fee Group
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input 
                            placeholder="Search by Name, GR No, or Admission No..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={!instituteId}
                        />
                    </div>
                    <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''} disabled={!students.length}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder={loading ? "Searching..." : "Select Student"} />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.gr_no || s.admission_no})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {searchTerm.length > 0 && searchTerm.length < 3 && <p className="text-sm text-gray-500 mt-2">Type at least 3 characters to search.</p>}
            </CardContent>
        </Card>
      
        {selectedStudentId && instituteId && (
            <StudentFeeDetails studentId={selectedStudentId} instituteId={instituteId} key={selectedStudentId} />
        )}
        {isAssignGroupOpen && selectedStudentId && (
            <AssignFeeGroupDialog 
                studentId={selectedStudentId} 
                instituteId={instituteId}
                onClose={handleAssignGroupClose}
            />
        )}
    </div>
  );
};

export default FeeCollection;