import React from 'react';
import { format } from 'date-fns';
import { toWordsOrdinal, toWords } from 'number-to-words';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const formatDateInWords = (date) => {
  if (!date || isNaN(new Date(date))) return 'N/A';
  const d = new Date(date);
  const day = toWordsOrdinal(d.getDate());
  const month = format(d, 'MMMM');
  const year = toWords(d.getFullYear());
  return `${capitalize(day)} ${month} ${capitalize(year)}`;
};


const TransferCertificate = ({ student, sequenceNumber, progress, conduct, reasonForLeaving, remarks }) => {
  const today = new Date();
  const dateOfBirth = new Date(student.date_of_birth);
  const admissionDate = new Date(student.admission_date);
  
  const studentData = {
    fullName: student.full_name || 'N/A',
    caste: student.caste || 'N/A',
    nationality: 'Indian',
    placeOfBirth: student.birth_place || 'N/A',
    dobInFigures: format(dateOfBirth, 'dd/MM/yyyy'),
    dobInWords: formatDateInWords(dateOfBirth),
    lastInstitute: student.previous_school_details?.name || 'N/A',
    admissionDate: format(admissionDate, 'dd/MM/yyyy'),
    progress: progress || 'Good',
    conduct: conduct || 'Good',
    dateOfLeaving: format(today, 'dd/MM/yyyy'),
    studyingIn: `${student.classes?.courses?.course_name || ''} ${student.classes?.class_name || ''} since ${format(admissionDate, 'MMMM yyyy')}`,
    reasonForLeaving: reasonForLeaving || "Parent's Request",
    remarks: remarks || '-',
    abcNumber: student.abc_number || 'N/A'
  };
  
  const DataRow = ({ label, value }) => (
    <div className="flex">
        <div className="w-2/5 font-semibold pr-4">{label}</div>
        <div className="w-3/5">: {value}</div>
    </div>
  );

  return (
    <div className="a4-page font-serif text-black">
      <div className="text-center mb-4">
        <p className="text-xs max-w-lg mx-auto">No change in any entry in this certificate shall be made except by the authority issuing it and any infringement of this requirement is liable to involve the imposition of penalty such as that of rustication.</p>
        <h3 className="text-lg font-bold mt-2">{student.institutes?.name || 'INSTITUTE NAME'}</h3>
        <p>{student.institutes?.address || 'Institute Address'}</p>
        <h1 className="text-xl font-bold border-b-2 border-black inline-block px-4 mt-2">LEAVING CERTIFICATE</h1>
      </div>

      <div className="flex justify-between mb-4">
        <span>No. <strong>{sequenceNumber}</strong></span>
        <span>Registration No. of Student : <strong>{student.gr_no}</strong></span>
      </div>

      <div className="space-y-2 text-base leading-relaxed border-t border-b py-4 border-dashed border-gray-400">
        <DataRow label="Full Name" value={studentData.fullName} />
        <DataRow label="ABC Number" value={studentData.abcNumber} />
        <DataRow label="Caste with Sub-Caste" value={studentData.caste} />
        <DataRow label="Nationality" value={studentData.nationality} />
        <DataRow label="Place of Birth" value={studentData.placeOfBirth} />
        <DataRow label="Date of Birth in Figure" value={studentData.dobInFigures} />
        <DataRow label="Date of Birth in Words" value={studentData.dobInWords} />
        <DataRow label="Last Institute" value={studentData.lastInstitute} />
        <DataRow label="Date of Admission" value={studentData.admissionDate} />
        <DataRow label="Progress" value={studentData.progress} />
        <DataRow label="Conduct" value={studentData.conduct} />
        <DataRow label="Date of Leaving of this Institute" value={studentData.dateOfLeaving} />
        <DataRow label="Standard in which studying and since when" value={studentData.studyingIn} />
        <DataRow label="Reason of leaving Institute" value={studentData.reasonForLeaving} />
        <DataRow label="Remarks" value={studentData.remarks} />
      </div>
      
      <p className="my-4">This is certified that above information is in accordance with the Institute's records.</p>
      <p>Date: {format(today, 'dd/MM/yyyy')}</p>

      <div className="mt-16 pt-8 flex justify-between items-end">
        <div className="text-center">
            <p className="font-semibold border-t border-gray-400 px-4">Section Clerk</p>
        </div>
        <div className="text-center">
            <p className="font-semibold border-t border-gray-400 px-4">Principal</p>
        </div>
      </div>
    </div>
  );
};

export default TransferCertificate;