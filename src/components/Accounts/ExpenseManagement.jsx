import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Printer } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import ExpenseReceipt from './ExpenseReceipt';

const ExpenseForm = ({ instituteId, categories, expense, onSave, onCancel }) => {
    const { user } = useUser();
    const { toast } = useToast();
    const [formData, setFormData] = useState(expense || { category_id: '', amount: '', expense_date: '', description: '', vendor: '' });
    const [lastExpenseId, setLastExpenseId] = useState(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    useEffect(() => {
        if (expense) {
            setFormData(expense);
        } else {
            setFormData({ category_id: '', amount: '', expense_date: new Date().toISOString().split('T')[0], description: '', vendor: '' });
        }
    }, [expense]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = { 
            ...formData, 
            institute_id: instituteId,
            created_by: user.id,
            expense_date: formData.expense_date || new Date().toISOString().split('T')[0]
        };

        try {
            const res = await fetch(`${API_BASE}/accounts/expenses${formData.id ? `/${formData.id}` : ''}`, {
                method: formData.id ? 'PUT' : 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Error saving expense', description: data.error || 'Failed to save expense' });
                return;
            }
            
            toast({ title: 'Success', description: 'Expense saved.' });
            setLastExpenseId(data.id);
            setIsReceiptOpen(true);
            onSave();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Network error occurred' });
        }
    };

    const handleCloseAndReset = () => {
        setIsReceiptOpen(false);
        setLastExpenseId(null);
        onCancel();
    }

    return (
        <>
            <Dialog open={!isReceiptOpen} onOpenChange={onCancel}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{formData.id ? 'Edit' : 'Add'} Expense</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category_id">Category</Label>
                            <Select required value={formData.category_id} onValueChange={val => setFormData(p => ({...p, category_id: val}))}>
                                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" value={formData.amount} onChange={e => setFormData(p => ({...p, amount: e.target.value}))} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expense_date">Date</Label>
                            <Input id="expense_date" type="date" value={formData.expense_date} onChange={e => setFormData(p => ({...p, expense_date: e.target.value}))} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor/Payee</Label>
                            <Input id="vendor" value={formData.vendor || ''} onChange={e => setFormData(p => ({...p, vendor: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isReceiptOpen} onOpenChange={handleCloseAndReset}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>Expense Receipt</DialogTitle></DialogHeader>
                    {lastExpenseId && <ExpenseReceipt expenseId={lastExpenseId} />}
                </DialogContent>
            </Dialog>
        </>
    );
};


const ExpenseManagement = ({ instituteId }) => {
    const { toast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [printingExpenseId, setPrintingExpenseId] = useState(null);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/accounts/expenses?institute_id=${encodeURIComponent(instituteId)}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Error fetching expenses', description: data.error || 'Failed to fetch expenses' });
            } else {
                setExpenses(data || []);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Network error occurred' });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast, API_BASE]);
    
    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/accounts/expense-categories?institute_id=${encodeURIComponent(instituteId)}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Error fetching categories', description: data.error || 'Failed to fetch categories' });
            } else {
                setCategories(data || []);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Network error occurred' });
        }
    }, [instituteId, toast, API_BASE]);

    useEffect(() => {
        if(instituteId) {
            fetchExpenses();
            fetchCategories();
        }
    }, [instituteId, fetchExpenses, fetchCategories]);

    const handleOpenForm = (expense = null) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };

    const handleSave = () => {
        fetchExpenses();
        // The form will now handle its own visibility for the receipt
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingExpense(null);
    }

    const handleDelete = async (expenseId) => {
        try {
            const res = await fetch(`${API_BASE}/accounts/expenses/${encodeURIComponent(expenseId)}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Error deleting expense', description: data.error || 'Failed to delete expense' });
            } else {
                toast({ title: 'Expense deleted.' });
                fetchExpenses();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Network error occurred' });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Expense Management</CardTitle>
                        <CardDescription>Track and manage all institutional expenses.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add Expense</Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan="6" className="text-center">Loading...</TableCell></TableRow>}
                            {!loading && expenses.length === 0 && <TableRow><TableCell colSpan="6" className="text-center">No expenses recorded.</TableCell></TableRow>}
                            {!loading && expenses.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{expense.expense_categories?.category_name}</TableCell>
                                    <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell>{expense.vendor}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setPrintingExpenseId(expense.id)}><Printer className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(expense)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>

            {isFormOpen && (
                 <ExpenseForm 
                    instituteId={instituteId} 
                    categories={categories}
                    expense={editingExpense}
                    onSave={handleSave}
                    onCancel={handleCloseForm}
                />
            )}
            
            <Dialog open={!!printingExpenseId} onOpenChange={() => setPrintingExpenseId(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>Expense Receipt</DialogTitle></DialogHeader>
                    {printingExpenseId && <ExpenseReceipt expenseId={printingExpenseId} />}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default ExpenseManagement;