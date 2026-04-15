import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import numberToWords from 'number-to-words';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const ExpenseReceipt = ({ expenseId }) => {
    const [expense, setExpense] = useState(null);
    const [institute, setInstitute] = useState(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef();

    useEffect(() => {
        const fetchReceiptData = async () => {
            if (!expenseId) return;
            setLoading(true);

            try {
                // Fetch expense data
                const expenseRes = await fetch(`${API_BASE}/accounts/expenses/${encodeURIComponent(expenseId)}`, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const expenseData = await expenseRes.json();
                
                if (!expenseRes.ok) {
                    console.error("Error fetching expense", expenseData.error);
                    setLoading(false);
                    return;
                }
                
                setExpense(expenseData);

                if (expenseData) {
                    // Fetch institute data
                    const instRes = await fetch(`${API_BASE}/institutes/${encodeURIComponent(expenseData.institute_id)}`, {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    const instData = await instRes.json();
                    
                    if (!instRes.ok) {
                        console.error("Error fetching institute data", instData.error);
                    } else {
                        setInstitute(instData);
                    }
                }
            } catch (error) {
                console.error("Network error fetching receipt data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReceiptData();
    }, [expenseId, API_BASE]);
    
    const handlePrint = useReactToPrint({ contentRef: componentRef });

    if (loading) return <div>Loading receipt...</div>;
    if (!expense) return <div>Receipt not found.</div>;

    const amountInWords = numberToWords.toWords(expense.amount);

    return (
        <div>
            <div ref={componentRef} className="a4-page font-sans text-black">
                <header className="flex items-center gap-4 mb-8">
                    {institute?.logo_url && <img src={institute.logo_url} alt="Logo" className="h-16 w-16 object-contain" />}
                    <div>
                        <h1 className="text-xl font-bold">{institute?.name}</h1>
                        <p className="text-sm">{institute?.address}</p>
                    </div>
                </header>
                <div className="text-center my-4"><h1 className="text-xl font-bold underline">EXPENSE VOUCHER</h1></div>
                <div className="flex justify-between text-sm mb-4"><p><strong>Voucher No:</strong> {expense.id.substring(0, 8)}</p><p><strong>Date:</strong> {new Date(expense.expense_date).toLocaleDateString()}</p></div>
                <div className="text-sm space-y-1"><p><strong>Paid to:</strong> {expense.vendor || 'N/A'}</p><p><strong>The sum of Rupees:</strong> <span className="capitalize">{amountInWords} only.</span></p><p><strong>Towards:</strong> {expense.expense_categories.category_name}</p>{expense.description && <p><strong>Details:</strong> {expense.description}</p>}</div>
                <div className="mt-6 flex justify-between items-end"><div className="text-sm"><p><strong>Payment Mode:</strong> Cash/Bank</p></div><div className="text-center p-2 border border-black"><p className="text-lg font-bold">₹{expense.amount.toFixed(2)}</p></div></div>
                <div className="mt-12 pt-12 flex justify-between text-sm"><div><p>........................................</p><p>(Receiver's Signature)</p></div><div className="text-right"><p>........................................</p><p>(Authorized Signatory)</p></div></div>
            </div>
            <div className="text-center mt-4 print-hidden"><Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print Voucher</Button></div>
        </div>
    );
};

export default ExpenseReceipt;