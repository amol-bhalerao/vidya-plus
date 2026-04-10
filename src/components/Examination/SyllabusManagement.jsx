import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Edit, FileText } from 'lucide-react';

const SyllabusManagement = ({ instituteId }) => {
  const { toast } = useToast();
  const [syllabi, setSyllabi] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState(null);
  const [formData, setFormData] = useState({
    course_id: '',
    class_id: '',
    subject_id: '',
    syllabus_title: '',
    syllabus_content: '',
    syllabus_file_url: '',
    academic_year: ''
  });

  const fetchSyllabi = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/crud/syllabus?institute_id=${encodeURIComponent(instituteId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching syllabi');
      }

      const data = await response.json();
      setSyllabi(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching syllabi', description: error.message });
    }
  }, [instituteId, toast]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/crud/courses?institute_id=${encodeURIComponent(instituteId)}`, {
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
  }, [instituteId, toast]);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/crud/subjects?institute_id=${encodeURIComponent(instituteId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching subjects');
      }

      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching subjects', description: error.message });
    }
  }, [instituteId, toast]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSyllabi(), fetchCourses(), fetchSubjects()]).finally(() => setLoading(false));
  }, [fetchSyllabi, fetchCourses, fetchSubjects]);

  useEffect(() => {
    const fetchClassesForCourse = async () => {
      if (!formData.course_id) { setClasses([]); return; }
      try {
        const response = await fetch(`${API_BASE}/crud/classes?course_id=${encodeURIComponent(formData.course_id)}`, {
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
    }
    fetchClassesForCourse();
  }, [formData.course_id, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingSyllabus ? 'PUT' : 'POST';
      const url = editingSyllabus
        ? `${API_BASE}/crud/syllabus/${editingSyllabus.id}`
        : `${API_BASE}/crud/syllabus`;

      const payload = {
        ...formData,
        institute_id: instituteId
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving syllabus');
      }

      toast({ title: 'Success', description: `Syllabus ${editingSyllabus ? 'updated' : 'created'} successfully` });
      setIsDialogOpen(false);
      setEditingSyllabus(null);
      setFormData({
        course_id: '',
        class_id: '',
        subject_id: '',
        syllabus_title: '',
        syllabus_content: '',
        syllabus_file_url: '',
        academic_year: ''
      });
      fetchSyllabi();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (syllabus) => {
    // Find the class to get course_id
    const cls = classes.find(c => c.id == syllabus.class_id);
    const courseId = cls ? cls.course_id : '';
    
    setEditingSyllabus(syllabus);
    setFormData({
      course_id: courseId.toString(),
      class_id: syllabus.class_id.toString(),
      subject_id: syllabus.subject_id.toString(),
      syllabus_title: syllabus.syllabus_title,
      syllabus_content: syllabus.syllabus_content || '',
      syllabus_file_url: syllabus.syllabus_file_url || '',
      academic_year: syllabus.academic_year || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;
    try {
      const response = await fetch(`${API_BASE}/crud/syllabus/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting syllabus');
      }

      toast({ title: 'Success', description: 'Syllabus deleted successfully' });
      fetchSyllabi();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id == classId);
    return cls ? `${cls.class_name} ${cls.section || ''}` : 'Unknown Class';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id == subjectId);
    return subject ? subject.subject_name : 'Unknown Subject';
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Syllabus Management</CardTitle>
            <CardDescription>Manage syllabus for different classes and subjects.</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Syllabus
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syllabi.map((syllabus) => (
                <TableRow key={syllabus.id}>
                  <TableCell>{syllabus.syllabus_title}</TableCell>
                  <TableCell>{getClassName(syllabus.class_id)}</TableCell>
                  <TableCell>{getSubjectName(syllabus.subject_id)}</TableCell>
                  <TableCell>{syllabus.academic_year || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(syllabus)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(syllabus.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSyllabus ? 'Edit Syllabus' : 'Add New Syllabus'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course_id">Course</Label>
                  <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value, class_id: '', subject_id: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="class_id">Class</Label>
                  <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value, subject_id: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.class_name} {cls.section || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="subject_id">Subject</Label>
                <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="syllabus_title">Syllabus Title</Label>
                <Input
                  id="syllabus_title"
                  value={formData.syllabus_title}
                  onChange={(e) => setFormData({ ...formData, syllabus_title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="academic_year">Academic Year</Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  placeholder="e.g., 2024-2025"
                />
              </div>
              <div>
                <Label htmlFor="syllabus_content">Syllabus Content</Label>
                <Textarea
                  id="syllabus_content"
                  value={formData.syllabus_content}
                  onChange={(e) => setFormData({ ...formData, syllabus_content: e.target.value })}
                  rows={4}
                  placeholder="Enter syllabus details..."
                />
              </div>
              <div>
                <Label htmlFor="syllabus_file_url">File URL (Optional)</Label>
                <Input
                  id="syllabus_file_url"
                  value={formData.syllabus_file_url}
                  onChange={(e) => setFormData({ ...formData, syllabus_file_url: e.target.value })}
                  placeholder="URL to syllabus document"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSyllabus ? 'Update' : 'Create'} Syllabus
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SyllabusManagement;