import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { toWords } from 'number-to-words';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

const FeeReceiptPrintable = React.forwardRef(({ data }, ref) => {
    if (!data) return null;

    const { transaction, student, class_details, course_details, bill, institute, student_total_outstanding, previous_transactions } = data;
    const amountInWords = toWords(transaction.amount_paid);

    return (
        <div ref={ref} className="p-4 font-sans text-black text-[10px] a5-landscape-page bg-white">
            <style>{`
                .receipt-table th, .receipt-table td {
                    border: 1px solid black;
                    padding: 4px;
                }
            `}</style>
            
            {institute.logo_url && (
                <div className="text-center mb-2">
                    <img src={institute.logo_url} alt="Institute Logo" className="h-16 mx-auto object-contain" />
                </div>
            )}
            
            {institute.receipt_header && (
                <div className="text-center mb-2" dangerouslySetInnerHTML={{ __html: institute.receipt_header }}></div>
            )}

            <div className="text-center my-2"><h2 className="text-base font-semibold underline underline-offset-4">FEE RECEIPT</h2></div>
            
            <div className="flex justify-between mb-2 text-xs">
                <p><strong>Receipt No:</strong> {transaction.id.substring(0, 8).toUpperCase()}</p>
                <p><strong>Date:</strong> {format(new Date(transaction.payment_date), "dd-MMM-yyyy")}</p>
            </div>

            <table className="w-full border-collapse mb-2 text-xs">
                <tbody>
                    <tr><td className="font-bold pr-2 py-0.5 align-top">Received with thanks from</td><td className="py-0.5">: {student.full_name}</td></tr>
                    <tr><td className="font-bold pr-2 py-0.5 align-top">GR No.</td><td className="py-0.5">: {student.gr_no || student.admission_no}</td></tr>
                    <tr><td className="font-bold pr-2 py-0.5 align-top">Class</td><td className="py-0.5">: {course_details?.course_name} - {class_details?.class_name} {class_details?.section || ''}</td></tr>
                </tbody>
            </table>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <table className="w-full border-collapse receipt-table text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="w-12 text-center">Sr. No.</th>
                                <th className="text-left">Particulars</th>
                                <th className="w-32 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="text-center">1</td>
                                <td>
                                    <p className="font-semibold">{bill.bill_name}</p>
                                    <p className="text-gray-600">{bill.misc_fee_details?.description || 'Payment towards generated fee bill.'}</p>
                                </td>
                                <td className="text-right">{transaction.amount_paid.toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="font-bold">
                                <td colSpan="2" className="text-right">Total Paid This Transaction</td>
                                <td className="text-right">₹{transaction.amount_paid.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div className="space-y-1 mt-2 text-xs">
                        <p><strong>Amount in Words:</strong> Rupees <span className="capitalize">{amountInWords}</span> only.</p>
                        <p><strong>Payment Mode:</strong> <span className="capitalize">{transaction.payment_mode.replace('_', ' ')}</span></p>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-xs mb-1">Previous Payments for this Bill</h3>
                    <table className="w-full border-collapse receipt-table text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                                <th>Date</th>
                                <th className="text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previous_transactions.length > 0 ? (
                                previous_transactions.map(pt => (
                                    <tr key={pt.id}>
                                        <td>{format(new Date(pt.payment_date), 'dd-MMM-yy')}</td>
                                        <td className="text-right">{Number(pt.amount_paid).toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="2" className="text-center py-2">No previous payments.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <table className="w-full mt-2 text-xs">
                <tbody>
                    <tr>
                        <td className="font-bold">Bill Total: ₹{Number(bill.total_amount).toFixed(2)}</td>
                        <td className="font-bold">Paid on this Bill: ₹{Number(bill.paid_amount).toFixed(2)}</td>
                        <td className="font-bold text-red-600">Balance on this Bill: ₹{Number(bill.balance_amount).toFixed(2)}</td>
                        <td className="font-bold text-red-600 text-right">Total Student Dues: ₹{Number(student_total_outstanding).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <footer className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-xs">
                <div>
                    {institute.receipt_footer && (
                        <div dangerouslySetInnerHTML={{ __html: institute.receipt_footer }}></div>
                    )}
                    <p className="mt-2">This is a computer-generated receipt.</p>
                </div>
                <div className="text-center">
                    <div className="h-12"></div>
                    <p className="border-t-2 border-dotted border-gray-800 px-8 pt-1">Authorized Signatory</p>
                </div>
            </footer>
        </div>
    );
});

const FeeReceipt = ({ transactionId }) => {
    const [receiptData, setReceiptData] = useState(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef(null);

    useEffect(() => {
        const fetchReceiptData = async () => {
            if (!transactionId) return;
            setLoading(true);
            try {
                const response = await fetch(`/crud/fee_receipts/${transactionId}`);
                const data = await response.json();
                if (response.ok) {
                    setReceiptData(data);
                } else {
                    console.error("Error fetching receipt data", data);
                }
            } catch (error) {
                console.error("Error fetching receipt data", error);
            }
            setLoading(false);
        };
        fetchReceiptData();
    }, [transactionId]);
    
    const handlePrint = useReactToPrint({ 
        content: () => componentRef.current
    });

    if (loading) return <div>Loading receipt...</div>;
    if (!receiptData) return <div>Receipt not found.</div>;

    return (
        <div>
            <div className="border rounded-lg overflow-hidden">
                <div className="hidden">
                    <FeeReceiptPrintable ref={componentRef} data={receiptData} />
                </div>
                {/* Preview */}
                <div className="relative h-[210mm] w-full transform scale-[0.3] -translate-y-[35%] -translate-x-[35%] origin-top-left overflow-hidden">
                    <FeeReceiptPrintable data={receiptData} />
                </div>
            </div>
            <div className="text-center mt-[-100px] mb-4 print-hidden">
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print Receipt (A5 Landscape)</Button>
            </div>
        </div>
    );
};

export default FeeReceipt;