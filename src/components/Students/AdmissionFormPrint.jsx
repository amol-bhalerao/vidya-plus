import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { API_BASE } from '@/lib/constants';

const formatDate = (value) => {
  if (!value) return 'N/A';
  try {
    return format(new Date(value), 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const formatCurrency = (value) => `₹${(Number(value) || 0).toFixed(2)}`;

const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-slate-200 py-1.5">
    <span className="font-semibold text-slate-600">{label}</span>
    <span className="text-slate-900">{value || 'N/A'}</span>
  </div>
);

const SectionCard = ({ title, children }) => (
  <section className="rounded-md border border-slate-300 bg-white p-3">
    <h3 className="mb-2 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h3>
    {children}
  </section>
);

const AdmissionFormPrint = ({ studentData }) => {
  const printRef = useRef(null);
  const [logoFailed, setLogoFailed] = useState(false);

  if (!studentData?.student) {
    return <div>Loading...</div>;
  }

  const { student, fees = [] } = studentData;
  const totalFees = fees.reduce((sum, fee) => sum + (Number(fee.total_amount) || 0), 0);
  const classLabel = [student.course_name, student.class_name, student.section].filter(Boolean).join(' - ');
  const instituteInitials = (student.institute_name || 'VP')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  const rawLogo = student.institute_logo ? String(student.institute_logo).trim() : '';
  const hasServedLogoPath = /^https?:\/\//i.test(rawLogo) || rawLogo.includes('uploads/') || rawLogo.startsWith('/uploads/');
  const logoSrc = hasServedLogoPath
    ? (/^https?:\/\//i.test(rawLogo) ? rawLogo : `${API_BASE}/${rawLogo.replace(/^\/+/, '')}`)
    : '/vidya-plus-logo.svg';

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Admission_Form_${student.admission_no || student.gr_no || student.id}`,
    pageStyle: '@page { size: A4 portrait; margin: 8mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
  });

  return (
    <div className="space-y-4">
      <div ref={printRef} className="admission-form-sheet mx-auto w-full max-w-[210mm] bg-white p-4 text-[11px] leading-5 text-slate-900 sm:p-6 print:p-0">
        <div className="border border-slate-800 p-4">
          <header className="border-b-2 border-slate-800 pb-3">
            <div className="grid grid-cols-[72px_1fr_34mm] items-start gap-3">
              <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded border border-slate-300 bg-slate-50">
                {logoSrc && !logoFailed ? (
                  <img
                    src={logoSrc}
                    alt="Institute Logo"
                    className="h-full w-full object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-600">
                    {instituteInitials}
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Vidya+ Admission Record</p>
                <h1 className="text-base font-bold uppercase leading-tight sm:text-lg">{student.institute_name || 'Institute Name'}</h1>
                <p className="text-[10px] text-slate-600 sm:text-[11px]">{student.institute_address || 'Address not available'}</p>
                <p className="mt-1 text-sm font-semibold">Student Admission Form</p>
              </div>

              <div className="admission-photo-box flex h-[44mm] w-[34mm] items-center justify-center border-2 border-dashed border-slate-400 px-2 text-center text-[10px] text-slate-500">
                Affix recent passport size photo
                <br />
                35mm × 45mm
              </div>
            </div>
          </header>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <SectionCard title="Academic Details">
              <DetailRow label="Admission No." value={student.admission_no} />
              <DetailRow label="GR No." value={student.gr_no} />
              <DetailRow label="Course / Class" value={classLabel} />
              <DetailRow label="Admission Date" value={formatDate(student.admission_date)} />
              <DetailRow label="Status" value={student.status ? String(student.status).replace('_', ' ').toUpperCase() : 'ACTIVE'} />
            </SectionCard>

            <SectionCard title="Personal Details">
              <DetailRow label="Full Name" value={student.full_name} />
              <DetailRow label="Mother's Name" value={student.mother_name} />
              <DetailRow label="Date of Birth" value={formatDate(student.date_of_birth)} />
              <DetailRow label="Gender" value={student.gender} />
              <DetailRow label="Birth Place" value={student.birth_place} />
            </SectionCard>

            <SectionCard title="Identity Details">
              <DetailRow label="Aadhaar No." value={student.aadhaar_no} />
              <DetailRow label="ABC ID" value={student.abc_number} />
              <DetailRow label="Religion" value={student.religion} />
              <DetailRow label="Caste" value={student.caste} />
              <DetailRow label="Category" value={student.category} />
              <DetailRow label="Mother Tongue" value={student.mother_tongue} />
            </SectionCard>

            <SectionCard title="Previous School">
              <DetailRow label="School Name" value={student.previous_school_details?.name} />
              <DetailRow label="LC No." value={student.previous_school_details?.leaving_certificate_no} />
              <DetailRow label="Leaving Date" value={formatDate(student.previous_school_details?.leaving_date)} />
              <DetailRow label="Institute" value={student.institute_name} />
            </SectionCard>
          </div>

          <SectionCard title="Fees Added To Student Account">
            <div className="overflow-hidden rounded border border-slate-300">
              <table className="w-full border-collapse text-[10px] sm:text-[11px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border-b border-slate-300 px-2 py-1 text-left">Fee Particular</th>
                    <th className="border-b border-slate-300 px-2 py-1 text-left">Due Date</th>
                    <th className="border-b border-slate-300 px-2 py-1 text-left">Status</th>
                    <th className="border-b border-slate-300 px-2 py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.length > 0 ? fees.map((fee, index) => (
                    <tr key={`${fee.bill_name}-${index}`}>
                      <td className="border-b border-slate-200 px-2 py-1">{fee.bill_name}</td>
                      <td className="border-b border-slate-200 px-2 py-1">{formatDate(fee.due_date)}</td>
                      <td className="border-b border-slate-200 px-2 py-1 uppercase">{fee.status || 'unpaid'}</td>
                      <td className="border-b border-slate-200 px-2 py-1 text-right">{formatCurrency(fee.total_amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-2 py-2 text-center text-slate-500">No fee entries available.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={3} className="px-2 py-1 text-right">Total Assigned Fees</td>
                    <td className="px-2 py-1 text-right">{formatCurrency(totalFees)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>

          <div className="mt-4 grid grid-cols-1 gap-4 text-[10px] text-slate-600 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-800">Declaration</p>
              <p>I confirm that the above information is correct and I agree to abide by the institute rules.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Office Note</p>
              <p>Required fees have been posted to the student account and can be tracked from the finance ledger.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Issue Date</p>
              <p>{formatDate(new Date())}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 pt-6 text-center text-[10px] sm:text-[11px]">
            <div className="border-t border-dashed border-slate-700 pt-1 font-medium">Parent / Guardian</div>
            <div className="border-t border-dashed border-slate-700 pt-1 font-medium">Student Signature</div>
            <div className="border-t border-dashed border-slate-700 pt-1 font-medium">Admission In-Charge</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center print-hidden">
        <Button onClick={() => handlePrint?.()}>
          <Printer className="mr-2 h-4 w-4" />
          Print Admission Form
        </Button>
      </div>
    </div>
  );
};

export default AdmissionFormPrint;