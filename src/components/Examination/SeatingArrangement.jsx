import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Edit, Users } from 'lucide-react';

const SeatingArrangement = ({ instituteId }) => {
  const { toast } = useToast();
  const [arrangements, setArrangements] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArrangement, setEditingArrangement] = useState(null);
  const [formData, setFormData] = useState({
    exam_id: '',
    class_id: '',
    room_name: '',
    rows: 5,
    cols: 6
  });
  const [seatLayout, setSeatLayout] = useState([]);

  const fetchArrangements = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/crud/seating_arrangement?institute_id=${encodeURIComponent(instituteId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching arrangements');
      }

      const data = await response.json();
      setArrangements(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching arrangements', description: error.message });
    }
  }, [instituteId, toast]);

  const fetchExams = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/crud/exams?institute_id=${encodeURIComponent(instituteId)}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching exams');
      }

      const data = await response.json();
      setExams(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching exams', description: error.message });
    }
  }, [instituteId, toast]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/crud/classes?institute_id=${encodeURIComponent(instituteId)}`, {
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
  }, [instituteId, toast]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchArrangements(), fetchExams(), fetchClasses()]).finally(() => setLoading(false));
  }, [fetchArrangements, fetchExams, fetchClasses]);

  useEffect(() => {
    const fetchStudentsForClass = async () => {
      if (!formData.class_id) { setStudents([]); return; }
      try {
        const response = await fetch(`${API_BASE}/crud/students?class_id=${encodeURIComponent(formData.class_id)}&status=active`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching students');
        }

        const data = await response.json();
        setStudents(data);
        // Generate initial seat layout
        generateSeatLayout(data.length, formData.rows, formData.cols);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching students', description: error.message });
      }
    }
    fetchStudentsForClass();
  }, [formData.class_id, formData.rows, formData.cols, toast]);

  const generateSeatLayout = (studentCount, rows, cols) => {
    const layout = [];
    let studentIndex = 0;
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (studentIndex < studentCount) {
          row.push({
            student_id: students[studentIndex]?.id || null,
            student_name: students[studentIndex]?.full_name || '',
            occupied: true
          });
          studentIndex++;
        } else {
          row.push({ student_id: null, student_name: '', occupied: false });
        }
      }
      layout.push(row);
    }
    setSeatLayout(layout);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingArrangement ? 'PUT' : 'POST';
      const url = editingArrangement
        ? `${API_BASE}/crud/seating_arrangement/${editingArrangement.id}`
        : `${API_BASE}/crud/seating_arrangement`;

      const payload = {
        ...formData,
        institute_id: instituteId,
        seat_layout: JSON.stringify(seatLayout)
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving arrangement');
      }

      toast({ title: 'Success', description: `Seating arrangement ${editingArrangement ? 'updated' : 'created'} successfully` });
      setIsDialogOpen(false);
      setEditingArrangement(null);
      setFormData({
        exam_id: '',
        class_id: '',
        room_name: '',
        rows: 5,
        cols: 6
      });
      setSeatLayout([]);
      fetchArrangements();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (arrangement) => {
    setEditingArrangement(arrangement);
    setFormData({
      exam_id: arrangement.exam_id.toString(),
      class_id: arrangement.class_id.toString(),
      room_name: arrangement.room_name,
      rows: 5, // Default, could parse from layout
      cols: 6
    });
    setSeatLayout(arrangement.seat_layout ? JSON.parse(arrangement.seat_layout) : []);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this seating arrangement?')) return;
    try {
      const response = await fetch(`${API_BASE}/crud/seating_arrangement/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting arrangement');
      }

      toast({ title: 'Success', description: 'Seating arrangement deleted successfully' });
      fetchArrangements();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const getExamName = (examId) => {
    const exam = exams.find(e => e.id == examId);
    return exam ? exam.exam_name : 'Unknown Exam';
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id == classId);
    return cls ? `${cls.class_name} ${cls.section || ''}` : 'Unknown Class';
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Seating Arrangement</CardTitle>
            <CardDescription>Generate and manage seating plans for exams.</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Arrangement
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
                <TableHead>Exam</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrangements.map((arrangement) => (
                <TableRow key={arrangement.id}>
                  <TableCell>{getExamName(arrangement.exam_id)}</TableCell>
                  <TableCell>{getClassName(arrangement.class_id)}</TableCell>
                  <TableCell>{arrangement.room_name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(arrangement)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(arrangement.id)}>
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
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingArrangement ? 'Edit Seating Arrangement' : 'Create New Seating Arrangement'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exam_id">Exam</Label>
                  <Select value={formData.exam_id} onValueChange={(value) => setFormData({ ...formData, exam_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id.toString()}>
                          {exam.exam_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="class_id">Class</Label>
                  <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="room_name">Room Name</Label>
                  <Input
                    id="room_name"
                    value={formData.room_name}
                    onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    value={formData.rows}
                    onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) })}
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <Label htmlFor="cols">Columns</Label>
                  <Input
                    id="cols"
                    type="number"
                    value={formData.cols}
                    onChange={(e) => setFormData({ ...formData, cols: parseInt(e.target.value) })}
                    min="1"
                    max="20"
                  />
                </div>
              </div>
              
              {seatLayout.length > 0 && (
                <div>
                  <Label>Seat Layout Preview</Label>
                  <div className="mt-2 border rounded p-4 bg-gray-50">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${formData.cols}, 1fr)` }}>
                      {seatLayout.flat().map((seat, index) => (
                        <div
                          key={index}
                          className={`p-2 text-xs text-center border rounded ${
                            seat.occupied ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300'
                          }`}
                        >
                          {seat.occupied ? seat.student_name.split(' ')[0] : 'Empty'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingArrangement ? 'Update' : 'Create'} Arrangement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SeatingArrangement;