import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { API_BASE } from '@/lib/constants';

const MasterFeeAssignment = ({ instituteId }) => {
    const { toast } = useToast();
    const [classes, setClasses] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [assignedFees, setAssignedFees] = useState([]);
    const [newFee, setNewFee] = useState({ fee_type_id: '', amount: ''});
    const [loading, setLoading] = useState(false);

    const fetchInitialData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const classPromise = fetch(`${API_BASE}/classes?institute_id=${instituteId}&order=class_name`, {
                method: 'GET',
                credentials: 'include'
            });
            const feeTypePromise = fetch(`${API_BASE}/fee_types?institute_id=${instituteId}&order=fee_name`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const [classResponse, feeTypeResponse] = await Promise.all([classPromise, feeTypePromise]);
            
            if (!classResponse.ok) throw new Error('Failed to fetch classes');
            if (!feeTypeResponse.ok) throw new Error('Failed to fetch fee types');
            
            const classData = await classResponse.json();
            const feeTypeData = await feeTypeResponse.json();
            
            setClasses(classData || []);
            setFeeTypes(feeTypeData || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching data", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const fetchAssignments = useCallback(async () => {
        if (!selectedClass) {
            setAssignedFees([]);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/class_fees?class_id=${selectedClass.id}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch assigned fees');
            
            const data = await response.json();
            setAssignedFees(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching assigned fees", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [selectedClass, toast]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleAssign = async () => {
        if (!newFee.fee_type_id || !newFee.amount) {
            toast({ variant: "destructive", title: "Please select a fee type and enter amount."});
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/class_fees`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    class_id: selectedClass.id,
                    institute_id: instituteId,
                    fee_type_id: newFee.fee_type_id,
                    amount: newFee.amount
                })
            });
            
            if (!response.ok) throw new Error('Failed to assign fee');
            
            const data = await response.json();
            setAssignedFees(prev => [...prev, data]);
            setNewFee({ fee_type_id: '', amount: '' });
            toast({ title: "Fee assigned successfully" });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to assign fee", description: error.message });
        }
    };
    
    const handleUnassign = async (classFeeId) => {
        try {
            const response = await fetch(`${API_BASE}/class_fees/${classFeeId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to unassign fee');
            
            setAssignedFees(prev => prev.filter(f => f.id !== classFeeId));
            toast({ title: "Fee unassigned successfully" });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to unassign fee.", description: error.message});
        }
    };
    
    const unassignedFeeTypes = feeTypes.filter(ft => !assignedFees.some(af => af.fee_type_id === ft.id));
    const totalAmount = assignedFees.reduce((sum, f) => sum + Number(f.amount), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="md:col-span-1">
                <h4 className="font-semibold mb-2">Select a Class</h4>
                <ScrollArea className="h-96">
                    <ul className="space-y-1 pr-2">
                        {classes.map(c => (
                            <li key={c.id}>
                                <Button 
                                    variant={selectedClass?.id === c.id ? 'secondary' : 'ghost'} 
                                    className="w-full justify-start text-left h-auto py-2"
                                    onClick={() => setSelectedClass(c)}
                                >
                                    <span className="font-semibold">{c.class_name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">({c.courses.course_name})</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </div>
             <div className="md:col-span-2">
                {selectedClass ? (
                    <div>
                        <h4 className="font-semibold mb-2">Manage Fees for {selectedClass.courses.course_name} - {selectedClass.class_name}</h4>
                        <div className="flex gap-2 mb-4">
                            <Select value={newFee.fee_type_id} onValueChange={(val) => setNewFee(p => ({ ...p, fee_type_id: val }))}>
                                <SelectTrigger><SelectValue placeholder="Select fee type..." /></SelectTrigger>
                                <SelectContent>
                                    {unassignedFeeTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft.fee_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Input 
                                type="number" 
                                placeholder="Amount" 
                                value={newFee.amount}
                                onChange={(e) => setNewFee(p => ({...p, amount: e.target.value}))}
                                className="w-32"
                            />
                            <Button onClick={handleAssign}>Assign</Button>
                        </div>
                        <h5 className="font-medium mb-2">Assigned Fees:</h5>
                        <ScrollArea className="h-64 border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fee Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>}
                                    {!loading && assignedFees.length === 0 && <TableRow><TableCell colSpan={3} className="text-center p-4">No fees assigned yet.</TableCell></TableRow>}
                                    {!loading && assignedFees.map(f => (
                                        <TableRow key={f.id}>
                                            <TableCell>{f.fee_types.fee_name}</TableCell>
                                            <TableCell className="text-right">₹{Number(f.amount).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="icon" variant="ghost" onClick={() => handleUnassign(f.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <div className="text-right font-bold text-lg mt-2">Total: ₹{totalAmount.toFixed(2)}</div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full border rounded-md bg-gray-50">
                        <p className="text-gray-500">Please select a class to manage its fee structure.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MasterFeeAssignment;