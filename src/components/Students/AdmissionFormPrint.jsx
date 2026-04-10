import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const AdmissionFormPrint = ({ studentData }) => {
    const printRef = useRef();
    const handlePrint = useReactToPrint({ content: () => printRef.current });

    if (!studentData) return <div>Loading...</div>;

    const { student, fees } = studentData;

    const DataRow = ({ label, value }) => (
        <div className="grid grid-cols-3 gap-4 py-2 border-b">
            <dt className="font-semibold text-gray-600">{label}</dt>
            <dd className="col-span-2 text-gray-800">{value || 'N/A'}</dd>
        </div>
    );

    return (
        <div>
            <div ref={printRef} className="a4-page font-sans text-black">
                <header className="flex justify-between items-center pb-4 border-b-2 border-gray-800">
                    {student.institute_logo && <img src={student.institute_logo} alt="Institute Logo" className="h-24 w-auto object-contain" />}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold uppercase">{student.institute_name}</h1>
                        <p className="text-sm">{student.institute_address}</p>
                    </div>
                    <div className="w-24 h-32 border-2 border-gray-400 flex items-center justify-center text-gray-400 text-sm">
                        Affix Photo
                    </div>
                </header>
                <div className="text-center my-4"><h2 className="text-xl font-bold underline underline-offset-4">ADMISSION FORM</h2></div>
                
                <section className="mb-6">
                    <h3 className="text-lg font-semibold bg-gray-100 p-2 mb-2 border-l-4 border-blue-500">Academic Details</h3>
                    <dl><DataRow label="Admission For" value={`${student.course_name} - ${student.class_name}`} /><DataRow label="Admission Date" value={format(new Date(student.admission_date), 'PPP')} /><DataRow label="GR No." value={student.gr_no} /><DataRow label="Admission No." value={student.admission_no} /></dl>
                </section>

                <section className="mb-6">
                    <h3 className="text-lg font-semibold bg-gray-100 p-2 mb-2 border-l-4 border-blue-500">Personal Details</h3>
                    <dl>
                        <DataRow label="Full Name" value={student.full_name} />
                        <DataRow label="Mother's Name" value={student.mother_name} />
                        <DataRow label="Date of Birth" value={format(new Date(student.date_of_birth), 'PPP')} />
                        <DataRow label="Place of Birth" value={student.birth_place} />
                        <DataRow label="Gender" value={student.gender} />
                        <DataRow label="Aadhaar Number" value={student.aadhaar_no} />
                        <DataRow label="ABC Number" value={student.abc_number} />
                    </dl>
                </section>

                <section className="mb-6">
                    <h3 className="text-lg font-semibold bg-gray-100 p-2 mb-2 border-l-4 border-blue-500">Social Details</h3>
                    <dl><DataRow label="Religion" value={student.religion} /><DataRow label="Caste" value={student.caste} /><DataRow label="Category" value={student.category} /><DataRow label="Mother Tongue" value={student.mother_tongue} /></dl>
                </section>

                <section className="mb-6">
                    <h3 className="text-lg font-semibold bg-gray-100 p-2 mb-2 border-l-4 border-blue-500">Fee Structure</h3>
                    <table className="w-full text-sm border-collapse border border-gray-400">
                        <thead><tr className="bg-gray-100"><th className="border border-gray-400 p-2 text-left">Fee Particular</th><th className="border border-gray-400 p-2 text-right">Amount (₹)</th></tr></thead>
                        <tbody>
                            {fees.map((fee, index) => (<tr key={index}><td className="border border-gray-400 p-2">{fee.bill_name}</td><td className="border border-gray-400 p-2 text-right">{Number(fee.total_amount).toFixed(2)}</td></tr>))}
                        </tbody>
                        <tfoot><tr className="font-bold"><td className="border border-gray-400 p-2 text-right">Total Fees</td><td className="border border-gray-400 p-2 text-right">₹{fees.reduce((sum, fee) => sum + Number(fee.total_amount), 0).toFixed(2)}</td></tr></tfoot>
                    </table>
                </section>

                <div className="mt-24 pt-8 flex justify-between items-end">
                    <div className="text-center"><p className="border-t-2 border-dotted border-gray-800 px-8 pt-1">Parent's Signature</p></div>
                    <div className="text-center"><p className="border-t-2 border-dotted border-gray-800 px-8 pt-1">Student's Signature</p></div>
                    <div className="text-center"><p className="border-t-2 border-dotted border-gray-800 px-8 pt-1">Principal's Signature</p></div>
                </div>
            </div>
            <div className="text-center mt-4 print-hidden"><Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print Form</Button></div>
        </div>
    );
};

export default AdmissionFormPrint;