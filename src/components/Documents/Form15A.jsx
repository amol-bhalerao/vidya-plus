import React from 'react';
import { format } from 'date-fns';

const Form15A = ({ student, sequenceNumber }) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    const yearRange = `${currentYear.toString().slice(-2)} - ${(nextYear).toString().slice(-2)}`;
    
    const studentData = {
        salutation: student.gender === 'female' ? 'Kum.' : 'Shri.',
        pronoun: student.gender === 'female' ? 'she' : 'he',
        fullName: student.full_name || 'N/A',
        year: yearRange,
        standard: student.classes?.class_name || 'N/A',
        faculty: student.classes?.courses?.course_name || 'N/A',
        grNo: student.gr_no || 'N/A',
        caste: student.caste || 'N/A',
        instituteName: student.institutes?.name || 'INSTITUTE NAME',
        institutePlace: student.institutes?.address?.split(',').pop()?.trim() || 'Institute Place'
    };

    return (
        <div className="a5-landscape-page font-serif text-black p-8 flex flex-col">
            <style>{`
                @page { size: A5 landscape; margin: 10mm; }
            `}</style>
            <div className="text-center mb-8">
                <h1 className="font-bold text-lg">Form-15A</h1>
                <p className="font-bold underline text-md mt-2">Certificate to be given by Principal of the School/College</p>
            </div>
            
            <div className="text-xl leading-relaxed flex-grow">
                <p>This is to Certify that</p>
                <p className="mt-4">
                    {studentData.salutation} <span className="font-bold">{studentData.fullName}</span> is
                    Student of this School / College in Year 20<span className="font-bold">{studentData.year}</span> and {studentData.pronoun} is studying in
                    Std <span className="font-bold">{studentData.standard} {studentData.faculty}</span> faculty. His/her name and
                    other information is as per mentioned at number <span className="font-bold">{studentData.grNo}</span> in general register. And the Caste stated as per
                    our general register is <span className="font-bold">{studentData.caste}</span> (Strike out of if
                    not applicable).
                </p>
            </div>

            <div className="flex justify-between items-end mt-24">
                <div>
                    <p>Place: {studentData.institutePlace}</p>
                    <p className="mt-2">Date: {format(today, 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-center">
                    <p className="font-bold">Seal and Signature of the Principal/Head Master</p>
                </div>
            </div>
        </div>
    );
};

export default Form15A;