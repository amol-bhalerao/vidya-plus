import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useReactToPrint } from 'react-to-print';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { API_BASE } from '@/lib/constants';

const GeneralLedger = ({ instituteId }) => {
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [institute, setInstitute] = useState(null);
    const { toast } = useToast();
    const printRef = useRef();

    const fetchLedger = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            // Fetch general ledger entries
            const ledgerResponse = await fetch(`${API_BASE}/general_ledger?institute_id=${instituteId}&order_by=transaction_date,created_at&order_direction=desc,desc`, {
                method: 'GET',
                credentials: 'include'
            });
            
            // Fetch institute details
            const instituteResponse = await fetch(`${API_BASE}/institutes?id=${instituteId}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!ledgerResponse.ok) throw new Error('Failed to fetch ledger entries');
            if (!instituteResponse.ok) throw new Error('Failed to fetch institute details');
            
            const ledgerData = await ledgerResponse.json();
            const instituteData = await instituteResponse.json();
            
            setLedgerEntries(ledgerData || []);
            if (instituteData.length > 0) {
                setInstitute(instituteData[0]);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);
    
    let runningBalance = 0;
    const ledgerWithBalance = ledgerEntries.slice().reverse().map(entry => {
        runningBalance += (entry.debit || 0) - (entry.credit || 0);
        return { ...entry, balance: runningBalance };
    }).reverse();
    
    const handlePrint = useReactToPrint({ content: () => printRef.current });

    return (
        <Card>
            <CardHeader className="print-hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>General Ledger</CardTitle>
                        <CardDescription>A chronological record of all financial transactions.</CardDescription>
                    </div>
                    <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print Ledger</Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    <div ref={printRef} className="a4-page">
                        <header className="flex items-center gap-4 mb-8">
                           {institute?.logo_url && <img src={institute.logo_url} alt="Logo" className="h-16 w-16 object-contain" />}
                            <div>
                                <h1 className="text-xl font-bold">{institute?.name}</h1>
                                <h2 className="text-lg font-semibold">General Ledger</h2>
                            </div>
                        </header>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Debit</TableHead>
                                    <TableHead>Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>}
                                {!loading && ledgerEntries.length === 0 && <TableRow><TableCell colSpan="5" className="text-center">No transactions found.</TableCell></TableRow>}
                                {!loading && ledgerEntries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{new Date(entry.transaction_date).toLocaleDateString()}</TableCell>
                                        <TableCell>{entry.account}</TableCell>
                                        <TableCell>{entry.description}</TableCell>
                                        <TableCell className="text-red-600">{entry.debit ? `₹${entry.debit.toFixed(2)}` : '-'}</TableCell>
                                        <TableCell className="text-green-600">{entry.credit ? `₹${entry.credit.toFixed(2)}` : '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default GeneralLedger;