import React from 'react';
import { format } from 'date-fns';

const BonafideCertificate = ({ student, sequenceNumber, purpose }) => {
  const today = new Date();
  const academicYear = `${today.getFullYear()}-${(today.getFullYear() + 1).toString().slice(-2)}`;

  const genderDetails = {
    salutation: student.gender === 'female' ? 'Ms.' : 'Mr.',
    pronoun: student.gender === 'female' ? 'She' : 'He',
    possessivePronoun: student.gender === 'female' ? 'her' : 'his',
    parentalRelation: student.gender === 'female' ? 'daughter' : 'son',
  };

  return (
    <div className="p-8 font-serif text-black a5-landscape-page">
       <style>{`
        @page { size: A5 landscape; margin: 10mm; }
      `}</style>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">{student.institutes?.name || 'INSTITUTE NAME'}</h2>
        <p>{student.institutes?.address || 'Institute Address'}</p>
        <p className="mt-2 text-sm">{student.institutes?.contact_info?.email || 'email@example.com'} | {student.institutes?.contact_info?.phone || '999-999-9999'}</p>
      </div>
      
      <div className="flex justify-between items-start mb-8 text-lg">
        <p>Ref No.: {sequenceNumber}</p>
        <p>Date: {format(today, 'dd/MM/yyyy')}</p>
      </div>

      <div className="text-center my-12">
        <h1 className="text-3xl font-bold underline">TO WHOMSOEVER IT MAY CONCERN</h1>
      </div>

      <div className="text-xl leading-relaxed space-y-6">
        <p>This is to certify that {genderDetails.salutation} <strong>{student.full_name}</strong>, {genderDetails.parentalRelation} of <strong>{student.mother_name || 'N/A'}</strong>, is a bonafide student of this institute.</p>
        <p>{genderDetails.pronoun} is studying in <strong>{student.classes?.courses?.course_name || 'N/A'} - {student.classes?.class_name || 'N/A'}</strong> for the academic year {academicYear}. {genderDetails.possessivePronoun} General Register Number is <strong>{student.gr_no}</strong>.</p>
        <p>As per our records, {genderDetails.possessivePronoun} date of birth is <strong>{format(new Date(student.date_of_birth), 'dd/MM/yyyy')}</strong>.</p>
        <p>This certificate is issued at the request of the student for the purpose of <strong>{purpose || '[Purpose not specified]'}</strong>.</p>
        <p>We wish {genderDetails.possessivePronoun === 'her' ? 'her' : 'him'} all the best for {genderDetails.possessivePronoun} future endeavors.</p>
      </div>

      <div className="mt-24 pt-8 flex justify-between items-end">
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

export default BonafideCertificate;