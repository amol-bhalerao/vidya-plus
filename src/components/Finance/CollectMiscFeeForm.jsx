import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FeeReceipt from './FeeReceipt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const miscPaymentSchema = z.object({
  fee_type_id: z.string().min(1, "Fee type is required"),
  amount_paid: z.coerce.number().positive("Amount must be positive"),
  payment_mode: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'cheque']),
  transaction_details: z.string().optional(),
});

const CollectMiscFeeForm = ({ student, onSuccess }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [feeTypes, setFeeTypes] = useState([]);
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [feeDetails, setFeeDetails] = useState(null);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(miscPaymentSchema),
    defaultValues: { payment_mode: 'cash' }
  });

  const selectedFeeTypeId = watch('fee_type_id');

  useEffect(() => {
    const fetchFeeTypes = async () => {
      try {
        const res = await fetch(`${API_BASE}/finance/fee-types?institute_id=${student.institute_id}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data) setFeeTypes(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch fee types' });
      }
    };
    fetchFeeTypes();
  }, [student.institute_id, toast]);
  
  useEffect(() => {
    const getFeeDetails = async () => {
      if (!selectedFeeTypeId) {
        setFeeDetails(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/finance/student-fee-details`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: student.id,
            fee_type_id: selectedFeeTypeId
          })
        });
        const data = await res.json();
        
        if (!res.ok) {
          toast({ variant: 'destructive', title: 'Error fetching fee details', description: data.error || 'Failed to fetch fee details' });
          setFeeDetails(null);
        } else {
          setFeeDetails(data);
          if (data && !data.error) {
              setValue('amount_paid', data.class_fee_amount);
          } else {
              setValue('amount_paid', '');
          }
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Network error occurred' });
        setFeeDetails(null);
      }
      setLoading(false);
    }
    getFeeDetails();
  }, [selectedFeeTypeId, student.id, toast, setValue]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/finance/collect-misc-fee`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          institute_id: student.institute_id,
          fee_type_id: formData.fee_type_id,
          amount_paid: formData.amount_paid,
          payment_mode: formData.payment_mode,
          transaction_details: { ref: formData.transaction_details },
          collected_by: user.id
        })
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Payment Failed', description: result.error || 'Failed to process payment' });
      } else {
        toast({ title: 'Success!', description: 'Fee collected successfully.' });
        setLastTransactionId(result.transaction_id);
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
  };
  
  const canSubmit = feeDetails && !feeDetails.error;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div>
          <Label htmlFor="fee_type_id">Fee Type *</Label>
          <Controller name="fee_type_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select fee type..." /></SelectTrigger>
              <SelectContent>{feeTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft.fee_name}</SelectItem>)}</SelectContent>
            </Select>)}
          />
          {errors.fee_type_id && <p className="text-red-500 text-sm mt-1">{errors.fee_type_id.message}</p>}
        </div>

        {feeDetails && feeDetails.error && (
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Heads up!</AlertTitle><AlertDescription>{feeDetails.error}</AlertDescription></Alert>
        )}

        {feeDetails && !feeDetails.error && (
            <Card className="bg-muted/50"><CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Applicable Fee:</span><span className="font-medium">₹{feeDetails.class_fee_amount.toFixed(2)}</span></div>
            </CardContent></Card>
        )}

        <div>
          <Label htmlFor="amount_paid">Amount to Pay *</Label>
          <Input id="amount_paid" type="number" {...register('amount_paid')} required disabled={!canSubmit}/>
          {errors.amount_paid && <p className="text-red-500 text-sm mt-1">{errors.amount_paid.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment_mode">Payment Mode</Label>
            <Controller name="payment_mode" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent>
              </Select>)}
            />
          </div>
          <div>
            <Label htmlFor="transaction_details">Transaction Ref/ID</Label>
            <Input id="transaction_details" {...register('transaction_details')} />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading || !canSubmit}>{loading ? 'Processing...' : 'Collect Fee'}</Button>
        </div>
      </form>

      <Dialog open={isReceiptOpen} onOpenChange={handleCloseReceipt}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Fee Receipt</DialogTitle></DialogHeader><FeeReceipt transactionId={lastTransactionId} /></DialogContent></Dialog>
    </>
  );
};
export default CollectMiscFeeForm;