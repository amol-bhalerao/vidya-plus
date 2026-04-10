import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
// import { useAuth } from '@/contexts/SupabaseAuthContext';
import { API_BASE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';

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
  status: z.enum(['active', 'inactive']),
});

const EditStudent = ({ instituteId }) => {
  const { id: studentId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(studentSchema)
  });

  const selectedCourseId = watch('course_id');

  useEffect(() => {
    const fetchStudentData = async () => {
      setPageLoading(true);
      try {
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching student data');
        }

        const data = await response.json();
        const studentData = {
          ...data,
          date_of_birth: data.date_of_birth ? parseISO(data.date_of_birth) : null,
          admission_date: data.admission_date ? parseISO(data.admission_date) : null,
          previous_school_details: data.previous_school_details || { name: '', leaving_certificate_no: '', leaving_date: '' },
        };
        reset(studentData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching student data.', description: error.message });
        navigate('/dashboard/students');
      } finally {
        setPageLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId, reset, toast, navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!instituteId) return;
      try {
        const response = await fetch(`${API_BASE}/courses?institute_id=${instituteId}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching courses');
        }

        const data = await response.json();
        setCourses(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching courses', description: error.message });
      }
    };
    fetchCourses();
  }, [instituteId, toast]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedCourseId) {
        setClasses([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/classes?course_id=${selectedCourseId}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching classes');
        }

        const data = await response.json();
        setClasses(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching classes', description: error.message });
      }
    };
    fetchClasses();
  }, [selectedCourseId, toast]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { created_at, ...submissionData } = formData;

      const response = await fetch(`${API_BASE}/students/${studentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating student');
      }

      toast({ title: 'Success', description: 'Student updated successfully.' });
      navigate('/dashboard/students');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating student', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div>Loading student data...</div>
  }

  return (
    <>
      <Helmet>
        <title>Edit Student - Vidya+</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>Edit Student Details</CardTitle>
          <CardDescription>Update the information for the selected student.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="admission_no">Admission No *</Label>
                <Input id="admission_no" {...register('admission_no')} />
                {errors.admission_no && <p className="text-red-500 text-sm mt-1">{errors.admission_no.message}</p>}
              </div>
              <div>
                <Label htmlFor="gr_no">GR No</Label>
                <Input id="gr_no" {...register('gr_no')} />
              </div>
              <div>
                <Label htmlFor="admission_date">Admission Date *</Label>
                <Controller
                  name="admission_date"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.admission_date && <p className="text-red-500 text-sm mt-1">{errors.admission_date.message}</p>}
              </div>
            </div>

            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" {...register('full_name')} />
                  {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="mother_name">Mother's Name *</Label>
                  <Input id="mother_name" {...register('mother_name')} />
                  {errors.mother_name && <p className="text-red-500 text-sm mt-1">{errors.mother_name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Controller
                    name="date_of_birth"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>}
                </div>
                <div>
                  <Label htmlFor="birth_place">Place of Birth *</Label>
                  <Input id="birth_place" {...register('birth_place')} />
                  {errors.birth_place && <p className="text-red-500 text-sm mt-1">{errors.birth_place.message}</p>}
                </div>
                <div>
                  <Label htmlFor="aadhaar_no">Aadhaar No</Label>
                  <Input id="aadhaar_no" {...register('aadhaar_no')} />
                  {errors.aadhaar_no && <p className="text-red-500 text-sm mt-1">{errors.aadhaar_no.message}</p>}
                </div>
              </div>
            </div>

            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-medium">Academic & Social Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="abc_number">ABC Number</Label>
                  <Input id="abc_number" {...register('abc_number')} />
                  {errors.abc_number && <p className="text-red-500 text-sm mt-1">{errors.abc_number.message}</p>}
                </div>
                <div>
                  <Label htmlFor="course_id">Course *</Label>
                  <Controller
                    name="course_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                        <SelectContent>{courses.map(course => <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                  {errors.course_id && <p className="text-red-500 text-sm mt-1">{errors.course_id.message}</p>}
                </div>
                <div>
                  <Label htmlFor="class_id">Class *</Label>
                  <Controller
                    name="class_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourseId || classes.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name} {c.section && `- ${c.section}`}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                  {errors.class_id && <p className="text-red-500 text-sm mt-1">{errors.class_id.message}</p>}
                </div>
                <div>
                  <Label htmlFor="religion">Religion</Label>
                  <Input id="religion" {...register('religion')} />
                </div>
                <div>
                  <Label htmlFor="caste">Caste</Label>
                  <Input id="caste" {...register('caste')} />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" {...register('category')} />
                </div>
                <div>
                  <Label htmlFor="mother_tongue">Mother Tongue</Label>
                  <Input id="mother_tongue" {...register('mother_tongue')} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Controller name="status" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
            </div>

            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-medium">Previous School Details (if applicable)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="previous_school_name">Previous School Name</Label>
                  <Input id="previous_school_name" {...register('previous_school_details.name')} />
                </div>
                <div>
                  <Label htmlFor="previous_school_lc_no">Leaving Certificate No</Label>
                  <Input id="previous_school_lc_no" {...register('previous_school_details.leaving_certificate_no')} />
                </div>
                <div>
                  <Label htmlFor="previous_school_leaving_date">Leaving Date</Label>
                  <Input type="date" id="previous_school_leaving_date" {...register('previous_school_details.leaving_date')} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default EditStudent;