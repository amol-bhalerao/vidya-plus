import React from 'react';
import GenericMasterData from '../GenericMasterData';
import SubjectAssignment from './SubjectAssignment';

const SubjectsData = ({ instituteId }) => {
  const subjectColumns = [
    { accessorKey: 'subject_name', header: 'Subject Name' },
    { accessorKey: 'subject_code', header: 'Subject Code' },
  ];

  const subjectFields = [
    { name: 'subject_name', label: 'Subject Name', type: 'text', required: true },
    { name: 'subject_code', label: 'Subject Code', type: 'text' },
  ];

  return (
    <>
      <GenericMasterData
        tableName="subjects"
        title="Subjects"
        description="Manage subjects and their codes."
        columns={subjectColumns}
        formFields={subjectFields}
        instituteId={instituteId}
        orderBy="subject_name"
      />
      <SubjectAssignment instituteId={instituteId} />
    </>
  );
};

export default SubjectsData;