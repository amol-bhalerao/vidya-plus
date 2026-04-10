import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import GenericMasterData from '../GenericMasterData';

const ClassesData = ({ instituteId }) => {
  const { toast } = useToast();
  const [courseOptions, setCourseOptions] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!instituteId) return;
      try {
        const response = await fetch(`/crud/courses?institute_id=${instituteId}&select=id,course_name`);
        const data = await response.json();
        if (response.ok) {
          setCourseOptions(data.map(c => ({ value: c.id, label: c.course_name })));
        } else {
          toast({ variant: 'destructive', title: "Error fetching courses" });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: "Error fetching courses", description: error.message });
      }
    };
    fetchCourses();
  }, [instituteId, toast]);

  const classColumns = [
    { accessorKey: 'courses.course_name', header: 'Course' },
    { accessorKey: 'class_name', header: 'Class Name' },
    { accessorKey: 'section', header: 'Section' },
  ];

  const classFields = [
    { name: 'course_id', label: 'Course', type: 'select', options: courseOptions, required: true },
    { name: 'class_name', label: 'Class Name', type: 'text', required: true },
    { name: 'section', label: 'Section (e.g., A, B)', type: 'text' },
  ];

  return (
    <GenericMasterData
      tableName="classes"
      title="Classes"
      description="Manage classes and sections for each course."
      columns={classColumns}
      formFields={classFields}
      instituteId={instituteId}
      selectJoins="courses(course_name)"
      orderBy="class_name"
    />
  );
};

export default ClassesData;