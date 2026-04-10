import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE } from '@/lib/constants';

const GenericMasterData = ({ tableName, title, description, columns, formFields, instituteId, selectJoins = '', orderBy = 'id' }) => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = useCallback(async () => {
    if (!instituteId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Build the API URL with parameters
      let url = `${API_BASE}/master-data?table=${encodeURIComponent(tableName)}&institute_id=${encodeURIComponent(instituteId)}&order_by=${encodeURIComponent(orderBy)}`;
      if (selectJoins) {
        url += `&joins=${encodeURIComponent(selectJoins)}`;
      }
      
      const res = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setData(data || []);
      } else {
        toast({ variant: 'destructive', title: `Error fetching ${title}`, description: data?.error || 'Failed to fetch data' });
        setData([]);
      }
    } catch (error) {
      console.error(`Network error fetching ${title}:`, error);
      toast({ variant: 'destructive', title: `Error fetching ${title}`, description: 'Network error occurred' });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [instituteId, tableName, title, toast, selectJoins, orderBy, API_BASE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = useCallback(() => {
    const initialFormState = formFields.reduce((acc, field) => {
      acc[field.name] = field.type === 'checkbox' ? false : '';
      return acc;
    }, {});
    setFormData(initialFormState);
    setEditingItem(null);
  }, [formFields]);

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      const itemData = formFields.reduce((acc, field) => {
        acc[field.name] = item[field.name];
        return acc;
      }, {});
      setFormData(itemData);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!instituteId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Institute not identified.' });
      return;
    }

    const dataToSubmit = { ...formData, institute_id: instituteId };

    try {
      let url, method;
      if (editingItem) {
        url = `${API_BASE}/master-data?table=${encodeURIComponent(tableName)}&id=${encodeURIComponent(editingItem.id)}`;
        method = 'PUT';
      } else {
        url = `${API_BASE}/master-data?table=${encodeURIComponent(tableName)}`;
        method = 'POST';
      }
      
      const res = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Success!', description: `${title} has been saved.` });
        fetchData();
        handleCloseDialog();
      } else {
        toast({ variant: 'destructive', title: `Error saving ${title}`, description: data?.error || 'Failed to save data' });
      }
    } catch (error) {
      console.error(`Network error saving ${title}:`, error);
      toast({ variant: 'destructive', title: `Error saving ${title}`, description: 'Network error occurred' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/master-data?table=${encodeURIComponent(tableName)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Success!', description: 'Item has been deleted.' });
        fetchData();
      } else {
        toast({ variant: 'destructive', title: 'Error deleting item', description: data?.error || 'Failed to delete item' });
      }
    } catch (error) {
      console.error('Network error deleting item:', error);
      toast({ variant: 'destructive', title: 'Error deleting item', description: 'Network error occurred' });
    }
  };
  
  const renderValue = (item, column) => {
      let value;
      if(column.accessorKey.includes('.')) {
          const keys = column.accessorKey.split('.');
          value = keys.reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : undefined, item);
      } else {
          value = item[column.accessorKey];
      }

      if (value === null || typeof value === 'undefined') return 'N/A';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (column.accessorKey.includes('date')) {
          try {
              return format(new Date(value), 'PPP');
          } catch {
              return value;
          }
      }
      return value;
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New
              </Button>
            </DialogTrigger>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={handleCloseDialog}>
              <DialogHeader>
                <DialogTitle>{editingItem ? `Edit ${title}` : `Add New ${title}`}</DialogTitle>
                <DialogDescription>Fill in the details below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formFields.map(field => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'checkbox' ? (
                       <div className="flex items-center space-x-2">
                        <Switch id={field.name} name={field.name} checked={formData[field.name] || false} onCheckedChange={(checked) => handleSwitchChange(field.name, checked)} />
                        </div>
                    ) : field.type === 'select' ? (
                        <Select onValueChange={(value) => handleSelectChange(field.name, value)} value={formData[field.name] || ''} disabled={field.options.length === 0}>
                            <SelectTrigger id={field.name}>
                                <SelectValue placeholder={field.options.length === 0 ? `Loading...` : `Select a ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type || 'text'}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading data...</p>
        ) : data.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No {title.toLowerCase()} found for this institute.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    {columns.map(col => <TableHead key={col.accessorKey}>{col.header}</TableHead>)}
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {data.map(item => (
                    <TableRow key={item.id}>
                    {columns.map(col => <TableCell key={col.accessorKey}>{renderValue(item, col)}</TableCell>)}
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenericMasterData;