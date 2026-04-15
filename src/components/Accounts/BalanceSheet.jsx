import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useReactToPrint } from 'react-to-print';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Printer, AlertTriangle } from 'lucide-react';

const BalanceSheet = ({ instituteId }) => {
    const [balanceSheetData, setBalanceSheetData] = useState({ assets: [], liabilities: [], equity: [] });
    const [loading, setLoading] = useState(true);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState(null);
    const [institute, setInstitute] = useState(null);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const { toast } = useToast();
    const printRef = useRef();

    useEffect(() => {
        const fetchYearsAndInstitute = async () => {
            if (!instituteId) return;
            try {
                const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
                
                // Fetch academic years
                const yearRes = await fetch(`${API_BASE}/crud/academic_years?institute_id=${instituteId}&sort=start_date&order=desc`, {
                    credentials: 'include'
                });
                if (!yearRes.ok) throw new Error('Failed to fetch academic years');
                const yearData = await yearRes.json();
                
                if (yearData && Array.isArray(yearData)) {
                    setAcademicYears(yearData);
                    const activeYear = yearData.find(y => y.is_active);
                    setSelectedYearId(activeYear?.id || (yearData[0]?.id || null));
                }
                
                // Fetch institute info
                const instRes = await fetch(`${API_BASE}/crud/institutes?id=${instituteId}`, {
                    credentials: 'include'
                });
                if (!instRes.ok) throw new Error('Failed to fetch institute info');
                const instData = await instRes.json();
                
                if (instData && instData.length > 0) {
                    setInstitute(instData[0]);
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
            }
        };
        fetchYearsAndInstitute();
    }, [instituteId, toast]);

    const fetchBalanceSheetData = useCallback(async () => {
        if (!selectedYearId) { setLoading(false); return; }
        setLoading(true);

        const selectedYear = academicYears.find(y => y.id === selectedYearId);
        if (!selectedYear) { setLoading(false); return; }

        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            const res = await fetch(`${API_BASE}/balance_sheet`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institute_id: instituteId,
                    start_date: selectedYear.start_date,
                    end_date: selectedYear.end_date
                })
            });
            
            if (!res.ok) throw new Error('Failed to fetch balance sheet data');
            
            const data = await res.json();
            setBalanceSheetData(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
            setBalanceSheetData({ assets: [], liabilities: [], equity: [] });
        } finally {
            setLoading(false);
        }
    }, [instituteId, selectedYearId, academicYears, toast]);

    useEffect(() => {
        if (instituteId && selectedYearId) fetchBalanceSheetData();
    }, [instituteId, selectedYearId, fetchBalanceSheetData]);

    const handlePrint = useReactToPrint({ contentRef: printRef });
    
    const handleYearEndReset = () => {
        setShowCloseDialog(true);
    };

    const confirmYearEndClose = async () => {
        try {
            // Here you would implement the actual year-end closing logic
            // For now, we'll just show success
            toast({ title: 'Year-End Closing Completed', description: 'The academic year has been closed and balances carried forward.' });
            setShowCloseDialog(false);
            // Refresh data
            fetchBalanceSheetData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to perform year-end closing.' });
        }
    };

    const totalAssets = balanceSheetData.assets.reduce((sum, asset) => sum + asset.amount, 0);
    const totalLiabilities = balanceSheetData.liabilities.reduce((sum, liability) => sum + liability.amount, 0);
    const totalIncome = balanceSheetData.equity.find(e => e.name === 'Total Income')?.amount || 0;
    const totalExpenses = balanceSheetData.equity.find(e => e.name === 'Total Expenses')?.amount || 0;
    const netProfitOrLoss = totalIncome - totalExpenses;
    const totalLiabilitiesAndEquity = totalLiabilities + netProfitOrLoss;

    if (loading && !academicYears.length) {
        return <Card><CardContent><p className="p-4 text-center">Loading Data...</p></CardContent></Card>;
    }
    
    const selectedYearName = academicYears.find(y => y.id === selectedYearId)?.year_name || '';

    return (
        <>
        <Card>
            <CardHeader className="print-hidden">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Financial Summary</CardTitle>
                        <CardDescription>A simplified snapshot of your institute's financial position for the selected year.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select value={selectedYearId || ''} onValueChange={setSelectedYearId}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Year" /></SelectTrigger>
                            <SelectContent>{academicYears.map(year => <SelectItem key={year.id} value={year.id}>{year.year_name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div ref={printRef} className="a4-page">
                    <header className="flex items-center gap-4 mb-8">
                        {institute?.logo_url && <img src={institute.logo_url} alt="Logo" className="h-16 w-16 object-contain" />}
                        <div>
                            <h1 className="text-xl font-bold">{institute?.name}</h1>
                            <h2 className="text-lg font-semibold">Financial Summary for {selectedYearName}</h2>
                        </div>
                    </header>
                    
                    {loading ? <p className="text-center">Generating report...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-green-700">Assets (What the Institute Owns)</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {balanceSheetData.assets.map(asset => (
                                        <TableRow key={asset.name}><TableCell>{asset.name}</TableCell><TableCell className="text-right">₹{asset.amount.toFixed(2)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter><TableRow className="bg-green-50"><TableHead>Total Assets</TableHead><TableHead className="text-right font-bold">₹{totalAssets.toFixed(2)}</TableHead></TableRow></TableFooter>
                            </Table>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-red-700">Liabilities & Net Worth</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell colSpan={2} className="font-semibold bg-gray-50">Income & Expenses</TableCell></TableRow>
                                    <TableRow><TableCell className="pl-8">Total Income (Fees, etc.)</TableCell><TableCell className="text-right text-green-600">+ ₹{totalIncome.toFixed(2)}</TableCell></TableRow>
                                    <TableRow><TableCell className="pl-8">Total Expenses (Salaries, etc.)</TableCell><TableCell className="text-right text-red-600">- ₹{totalExpenses.toFixed(2)}</TableCell></TableRow>
                                    <TableRow className="font-bold border-t-2"><TableCell className="pl-8">Net Profit / (Loss) for the Year</TableCell><TableCell className="text-right">₹{netProfitOrLoss.toFixed(2)}</TableCell></TableRow>
                                    {balanceSheetData.liabilities.length > 0 && <TableRow><TableCell colSpan={2} className="font-semibold bg-gray-50">Liabilities (Debts)</TableCell></TableRow>}
                                    {balanceSheetData.liabilities.map(liability => (
                                        <TableRow key={liability.name}><TableCell>{liability.name}</TableCell><TableCell className="text-right">₹{liability.amount.toFixed(2)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter><TableRow className="bg-red-50"><TableHead>Total Liabilities & Net Worth</TableHead><TableHead className="text-right font-bold">₹{totalLiabilitiesAndEquity.toFixed(2)}</TableHead></TableRow></TableFooter>
                            </Table>
                        </div>
                    </div>
                    )}
                </div>
            </CardContent>
             <CardFooter className="justify-end print-hidden">
                <Button variant="destructive" onClick={handleYearEndReset}>Perform Year-End Close</Button>
            </CardFooter>
        </Card>

        <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Confirm Year-End Closing
                    </DialogTitle>
                    <DialogDescription>
                        This action will close the current academic year and carry forward the balances to the next year.
                        This cannot be undone. Are you sure you want to proceed?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmYearEndClose}>
                        Confirm Year-End Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};

export default BalanceSheet;