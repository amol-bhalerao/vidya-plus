import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';

const GradeCalculation = ({ instituteId }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    
    const { register, control, handleSubmit, reset } = useForm({
        defaultValues: {
            grades: [{ grade_name: '', min_percentage: '', max_percentage: '', description: '' }]
        }
    });
    
    const { fields, append, remove } = useFieldArray({ control, name: "grades" });

    const fetchGrades = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/crud/grade_settings?institute_id=${instituteId}&order_by=min_percentage&order_direction=asc`);
            const data = await response.json();
            if (response.ok) {
                if (data && data.length > 0) {
                    reset({ grades: data });
                } else {
                    reset({ grades: [{ grade_name: '', min_percentage: '', max_percentage: '', description: '' }] });
                }
            } else {
                toast({ variant: 'destructive', title: 'Error fetching grades' });
                reset({ grades: [{ grade_name: '', min_percentage: '', max_percentage: '', description: '' }] });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching grades', description: error.message });
            reset({ grades: [{ grade_name: '', min_percentage: '', max_percentage: '', description: '' }] });
        }
        setLoading(false);
    }, [instituteId, toast, reset]);
    
    useEffect(() => {
        if(instituteId) fetchGrades();
    }, [instituteId, fetchGrades]);

    const onSubmit = async (data) => {
        setLoading(true);
        
        const gradesToUpsert = data.grades.map(grade => ({
            ...grade,
            institute_id: instituteId
        }));
        
        try {
            const response = await fetch('/crud/grade_settings/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gradesToUpsert)
            });
            
            if (response.ok) {
                toast({ title: 'Success!', description: 'Grade settings have been saved.' });
                fetchGrades();
            } else {
                const errorData = await response.json();
                toast({ variant: 'destructive', title: 'Error saving grades', description: errorData.error || 'Failed to save grades' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving grades', description: error.message });
        }
        setLoading(false);
    };

    const handleRemoveGrade = async (index, gradeId) => {
        if (gradeId) {
            try {
                const response = await fetch(`/crud/grade_settings/${gradeId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    toast({ variant: "destructive", title: "Failed to delete grade", description: errorData.error || 'Failed to delete grade' });
                    return;
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to delete grade", description: error.message });
                return;
            }
        }
        remove(index);
        toast({ title: "Grade removed."});
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Grade Calculation Settings</CardTitle>
                <CardDescription>Define the percentage ranges for each grade. These will be used in report cards.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Grade Name</TableHead>
                                <TableHead>Min %</TableHead>
                                <TableHead>Max %</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan="5">Loading...</TableCell></TableRow> :
                             fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell><Input {...register(`grades.${index}.grade_name`, { required: true })} placeholder="e.g., A+" /></TableCell>
                                    <TableCell><Input type="number" {...register(`grades.${index}.min_percentage`, { required: true })} placeholder="e.g., 90" /></TableCell>
                                    <TableCell><Input type="number" {...register(`grades.${index}.max_percentage`, { required: true })} placeholder="e.g., 100" /></TableCell>
                                    <TableCell><Input {...register(`grades.${index}.description`)} placeholder="e.g., Outstanding" /></TableCell>
                                    <TableCell className="text-right">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveGrade(index, field.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-between mt-4">
                        <Button type="button" variant="outline" onClick={() => append({ grade_name: '', min_percentage: '', max_percentage: '', description: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
                        </Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Grade Settings"}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default GradeCalculation;