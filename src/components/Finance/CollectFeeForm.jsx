import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FeeReceipt from './FeeReceipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const paymentSchema = z.object({
  amount_paid: z.coerce.number({invalid_type_error: "Please enter a valid amount"}).positive("Amount must be positive"),
  payment_mode: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'cheque']),
  transaction_details: z.string().optional(),
});

const CollectFeeForm = ({ student, bill, onSuccess }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const amountInputRef = useRef(null);
  
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_mode: 'cash',
      amount_paid: ''
    }
  });

  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    
    if (data.amount_paid > parseFloat(bill.balance_amount)) {
        toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Paid amount cannot be greater than the outstanding balance.' });
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`${API_BASE}/finance/fee-transactions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          institute_id: student.institute_id,
          fee_bill_id: bill.id,
          amount_paid: data.amount_paid,
          discount_amount: 0,
          payment_mode: data.payment_mode,
          transaction_details: { ref: data.transaction_details },
          collected_by: user.id,
          payment_date: new Date().toISOString()
        })
      });
      
      const transactionData = await res.json();
      
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Payment Failed', description: transactionData.error || 'Failed to process payment' });
      } else {
        toast({ title: 'Success!', description: 'Fee collected successfully.' });
        setLastTransactionId(transactionData.id);
        setIsReceiptOpen(true);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Network error occurred' });
    }
    setLoading(false);
  };
  
  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    setLastTransactionId(null);
    if(onSuccess) onSuccess();
  }

  return (
    <>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Outstanding Balance</Label>
                <p className="font-bold text-lg text-red-600">₹{Number(bill.balance_amount).toFixed(2)}</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="amount_paid">Amount Being Paid *</Label>
            <Input 
              id="amount_paid" 
              type="number" 
              step="0.01"
              {...register('amount_paid')} 
              ref={amountInputRef}
              placeholder="Enter amount"
              required 
            />
            {errors.amount_paid && <p className="text-red-500 text-sm mt-1">{errors.amount_paid.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="payment_mode">Payment Mode</Label>
                <Controller
                    name="payment_mode"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
            </div>
            <div>
                <Label htmlFor="transaction_details">Transaction Ref/ID</Label>
                <Input id="transaction_details" {...register('transaction_details')} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Collect Fee'}</Button>
          </div>
        </form>

        <Dialog open={isReceiptOpen} onOpenChange={handleCloseReceipt}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Fee Receipt</DialogTitle>
                    <DialogDescription>A copy of the fee payment receipt.</DialogDescription>
                </DialogHeader>
                <FeeReceipt transactionId={lastTransactionId} />
            </DialogContent>
        </Dialog>
    </>
  );
};

export default CollectFeeForm;