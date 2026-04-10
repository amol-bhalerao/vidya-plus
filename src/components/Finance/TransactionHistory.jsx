import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import FeeReceipt from './FeeReceipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { API_BASE } from '@/lib/constants';

const TransactionHistory = ({ student, institute }) => {
    const [transactions, setTransactions] = useState([]);
    const [dateRange, setDateRange] = useState({ 
        from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
    const [loading, setLoading] = useState(false);
    const [printingReceiptId, setPrintingReceiptId] = useState(null);
    const printRef = useRef();

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!student?.id || !dateRange.from || !dateRange.to) return;
            setLoading(true);
            
            try {
                const url = `${API_BASE}/student-transactions?student_id=${encodeURIComponent(student.id)}&from_date=${encodeURIComponent(dateRange.from)}&to_date=${encodeURIComponent(dateRange.to)}`;
                const res = await fetch(url, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    setTransactions(data || []);
                } else {
                    console.error("Error fetching transactions", data?.error || 'Failed to fetch transactions');
                    setTransactions([]);
                }
            } catch (error) {
                console.error("Network error fetching transactions", error);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [student?.id, dateRange, API_BASE]);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Student_Ledger_${student?.full_name}_${dateRange.from}_to_${dateRange.to}`,
    });

    const totalPaid = transactions.reduce((acc, t) => acc + t.amount_paid, 0);

    return (
        <div className="space-y-4">
             <div className="flex flex-col sm:flex-row gap-4 justify-between items-center print-hidden">
                <div className="flex gap-2 items-center">
                    <Input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({...prev, from: e.target.value}))} />
                    <span>to</span>
                    <Input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({...prev, to: e.target.value}))} />
                </div>
                <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print Ledger</Button>
            </div>
            <div ref={printRef} className="printable-area p-4">
                <div className="hidden print-block text-center mb-4">
                    <h2 className="text-xl font-bold">{institute?.name || 'Institute Name'}</h2>
                    <h3 className="text-lg font-semibold">Student Ledger</h3>
                    <p><strong>Student:</strong> {student?.full_name}</p>
                    <p><strong>GR No:</strong> {student?.gr_no}</p>
                    <p><strong>Period:</strong> {format(new Date(dateRange.from), 'PPP')} to {format(new Date(dateRange.to), 'PPP')}</p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Bill</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                             <TableHead className="text-right print-hidden">Receipt</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>}
                        {!loading && transactions.length === 0 && <TableRow><TableCell colSpan="5" className="text-center">No transactions in this period.</TableCell></TableRow>}
                        {!loading && transactions.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{format(new Date(t.payment_date), 'dd MMM yyyy')}</TableCell>
                                <TableCell>{t.fee_bills?.bill_name || 'Misc. Fee'}</TableCell>
                                <TableCell className="capitalize">{t.payment_mode}</TableCell>
                                <TableCell className="text-right font-medium">{t.amount_paid.toFixed(2)}</TableCell>
                                <TableCell className="text-right print-hidden">
                                    <Button variant="ghost" size="sm" onClick={() => setPrintingReceiptId(t.id)}>
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="text-right font-bold text-lg mt-4 pr-4 border-t pt-2">
                    Total Paid in Period: ₹{totalPaid.toFixed(2)}
                </div>
            </div>
            
            <Dialog open={!!printingReceiptId} onOpenChange={() => setPrintingReceiptId(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>Fee Receipt</DialogTitle></DialogHeader>
                    {printingReceiptId && <FeeReceipt transactionId={printingReceiptId} />}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default TransactionHistory;