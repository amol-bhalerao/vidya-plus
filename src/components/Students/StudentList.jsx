import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash, School, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import AdmissionFormPrint from './AdmissionFormPrint';
import { API_BASE } from '@/lib/constants';

const PromoteStudentDialog = ({ student, onPromoted, onCancel }) => {
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await fetch(`${API_BASE}/courses?institute_id=${student.institute_id}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch courses');
                const data = await response.json();
                if (data) setCourses(data);
            } catch (error) {
                console.error('Error fetching courses:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch courses' });
            }
        }
        fetchCourses();
    }, [student.institute_id, toast]);

    React.useEffect(() => {
        const fetchClasses = async () => {
            if (!selectedCourse) { setClasses([]); return; }
            try {
                const response = await fetch(`${API_BASE}/classes?course_id=${selectedCourse}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch classes');
                const data = await response.json();
                if (data) setClasses(data);
            } catch (error) {
                console.error('Error fetching classes:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch classes' });
            }
        }
        fetchClasses();
    }, [selectedCourse, toast]);

    const handlePromote = async () => {
        if (!selectedClass || !selectedCourse) {
            toast({ variant: "destructive", title: "Please select a new course and class."});
            return;
        }
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/promote_student`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: student.id,
                    new_class_id: selectedClass,
                    new_course_id: selectedCourse
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to promote student');
            }

            toast({ title: "Success", description: "Student promoted and new fees assigned." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error promoting student", description: error.message });
        } finally {
            onPromoted(student.id);
            setLoading(false);
        }
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Promote {student.full_name}</DialogTitle>
                <DialogDescription>Select the new class to promote the student to.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Select onValueChange={setSelectedCourse} value={selectedCourse}>
                    <SelectTrigger><SelectValue placeholder="Select New Course..." /></SelectTrigger>
                    <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent>
                </Select>
                 <Select onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedCourse}>
                    <SelectTrigger><SelectValue placeholder="Select New Class..." /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handlePromote} disabled={loading || !selectedClass}>
                    {loading ? "Promoting..." : "Promote Student"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

const StudentList = ({ students, loading, onRefresh, page, count, pageSize, onPageChange }) => {
  const navigate = useNavigate();
  const [promotingStudent, setPromotingStudent] = useState(null);
  const [completedActionStudent, setCompletedActionStudent] = useState(null);

  const handleDeactivate = async (student) => {
    try {
      const response = await fetch(`${API_BASE}/students/${student.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'inactive' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deactivate student');
      }
      
      toast({ title: "Success", description: "Student deactivated." });
      onRefresh();
    } catch (error) {
      console.error('Error deactivating student:', error);
      toast({ variant: "destructive", title: "Error", description: 'Failed to deactivate student' });
    }
  };
  
  const onPromoteSuccess = async (studentId) => {
    try {
      const response = await fetch(`${API_BASE}/student_admission_details?student_id=${studentId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }
      
      const studentWithDetails = await response.json();
      setCompletedActionStudent(studentWithDetails);
      setPromotingStudent(null);
      onRefresh();
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast({ variant: "destructive", title: "Error", description: 'Failed to fetch student details' });
      setPromotingStudent(null);
      onRefresh();
    }
  }

  const getStatusVariant = (status) => {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'inactive': return 'bg-red-100 text-red-800';
        case 'tc_issued': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="bg-white/80 p-6 rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>GR No.</TableHead><TableHead>Full Name</TableHead><TableHead>Course</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan="6" className="text-center">Loading...</TableCell></TableRow>}
          {!loading && students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.gr_no}</TableCell>
              <TableCell className="font-medium">{student.full_name}</TableCell>
              <TableCell>{student.courses?.course_name || 'N/A'}</TableCell>
              <TableCell>{student.classes?.class_name || 'N/A'}</TableCell>
              <TableCell><span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusVariant(student.status)}`}>{student.status.replace('_', ' ')}</span></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => setPromotingStudent(student)} title="Promote" disabled={student.status !== 'active'}><School className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/students/edit/${student.id}`)} title="Edit"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeactivate(student)} title="Deactivate"><Trash className="h-4 w-4 text-red-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && students.length === 0 && <TableRow><TableCell colSpan="6" className="text-center">No students found.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="flex justify-end items-center space-x-2 py-4">
        <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(count / pageSize)}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Previous</Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page * pageSize >= count}>Next</Button>
      </div>
      
      <Dialog open={!!promotingStudent} onOpenChange={() => setPromotingStudent(null)}>{promotingStudent && <PromoteStudentDialog student={promotingStudent} onPromoted={onPromoteSuccess} onCancel={() => setPromotingStudent(null)} />}</Dialog>
      
      <Dialog open={!!completedActionStudent} onOpenChange={() => setCompletedActionStudent(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Action Successful</DialogTitle>
                <DialogDescription>Student {completedActionStudent?.student.full_name} has been promoted.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
                <Dialog>
                    <DialogTrigger asChild><Button><FileText className="mr-2 h-4 w-4"/> Print Admission Form</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Admission Form</DialogTitle>
                            <DialogDescription>Printable admission form for the student.</DialogDescription>
                        </DialogHeader>
                        <AdmissionFormPrint studentData={completedActionStudent} />
                    </DialogContent>
                </Dialog>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentList;