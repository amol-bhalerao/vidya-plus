import React, { useState, useEffect, useCallback } from 'react';
// API_BASE is needed for backend calls
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Settings, ListPlus, Link2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const FeeItemsManager = ({ group, feeTypes, onItemsChanged }) => {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ fee_type_id: '', amount: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
                const response = await fetch(`${API_BASE}/fee_group_items?fee_group_id=${group.id}&include=fee_types`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (!response.ok) throw new Error('Failed to fetch fee items');
                
                const data = await response.json();
                setItems(data || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching fee items', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [group.id, toast]);

    const handleAddItem = async () => {
        if (!newItem.fee_type_id || !newItem.amount) {
            toast({ variant: 'destructive', title: 'Please select a fee type and enter an amount.' });
            return;
        }

        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/fee_group_items`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fee_group_id: group.id,
                    fee_type_id: newItem.fee_type_id,
                    amount: newItem.amount
                })
            });
            
            if (!response.ok) throw new Error('Failed to add fee item');
            
            const data = await response.json();
            setItems(prev => [...prev, data]);
            setNewItem({ fee_type_id: '', amount: '' });
            onItemsChanged();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error adding fee item', description: error.message });
        }
    };
    
    const handleRemoveItem = async (itemId) => {
        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/fee_group_items/${itemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to remove fee item');
            
            setItems(prev => prev.filter(item => item.id !== itemId));
            onItemsChanged();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error removing item', description: error.message });
        }
    };

    const availableFeeTypes = feeTypes.filter(ft => !items.some(item => item.fee_type_id === ft.id));

    return (
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>Manage Fee Items for "{group.group_name}"</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <div className="flex gap-2 mb-4">
                    <Select value={newItem.fee_type_id} onValueChange={value => setNewItem(p => ({...p, fee_type_id: value}))}>
                        <SelectTrigger><SelectValue placeholder="Select Fee Type" /></SelectTrigger>
                        <SelectContent>
                            {availableFeeTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft.fee_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Input 
                        type="number" 
                        placeholder="Amount" 
                        value={newItem.amount} 
                        onChange={e => setNewItem(p => ({...p, amount: e.target.value}))}
                        className="w-32"
                    />
                    <Button onClick={handleAddItem}><ListPlus className="h-4 w-4 mr-2"/> Add Item</Button>
                </div>
                <ScrollArea className="h-[300px] border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow> :
                             items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.fee_types.fee_name}</TableCell>
                                    <TableCell>₹{item.amount}</TableCell>
                                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </DialogContent>
    );
};

const AssignToClassManager = ({ group, instituteId, onAssignmentChanged }) => {
    const { toast } = useToast();
    const [classes, setClasses] = useState([]);
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClassesAndAssignments = async () => {
            setLoading(true);
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
    const classesPromise = fetch(`${API_BASE}/classes?institute_id=${instituteId}&include=courses`, {
        method: 'GET',
        credentials: 'include'
    }).then(res => res.json());
    const assignmentsPromise = fetch(`${API_BASE}/class_fee_groups?fee_group_id=${group.id}`, {
        method: 'GET',
        credentials: 'include'
    }).then(res => res.json());
            try {
                  const [classData, assignmentData] = await Promise.all([classesPromise, assignmentsPromise]);
                  setClasses(classData || []);
                  setAssignedClasses(assignmentData?.map(a => a.class_id) || []);
              } catch (error) {
                  toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
              }
            setLoading(false);
        };
        fetchClassesAndAssignments();
    }, [group.id, instituteId, toast]);

    const handleAssign = async () => {
        if (!selectedClassId) {
            toast({ variant: 'destructive', title: 'Please select a class' });
            return;
        }

        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/class_fee_groups`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    class_id: selectedClassId,
                    fee_group_id: group.id
                })
            });
            
            if (!response.ok) throw new Error('Failed to assign fee group');
            
            setAssignedClasses(prev => [...prev, selectedClassId]);
            setSelectedClassId('');
            onAssignmentChanged();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error assigning fee group', description: error.message });
        }
    };
    
    const handleRemove = async (classId) => {
        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/class_fee_groups/delete`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    class_id: classId,
                    fee_group_id: group.id
                })
            });
            
            if (!response.ok) throw new Error('Failed to remove assignment');
            
            setAssignedClasses(prev => prev.filter(id => id !== classId));
            onAssignmentChanged();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error removing assignment', description: error.message });
        }
    };

    const availableClasses = classes.filter(c => !assignedClasses.includes(c.id));
    const assignedClassDetails = classes.filter(c => assignedClasses.includes(c.id));

    return (
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader><DialogTitle>Assign "{group.group_name}" to Classes</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <div className="flex gap-2">
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger><SelectValue placeholder="Select a class to assign..." /></SelectTrigger>
                        <SelectContent>
                            {availableClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.courses.course_name} - {c.class_name}{c.section && ` (${c.section})`}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAssign} disabled={!selectedClassId}>Assign</Button>
                </div>
                <h4 className="font-semibold">Assigned Classes</h4>
                <ScrollArea className="h-[250px] border rounded-md p-2">
                    {assignedClassDetails.length > 0 ? (
                        assignedClassDetails.map(c => (
                            <div key={c.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-100">
                                <span>{c.courses.course_name} - {c.class_name}{c.section && ` (${c.section})`}</span>
                                <Button size="sm" variant="destructive" onClick={() => handleRemove(c.id)}>Remove</Button>
                            </div>
                        ))
                    ) : <p className="text-center text-gray-500 p-4">Not assigned to any classes yet.</p>}
                </ScrollArea>
            </div>
        </DialogContent>
    );
};


const FeeGroupManagement = ({ instituteId }) => {
    const { toast } = useToast();
    const [feeGroups, setFeeGroups] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isItemsManagerOpen, setIsItemsManagerOpen] = useState(false);
    const [isAssignClassOpen, setIsAssignClassOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const fetchFeeGroups = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/fee_groups?institute_id=${instituteId}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch fee groups');
            
            const data = await response.json();
            setFeeGroups(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching fee groups', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        const fetchFeeTypes = async () => {
             if (!instituteId) return;
             try {
                const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
                const response = await fetch(`${API_BASE}/fee_types?institute_id=${instituteId}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (!response.ok) throw new Error('Failed to fetch fee types');
                
                const data = await response.json();
                setFeeTypes(data || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching fee types', description: error.message });
            }
        };
        fetchFeeGroups();
        fetchFeeTypes();
    }, [instituteId, fetchFeeGroups]);

    const handleOpenForm = (group = null) => {
        if (group) {
            setEditingGroup(group);
            setFormData(group);
        } else {
            setEditingGroup(null);
            setFormData({ group_name: '', description: '', is_admission_group: false });
        }
        setIsFormOpen(true);
    };

    const handleOpenItemsManager = (group) => {
        setEditingGroup(group);
        setIsItemsManagerOpen(true);
    };

    const handleOpenAssignClass = (group) => {
        setEditingGroup(group);
        setIsAssignClassOpen(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = { ...formData, institute_id: instituteId };
        
        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            const method = editingGroup ? 'PUT' : 'POST';
            const url = editingGroup 
                ? `${API_BASE}/fee_groups/${editingGroup.id}` 
                : `${API_BASE}/fee_groups`;
            
            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSubmit)
            });
            
            if (!response.ok) throw new Error('Failed to save fee group');
            
            toast({ title: 'Success!', description: `Fee group saved.` });
            fetchFeeGroups();
            setIsFormOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving group', description: error.message });
        }
    };
    
    const handleDeleteGroup = async (groupId) => {
        if (!confirm('Are you sure you want to delete this fee group? This action cannot be undone.')) {
            return;
        }

        try {
            const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/fee_groups/${groupId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to delete fee group');
            
            toast({ title: 'Success', description: 'Fee group deleted' });
            fetchFeeGroups();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting fee group', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Fee Group Management</CardTitle>
                        <CardDescription>Create and manage fee bundles for different classes.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add Fee Group</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Group Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Admission Group</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow> :
                         feeGroups.map(group => (
                            <TableRow key={group.id}>
                                <TableCell>{group.group_name}</TableCell>
                                <TableCell>{group.description}</TableCell>
                                <TableCell>{group.is_admission_group ? 'Yes' : 'No'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" title="Manage Items" onClick={() => handleOpenItemsManager(group)}><Settings className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" title="Assign to Classes" onClick={() => handleOpenAssignClass(group)}><Link2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" title="Edit Group" onClick={() => handleOpenForm(group)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" title="Delete Group" onClick={() => handleDelete(group.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </TableCell>
                            </TableRow>
                         ))}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? 'Edit' : 'Create'} Fee Group</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="group_name">Group Name</Label>
                            <Input id="group_name" value={formData.group_name || ''} onChange={e => setFormData(p => ({...p, group_name: e.target.value}))} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="is_admission_group" checked={formData.is_admission_group || false} onCheckedChange={checked => setFormData(p => ({...p, is_admission_group: checked}))} />
                            <Label htmlFor="is_admission_group">Assign automatically on new admission?</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isItemsManagerOpen} onOpenChange={setIsItemsManagerOpen}>
                {editingGroup && <FeeItemsManager group={editingGroup} feeTypes={feeTypes} onItemsChanged={fetchFeeGroups} />}
            </Dialog>

            <Dialog open={isAssignClassOpen} onOpenChange={setIsAssignClassOpen}>
                 {editingGroup && <AssignToClassManager group={editingGroup} instituteId={instituteId} onAssignmentChanged={fetchFeeGroups} />}
            </Dialog>
        </Card>
    );
};

export default FeeGroupManagement;