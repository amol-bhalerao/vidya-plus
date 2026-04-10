import React from 'react';
import { format } from 'date-fns';

const CharacterCertificate = ({ student, sequenceNumber }) => {
  const today = new Date();
  const academicYear = `${today.getFullYear() - 1}-${today.getFullYear().toString().slice(-2)}`; // Assuming for the last completed year
  
  const genderDetails = {
    salutation: student.gender === 'female' ? 'Ms.' : 'Mr.',
    pronoun: student.gender === 'female' ? 'She' : 'He',
    possessivePronoun: student.gender === 'female' ? 'her' : 'his',
  };

  return (
    <div className="p-8 font-serif text-black a5-landscape-page">
      <style>{`
        @page { size: A5 landscape; margin: 10mm; }
      `}</style>
      <div className="text-center mb-8">
         <h2 className="text-2xl font-semibold">{student.institutes?.name || 'INSTITUTE NAME'}</h2>
        <p>{student.institutes?.address || 'Institute Address'}</p>
      </div>
      
      <div className="flex justify-between items-start mb-8 text-lg">
        <p>Ref No.: </p>
        <p>Date: {format(today, 'dd/MM/yyyy')}</p>
      </div>

      <div className="text-center my-12">
        <h1 className="text-3xl font-bold underline">CHARACTER CERTIFICATE</h1>
      </div>

      <div className="text-xl leading-loose space-y-6">
        <p>This is to certify that {genderDetails.salutation} <strong>{student.full_name}</strong> was a student of this institute from <strong>{student.admission_date ? format(new Date(student.admission_date), 'MMMM yyyy') : 'N/A'}</strong> to <strong>{format(today, 'MMMM yyyy')}</strong>.</p>
        <p>{genderDetails.pronoun} has passed the <strong>{student.classes?.courses?.course_name || 'N/A'}</strong> examination in the year {academicYear}.</p>
        <p>During {genderDetails.possessivePronoun} stay at this institute, {genderDetails.possessivePronoun} conduct was found to be <strong>Good</strong>.</p>
        <p>To the best of my knowledge, {genderDetails.pronoun} bears a good moral character and is not involved in any activity that is prejudicial to the interests of the institute or the nation.</p>
        <p>I wish {genderDetails.possessivePronoun === 'her' ? 'her' : 'him'} success in all future endeavors.</p>
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

export default CharacterCertificate;