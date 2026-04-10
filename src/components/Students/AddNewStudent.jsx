import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { API_BASE } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar as CalendarIcon, Printer, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AdmissionFormPrint from './AdmissionFormPrint';

const studentSchema = z.object({
  gr_no: z.string().optional(),
  admission_no: z.string().min(1, 'Admission number is required.'),
  abc_number: z.string().optional(),
  full_name: z.string().min(3, 'Full name is required.'),
  mother_name: z.string().min(3, 'Mother\'s name is required.'),
  date_of_birth: z.date({ required_error: 'Date of birth is required.' }),
  birth_place: z.string().min(2, "Place of birth is required"),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required.' }),
  aadhaar_no: z.string().length(12, 'Aadhaar must be 12 digits.').optional().or(z.literal('')),
  caste: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  mother_tongue: z.string().optional(),
  previous_school_details: z.object({
    name: z.string().optional(),
    leaving_certificate_no: z.string().optional(),
    leaving_date: z.string().optional(),
  }).optional(),
  admission_date: z.date({ required_error: 'Admission date is required.' }),
  course_id: z.string().uuid('Please select a course.'),
  class_id: z.string().uuid('Please select a class.'),
});

const AddNewStudent = ({ instituteId, inquiryData, onSuccess }) => {
  const { toast } = useToast();

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedStudent, setCompletedStudent] = useState(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: inquiryData?.full_name || '',
      course_id: inquiryData?.course_id || '',
      class_id: inquiryData?.class_id || '',
      admission_date: new Date(),
      previous_school_details: { name: '', leaving_certificate_no: '', leaving_date: '' },
    }
  });

  const selectedCourseId = watch('course_id');

  useEffect(() => {
    const fetchData = async () => {
      if (!instituteId) return;
      try {
        const response = await fetch(`${API_BASE}/courses?institute_id=${instituteId}&order_by=course_name&order_direction=asc`);
        if (!response.ok) {
          throw new Error('Error fetching courses');
        }
        const coursesData = await response.json();
        setCourses(coursesData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching courses', description: error.message });
      }
    };
    fetchData();
  }, [instituteId, toast]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedCourseId) { setClasses([]); setValue('class_id', ''); return; }
      try {
        const response = await fetch(`${API_BASE}/classes?course_id=${selectedCourseId}&order_by=class_name&order_direction=asc`);
        if (!response.ok) {
          throw new Error('Error fetching classes');
        }
        const data = await response.json();
        setClasses(data);
        if (inquiryData?.class_id && data.some(c => c.id === inquiryData.class_id)) {
          setValue('class_id', inquiryData.class_id);
        } else {
          setValue('class_id', '');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching classes', description: error.message });
      }
    };
    fetchClasses();
  }, [selectedCourseId, toast, inquiryData, setValue]);

  const onSubmit = async (formData) => {
    setLoading(true);
    const submissionData = { ...formData, institute_id: instituteId, status: 'active' };

    try {
      // Add new student
      const studentResponse = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (!studentResponse.ok) {
        const errorData = await studentResponse.json();
        throw new Error(errorData.error || 'Error adding student');
      }

      const newStudent = await studentResponse.json();

      toast({ title: 'Success', description: 'Student added successfully. Default fees are being assigned.' });

      // Update admission inquiry status if applicable
      if (inquiryData) {
        await fetch(`${API_BASE}/admission-inquiries`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: inquiryData.id, status: 'admitted' })
        });
      }

      // Fetch student details
      const detailsResponse = await fetch(`${API_BASE}/student-details?id=${newStudent.id}`);
      if (!detailsResponse.ok) {
        throw new Error('Error fetching student details');
      }

      const studentWithDetails = await detailsResponse.json();
      setCompletedStudent(studentWithDetails);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error adding student', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (completedStudent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registration Successful!</CardTitle>
          <CardDescription>Student {completedStudent.student.full_name} has been registered.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p>You can now print the admission form.</p>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild><Button><FileText className="mr-2 h-4 w-4" /> Print Admission Form</Button></DialogTrigger>
              <DialogContent className="sm:max-w-4xl"><AdmissionFormPrint studentData={completedStudent} /></DialogContent>
            </Dialog>
          </div>
          <Button variant="secondary" onClick={onSuccess}>Close</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><Label htmlFor="admission_no">Admission No *</Label><Input id="admission_no" {...register('admission_no')} />{errors.admission_no && <p className="text-red-500 text-sm mt-1">{errors.admission_no.message}</p>}</div>
          <div><Label htmlFor="gr_no">GR No</Label><Input id="gr_no" {...register('gr_no')} /></div>
          <div><Label htmlFor="admission_date">Admission Date *</Label><Controller name="admission_date" control={control} render={({ field }) => (<Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>)} />{errors.admission_date && <p className="text-red-500 text-sm mt-1">{errors.admission_date.message}</p>}</div>
        </div>
        <div className="border-t pt-6 space-y-6"><h3 className="text-lg font-medium">Personal Information</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div><Label htmlFor="full_name">Full Name *</Label><Input id="full_name" {...register('full_name')} />{errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}</div><div><Label htmlFor="mother_name">Mother's Name *</Label><Input id="mother_name" {...register('mother_name')} />{errors.mother_name && <p className="text-red-500 text-sm mt-1">{errors.mother_name.message}</p>}</div><div><Label htmlFor="gender">Gender *</Label><Controller name="gender" control={control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>)} />{errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}</div><div><Label htmlFor="date_of_birth">Date of Birth *</Label><Controller name="date_of_birth" control={control} render={({ field }) => (<Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>)} />{errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>}</div><div><Label htmlFor="birth_place">Place of Birth *</Label><Input id="birth_place" {...register('birth_place')} />{errors.birth_place && <p className="text-red-500 text-sm mt-1">{errors.birth_place.message}</p>}</div><div><Label htmlFor="aadhaar_no">Aadhaar No</Label><Input id="aadhaar_no" {...register('aadhaar_no')} />{errors.aadhaar_no && <p className="text-red-500 text-sm mt-1">{errors.aadhaar_no.message}</p>}</div></div></div>
        <div className="border-t pt-6 space-y-6"><h3 className="text-lg font-medium">Academic & Social Details</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div><Label htmlFor="abc_number">ABC Number</Label><Input id="abc_number" {...register('abc_number')} />{errors.abc_number && <p className="text-red-500 text-sm mt-1">{errors.abc_number.message}</p>}</div><div><Label htmlFor="course_id">Course *</Label><Controller name="course_id" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger><SelectContent>{courses.map(course => <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>)}</SelectContent></Select>)} />{errors.course_id && <p className="text-red-500 text-sm mt-1">{errors.course_id.message}</p>}</div><div><Label htmlFor="class_id">Class *</Label><Controller name="class_id" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourseId || classes.length === 0}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name} {c.section && `- ${c.section}`}</SelectItem>)}</SelectContent></Select>)} />{errors.class_id && <p className="text-red-500 text-sm mt-1">{errors.class_id.message}</p>}</div><div><Label htmlFor="religion">Religion</Label><Input id="religion" {...register('religion')} /></div><div><Label htmlFor="caste">Caste</Label><Input id="caste" {...register('caste')} /></div><div><Label htmlFor="category">Category</Label><Input id="category" {...register('category')} /></div><div><Label htmlFor="mother_tongue">Mother Tongue</Label><Input id="mother_tongue" {...register('mother_tongue')} /></div></div></div>
        <div className="border-t pt-6 space-y-6"><h3 className="text-lg font-medium">Previous School Details (if applicable)</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div><Label htmlFor="previous_school_name">Previous School Name</Label><Input id="previous_school_name" {...register('previous_school_details.name')} /></div><div><Label htmlFor="previous_school_lc_no">Leaving Certificate No</Label><Input id="previous_school_lc_no" {...register('previous_school_details.leaving_certificate_no')} /></div><div><Label htmlFor="previous_school_leaving_date">Leaving Date</Label><Input type="date" id="previous_school_leaving_date" {...register('previous_school_details.leaving_date')} /></div></div></div>
        <div className="flex justify-end pt-4"><Button type="submit" disabled={loading || !instituteId}>{loading ? 'Submitting...' : 'Register Student'}</Button></div>
      </form>
    </>
  );
};

export default AddNewStudent;