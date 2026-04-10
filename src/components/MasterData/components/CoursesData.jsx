import React from 'react';
import GenericMasterData from '../GenericMasterData';

const CoursesData = ({ instituteId }) => {
  const courseColumns = [
    { accessorKey: 'course_name', header: 'Course Name' },
    { accessorKey: 'course_code', header: 'Course Code' },
  ];
  
  const courseFields = [
    { name: 'course_name', label: 'Course Name', type: 'text', required: true },
    { name: 'course_code', label: 'Course Code', type: 'text' },
  ];

  return (
    <GenericMasterData
      tableName="courses"
      title="Courses"
      description="Manage courses/streams offered by your institute."
      columns={courseColumns}
      formFields={courseFields}
      instituteId={instituteId}
      orderBy="course_name"
    />
  );
};

export default CoursesData;