import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdmissionForm = ({ instituteId, onSuccess, defaultValues = {} }) => {
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      full_name: defaultValues.full_name || '',
      contact_phone: defaultValues.contact_phone || '',
      contact_email: defaultValues.contact_email || '',
      course_id: defaultValues.course_id || '',
      class_id: defaultValues.class_id || '',
      status: defaultValues.status || 'inquiry',
      notes: defaultValues.notes || '',
      inquiry_date: defaultValues.inquiry_date || new Date().toISOString().split('T')[0],
    },
  });
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [dataLoading, setDataLoading] = useState({ courses: true, classes: true });
  const { toast } = useToast();

  const selectedCourseId = watch("course_id");

  useEffect(() => {
    const fetchCourses = async () => {
      if (!instituteId) return;
      setDataLoading(prev => ({ ...prev, courses: true }));
      try {
        const response = await fetch(`/crud/courses?institute_id=${instituteId}&order=course_name`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast({ variant: "destructive", title: "Could not fetch courses", description: error.message });
      } finally {
        setDataLoading(prev => ({ ...prev, courses: false }));
      }
    };

    fetchCourses();
  }, [instituteId, toast]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedCourseId) {
        setClasses([]);
        setValue('class_id', '');
        return;
      }
      setDataLoading(prev => ({ ...prev, classes: true }));
      try {
        const response = await fetch(`/crud/classes?course_id=${selectedCourseId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast({ variant: "destructive", title: "Could not fetch classes for the selected course" });
      } finally {
        setDataLoading(prev => ({ ...prev, classes: false }));
      }
    };

    fetchClasses();
  }, [selectedCourseId, toast, setValue]);

  const onSubmit = async (formData) => {
    setLoading(true);

    const dataToSubmit = { ...formData, institute_id: instituteId };

    try {
      const response = await fetch('/crud/admission_inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      toast({
        title: 'Success!',
        description: 'New admission inquiry has been saved.',
      });
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving inquiry',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input id="full_name" {...register('full_name', { required: 'Full name is required' })} />
        {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input id="contact_phone" {...register('contact_phone')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input id="contact_email" type="email" {...register('contact_email')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="course_id">Course</Label>
        <Controller
            name="course_id"
            control={control}
            rules={{ required: 'Please select a course' }}
            render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={dataLoading.courses}>
                <SelectTrigger>
                    <SelectValue placeholder={dataLoading.courses ? "Loading courses..." : "Select a course"} />
                </SelectTrigger>
                <SelectContent>
                    {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                            {c.course_name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            )}
        />
        {errors.course_id && <p className="text-sm text-red-500">{errors.course_id.message}</p>}
      </div>
       <div className="space-y-2">
        <Label htmlFor="class_id">Class</Label>
        <Controller
            name="class_id"
            control={control}
            rules={{ required: 'Please select a class' }}
            render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourseId || dataLoading.classes}>
                <SelectTrigger>
                    <SelectValue placeholder={!selectedCourseId ? "Select a course first" : (dataLoading.classes ? "Loading classes..." : "Select a class")} />
                </SelectTrigger>
                <SelectContent>
                    {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                            {c.class_name} {c.section && `(${c.section})`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            )}
        />
        {errors.class_id && <p className="text-sm text-red-500">{errors.class_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Controller
            name="status"
            control={control}
            render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
            )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Inquiry'}
      </Button>
    </form>
  );
};

export default AdmissionForm;