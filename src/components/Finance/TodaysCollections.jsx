import React, { useState, useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import FeeReceipt from './FeeReceipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/constants';

const TodaysCollections = ({ instituteId }) => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [printingReceiptId, setPrintingReceiptId] = useState(null);
    const [institute, setInstitute] = useState(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const printRef = useRef(null);

    useEffect(() => {
        const fetchCollections = async () => {
            if (!instituteId || !selectedDate) return;
            setLoading(true);

            try {
                // Fetch collections data from fee_transactions
                const collectionsUrl = `${API_BASE}/fee_transactions?institute_id=${encodeURIComponent(instituteId)}&payment_date=${encodeURIComponent(selectedDate)}`;
                const collectionsRes = await fetch(collectionsUrl, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                const collectionsData = await collectionsRes.json();

                // Fetch institute data
                const instituteUrl = `${API_BASE}/institutes`;
                const instituteRes = await fetch(instituteUrl, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                const instituteData = await instituteRes.json();

                if (collectionsRes.ok) {
                    setCollections(Array.isArray(collectionsData) ? collectionsData : []);
                } else {
                    console.error("Error fetching collections:", collectionsData?.error || 'Failed to fetch collections');
                    setCollections([]);
                }

                if (instituteRes.ok && instituteData) {
                    // Find the institute with matching ID
                    const matchingInstitute = Array.isArray(instituteData) ?
                        instituteData.find(inst => inst.id == instituteId) : instituteData;
                    setInstitute(matchingInstitute);
                } else {
                    console.error("Error fetching institute data:", instituteData?.error || 'Failed to fetch institute data');
                    setInstitute(null);
                }
            } catch (error) {
                console.error("Network error fetching data:", error);
                setCollections([]);
                setInstitute(null);
            } finally {
                setLoading(false);
            }
        };
        fetchCollections();
    }, [instituteId, selectedDate, API_BASE]);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Collection_Report_${selectedDate}`,
    });

    const totalCollected = collections.reduce((sum, item) => sum + item.amount_paid, 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>Fee Collection History</CardTitle>
                        <CardDescription>A summary of all fees collected on the selected date.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div>
                            <Label htmlFor="collection-date" className="sr-only">Select Date</Label>
                            <Input type="date" id="collection-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                        </div>
                        <Button onClick={handlePrint} variant="outline" className="print-hidden"><Printer className="mr-2 h-4 w-4" /> Print Report</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div ref={printRef} className="p-2 printable-area">
                        <div className="text-center mb-4 hidden print-block">
                            {institute?.logo_url && <img src={institute.logo_url} alt="Logo" className="h-16 w-16 mx-auto object-contain" />}
                            <h1 className="text-xl font-bold">{institute?.name}</h1>
                            <h2 className="text-lg font-semibold">Daily Collection Report for {format(new Date(selectedDate), 'PPP')}</h2>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Bill</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Payment Date</TableHead>
                                    <TableHead className="text-right">Amount Paid</TableHead>
                                    <TableHead className="text-right print-hidden">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && <TableRow><TableCell colSpan="6" className="text-center">Loading...</TableCell></TableRow>}
                                {!loading && collections.length === 0 && <TableRow><TableCell colSpan="6" className="text-center">No collections on {format(new Date(selectedDate), 'PPP')}.</TableCell></TableRow>}
                                {!loading && collections.map(col => (
                                    <TableRow key={col.id}>
                                        <TableCell>{col.students.full_name} ({col.students.gr_no})</TableCell>
                                        <TableCell>{col.fee_bills.bill_name}</TableCell>
                                        <TableCell className="capitalize">{col.payment_mode}</TableCell>
                                        <TableCell>{format(new Date(col.payment_date), 'dd MMM, yyyy')}</TableCell>
                                        <TableCell className="text-right font-medium">₹{col.amount_paid.toFixed(2)}</TableCell>
                                        <TableCell className="text-right print-hidden">
                                            <Button variant="ghost" size="sm" onClick={() => setPrintingReceiptId(col.id)}>
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="text-right font-bold text-lg mt-4 pr-4">
                            Total Collected: ₹{totalCollected.toFixed(2)}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>

            <Dialog open={!!printingReceiptId} onOpenChange={() => setPrintingReceiptId(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle>Fee Receipt</DialogTitle></DialogHeader>
                    {printingReceiptId && <FeeReceipt transactionId={printingReceiptId} />}
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default TodaysCollections;