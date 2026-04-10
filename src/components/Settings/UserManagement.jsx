import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, UserPlus, Trash2, Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';

const UserManagement = () => {
  const { toast } = useToast();
  const { user, instituteId, isSuperAdmin } = useUser();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { register, handleSubmit, control, reset } = useForm();
  
  const fetchUsers = useCallback(async () => {
    if (!instituteId && !isSuperAdmin) {
        setUsers([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      let url = '/crud/employees?expand=roles';
      if (instituteId) {
        url = `${url}&institute_id=${instituteId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching users' });
    } finally {
      setLoading(false);
    }
  }, [instituteId, isSuperAdmin, toast]);

  const fetchSupportingData = useCallback(async () => {
    try {
      // Fetch roles
      const rolesResponse = await fetch('/crud/roles');
      const rolesData = await rolesResponse.json();
      setRoles(rolesData || []);

      if (isSuperAdmin) {
        // Fetch institutes for super admin
        const institutesResponse = await fetch('/crud/institutes?fields=id,name');
        const institutesData = await institutesResponse.json();
        setInstitutes(institutesData || []);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching supporting data' });
    }
  }, [isSuperAdmin, toast]);

  useEffect(() => {
    fetchUsers();
    fetchSupportingData();
  }, [fetchUsers, fetchSupportingData]);

  const handleOpenForm = (user = null) => {
    setEditingUser(user);
    reset(user ? { 
        full_name: user.full_name, 
        email: user.email, 
        designation: user.designation,
        role_id: user.role_id,
        institute_id: user.institute_id
    } : { institute_id: instituteId });
    setIsFormOpen(true);
  };
  
  const onSubmit = async (formData) => {
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `/crud/employees/${editingUser.id}` : '/crud/employees';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving user');
      }

      toast({ title: 'Success', description: `User ${editingUser ? 'updated' : 'created'} successfully` });
      setIsFormOpen(false);
      fetchUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`/crud/employees/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting user');
      }

      toast({ title: 'Success', description: 'User deleted successfully' });
      fetchUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  if (!instituteId && !isSuperAdmin) {
      return (<Card><CardHeader><CardTitle>User Management</CardTitle></CardHeader><CardContent><p>Select an institute to manage users.</p></CardContent></Card>);
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>{isSuperAdmin ? 'Manage users across all institutes.' : 'Manage users for your institute.'}</CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()} disabled={!instituteId && !isSuperAdmin}><UserPlus className="mr-2 h-4 w-4" /> Add User</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p>Loading users...</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.designation}</TableCell>
                  <TableCell>{user.roles?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.user_id ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user.user_id ? 'Active' : 'Invited'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingUser ? 'Edit' : 'Add'} User</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input {...register('full_name')} placeholder="Full Name" required />
                <Input {...register('email')} type="email" placeholder="Email" required />
                <Input {...register('designation')} placeholder="Designation" />
                <Controller name="role_id" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                        <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                )} />
                {isSuperAdmin && (
                     <Controller name="institute_id" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select an institute" /></SelectTrigger>
                            <SelectContent>{institutes.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                        </Select>
                    )} />
                )}
                 <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                    <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    </>
  );
};

export default UserManagement;