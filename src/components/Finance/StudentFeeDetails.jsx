import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign, History, PlusCircle, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CollectFeeForm from './CollectFeeForm';
import CollectMiscFeeForm from './CollectMiscFeeForm';
import TransactionHistory from './TransactionHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import FeeReceipt from './FeeReceipt';
import { API_BASE } from '@/lib/constants';

const StudentFeeDetails = ({ studentId, instituteId }) => {
  const [student, setStudent] = useState(null);
  const [feeBills, setFeeBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [isMiscFeeOpen, setIsMiscFeeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch student data
      const studentUrl = `${API_BASE}/students/${encodeURIComponent(studentId)}`;
      const studentRes = await fetch(studentUrl, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const studentData = await studentRes.json();
      
      // Fetch fee bills data
      const billsUrl = `${API_BASE}/student-fee-bills?student_id=${encodeURIComponent(studentId)}`;
      const billsRes = await fetch(billsUrl, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const billsData = await billsRes.json();
      
      if (studentRes.ok) {
        setStudent(studentData);
      } else {
        toast({ variant: 'destructive', title: 'Error fetching student', description: studentData?.error || 'Failed to fetch student data' });
        setStudent(null);
      }
      
      if (billsRes.ok) {
        setFeeBills(billsData || []);
      } else {
        toast({ variant: 'destructive', title: 'Error fetching fee bills', description: billsData?.error || 'Failed to fetch fee bills' });
        setFeeBills([]);
      }
    } catch (error) {
      console.error('Network error fetching data:', error);
      toast({ variant: 'destructive', title: 'Network Error', description: 'Failed to connect to server' });
      setStudent(null);
      setFeeBills([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, toast, API_BASE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCollectFee = (bill) => {
    setSelectedBill(bill);
    setIsCollectFeeOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    setIsCollectFeeOpen(false);
    setIsMiscFeeOpen(false);
    setSelectedBill(null);
    fetchData(); // Refresh data
  }

  const handlePrintReceipt = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setIsReceiptOpen(true);
  }
  
  const totalDues = feeBills.reduce((acc, bill) => acc + (Number(bill.balance_amount) || 0), 0);

  if (loading) return <div>Loading fee details...</div>;
  if (!student) return <div>Student not found.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl">{student.full_name}</CardTitle>
                <CardDescription>GR No: {student.gr_no || 'N/A'} | Admission No: {student.admission_no}</CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-600">₹{totalDues.toFixed(2)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end gap-2 mb-4">
             <Button variant="outline" onClick={() => setIsHistoryOpen(true)}><History className="mr-2 h-4 w-4" />View Student Ledger</Button>
             <Button onClick={() => setIsMiscFeeOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Collect One-Time Fee</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill / Fee</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeBills.length > 0 ? feeBills.map(bill => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.bill_name}</TableCell>
                  <TableCell>₹{Number(bill.total_amount).toFixed(2)}</TableCell>
                  <TableCell>₹{Number(bill.paid_amount).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold text-red-600">₹{Number(bill.balance_amount).toFixed(2)}</TableCell>
                  <TableCell>
                    {bill.last_payment_date ? new Date(bill.last_payment_date).toLocaleDateString() : 'N/A'}
                    {bill.fee_transactions.length > 0 && (
                      <Button variant="link" size="sm" onClick={() => handlePrintReceipt(bill.fee_transactions[0].id)}><Printer className="h-4 w-4 ml-2" /></Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleCollectFee(bill)} disabled={bill.status === 'paid'}>
                      <DollarSign className="mr-2 h-4 w-4" /> Pay
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan="6" className="text-center">No fee bills found for this student.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isCollectFeeOpen} onOpenChange={setIsCollectFeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Towards: {selectedBill?.bill_name}</DialogTitle>
          </DialogHeader>
          {selectedBill && <CollectFeeForm student={student} bill={selectedBill} onSuccess={handlePaymentSuccess} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isMiscFeeOpen} onOpenChange={setIsMiscFeeOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Collect One-Time Fee</DialogTitle>
                <CardDescription>Collect a one-time fee like exam fees, library fines, etc.</CardDescription>
            </DialogHeader>
            <CollectMiscFeeForm student={student} onSuccess={handlePaymentSuccess} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>Student Ledger: {student.full_name}</DialogTitle>
            </DialogHeader>
            <TransactionHistory studentId={studentId} instituteId={instituteId} />
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptOpen} onOpenChange={() => { setIsReceiptOpen(false); setSelectedTransactionId(null); }}>
        <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>Fee Receipt</DialogTitle></DialogHeader>
            {selectedTransactionId && <FeeReceipt transactionId={selectedTransactionId} />}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default StudentFeeDetails;