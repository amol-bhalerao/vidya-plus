import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const SubjectAssignment = ({ instituteId }) => {
    const { toast } = useToast();
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [unassignedSubjects, setUnassignedSubjects] = useState([]);
    const [subjectToAssign, setSubjectToAssign] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchInitialData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const classPromise = fetch(`/crud/classes?institute_id=${instituteId}&expand=courses`);
        const subjectPromise = fetch(`/crud/subjects?institute_id=${instituteId}`);
            
            const [classResponse, subjectResponse] = await Promise.all([classPromise, subjectPromise]);
            
            if (!classResponse.ok || !subjectResponse.ok) {
                throw new Error('Failed to fetch data');
            }
            
            const classData = await classResponse.json();
            const subjectData = await subjectResponse.json();
            
            setClasses(classData || []);
            setSubjects(subjectData || []);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            toast({ variant: "destructive", title: "Failed to load data" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const fetchAssignments = useCallback(async () => {
        if (!selectedClass) {
            setAssignedSubjects([]);
            setUnassignedSubjects(subjects);
            return;
        }
        try {
            const response = await fetch(`/crud/class_subjects?class_id=${selectedClass.id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const assignedIds = data.map(d => d.subject_id);
            const assigned = subjects.filter(s => assignedIds.includes(s.id));
            const unassigned = subjects.filter(s => !assignedIds.includes(s.id));

            setAssignedSubjects(assigned);
            setUnassignedSubjects(unassigned);
        } catch (error) {
            console.error("Error fetching assigned subjects:", error);
            toast({ variant: "destructive", title: "Error fetching assigned subjects." });
        }
    }, [selectedClass, subjects, toast]);
    
    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);


    const handleAssign = async () => {
        if (!subjectToAssign) return;
        try {
            const response = await fetch('/crud/class_subjects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ class_id: selectedClass.id, subject_id: subjectToAssign })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            fetchAssignments(); // Refresh assignments
            setSubjectToAssign('');
        } catch (error) {
            console.error("Error assigning subject:", error);
            toast({ variant: "destructive", title: "Failed to assign subject." });
        }
    };

    const handleUnassign = async (subjectId) => {
        try {
            const response = await fetch(`/crud/class_subjects?class_id=${selectedClass.id}&subject_id=${subjectId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            fetchAssignments(); // Refresh assignments
        } catch (error) {
            console.error("Error unassigning subject:", error);
            toast({ variant: "destructive", title: "Failed to unassign subject." });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="md:col-span-1">
                <h4 className="font-semibold mb-2">Select a Class</h4>
                <ScrollArea className="h-96">
                    <ul className="space-y-1 pr-2">
                        {classes.map(c => (
                            <li key={c.id}>
                                <Button
                                    variant={selectedClass?.id === c.id ? 'secondary' : 'ghost'}
                                    className="w-full justify-start text-left h-auto py-2"
                                    onClick={() => setSelectedClass(c)}
                                >
                                    <span className="font-semibold">{c.class_name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">({c.courses.course_name})</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </div>
            <div className="md:col-span-2">
                {selectedClass ? (
                    <div>
                        <h4 className="font-semibold mb-2">Manage Subjects for {selectedClass.courses.course_name} - {selectedClass.class_name}</h4>
                        <div className="flex gap-2 mb-4">
                            <Select value={subjectToAssign} onValueChange={setSubjectToAssign}>
                                <SelectTrigger><SelectValue placeholder="Select subject to add" /></SelectTrigger>
                                <SelectContent>
                                    {unassignedSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAssign}>Assign</Button>
                        </div>
                        <h5 className="font-medium mb-2">Assigned Subjects:</h5>
                        <ScrollArea className="h-64 border rounded-md p-2">
                            {assignedSubjects.length > 0 ? (
                                assignedSubjects.map(s => (
                                    <div key={s.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                                        <span>{s.subject_name}</span>
                                        <Button size="sm" variant="destructive" onClick={() => handleUnassign(s.id)}>Remove</Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 p-4">No subjects assigned yet.</p>
                            )}
                        </ScrollArea>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full border rounded-md bg-gray-50">
                        <p className="text-gray-500">Please select a class to manage subjects.</p>
                    </div>
                )}
            </div>
        </div>
    )
};

export default SubjectAssignment;