import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { Printer, ShieldAlert } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import CollectFeeForm from '../Finance/CollectFeeForm';
import TransferCertificate from './TransferCertificate';
import BonafideCertificate from './BonafideCertificate';
import CharacterCertificate from './CharacterCertificate';
import Form15A from './Form15A';

const certificateComponents = {
  'Transfer Certificate': { component: TransferCertificate, type: 'transfer_certificate', requiresInput: true, needsDuesCleared: true },
  'Bonafide Certificate': { component: BonafideCertificate, type: 'bonafide_certificate', requiresInput: true, needsDuesCleared: false },
  'Character Certificate': { component: CharacterCertificate, type: 'character_certificate', requiresInput: false, needsDuesCleared: false },
  'Form 15A': { component: Form15A, type: 'form_15a', requiresInput: false, needsDuesCleared: false },
};

const DuesDialog = ({ dues, student, onDuesCleared }) => {
  const [selectedFee, setSelectedFee] = useState(null);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const handleCollectFee = (fee) => { setSelectedFee(fee); setIsCollectFeeOpen(true); };
  const handlePaymentSuccess = () => { setIsCollectFeeOpen(false); onDuesCleared(); };

  if (!student) return null;
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center"><ShieldAlert className="mr-2 text-yellow-500" /> Outstanding Dues Found</DialogTitle></DialogHeader>
        <p>Cannot generate Transfer Certificate until all dues are cleared for {student.full_name}.</p>
        <ScrollArea className="max-h-64 mt-4"><ul className="space-y-2 pr-4">{dues.map(fee => (<li key={fee.id} className="flex justify-between items-center p-2 border rounded-md"><div><p className="font-semibold">{fee.bill_name}</p><p className="text-sm text-red-600">Balance: ₹{Number(fee.balance_amount).toFixed(2)}</p></div><Button size="sm" onClick={() => handleCollectFee(fee)}>Pay Now</Button></li>))}</ul></ScrollArea>
        {isCollectFeeOpen && selectedFee && (<Dialog open={isCollectFeeOpen} onOpenChange={setIsCollectFeeOpen}><DialogContent><DialogHeader><DialogTitle>Collect Fee: {selectedFee.bill_name}</DialogTitle></DialogHeader><CollectFeeForm student={student} bill={selectedFee} onSuccess={handlePaymentSuccess} /></DialogContent></Dialog>)}
      </DialogContent>
    </Dialog>
  );
};

const InputDialog = ({ onGenerate, onCancel, title, fields }) => {
  const [formData, setFormData] = useState(fields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue || '' }), {}));
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  return (
    <Dialog defaultOpen onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">{fields.map(f => (<div className="space-y-2" key={f.name}><Label htmlFor={f.name}>{f.label}</Label><Input id={f.name} name={f.name} value={formData[f.name]} onChange={handleChange} /></div>))}</div>
        <DialogFooter><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={() => onGenerate(formData)}>Generate Document</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DocumentsDashboard = () => {
  const { instituteId, user } = useUser();
  const { toast } = useToast();
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [outstandingDues, setOutstandingDues] = useState([]);
  const [showDuesDialog, setShowDuesDialog] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [inputDialogConfig, setInputDialogConfig] = useState(null);
  const [loading, setLoading] = useState({ courses: false, classes: false, students: false });
  const [activeCertificate, setActiveCertificate] = useState(null);
  const [documentSequence, setDocumentSequence] = useState(null);
  const [certificateProps, setCertificateProps] = useState({});

  const ActiveCertificateComponent = activeCertificate ? certificateComponents[activeCertificate]?.component : null;

  useEffect(() => {
    if (instituteId) {
      setLoading(p => ({ ...p, courses: true }));
      fetch(`/crud/courses?institute_id=${instituteId}`)
        .then(response => response.json())
        .then(data => {
          setCourses(data);
          setLoading(p => ({ ...p, courses: false }));
        })
        .catch(error => {
          toast({ variant: 'destructive', title: 'Error fetching courses' });
          setLoading(p => ({ ...p, courses: false }));
        });
    }
  }, [instituteId, toast]);

  useEffect(() => {
    if (selectedCourse) {
      setLoading(p => ({ ...p, classes: true }));
      fetch(`/crud/classes?course_id=${selectedCourse}`)
        .then(response => response.json())
        .then(data => {
          setClasses(data);
          setLoading(p => ({ ...p, classes: false }));
        })
        .catch(error => {
          toast({ variant: 'destructive', title: 'Error fetching classes' });
          setLoading(p => ({ ...p, classes: false }));
        });
    } else { setClasses([]); }
    setSelectedClass(''); setStudents([]); setSelectedStudent(''); setStudentData(null);
  }, [selectedCourse, toast]);

  useEffect(() => {
    if (selectedClass) {
      setLoading(p => ({ ...p, students: true }));
      fetch(`/crud/students?class_id=${selectedClass}&status_neq=tc_issued`)
        .then(response => response.json())
        .then(data => {
          setStudents(data);
          setLoading(p => ({ ...p, students: false }));
        })
        .catch(error => {
          toast({ variant: 'destructive', title: 'Error fetching students' });
          setLoading(p => ({ ...p, students: false }));
        });
    } else { setStudents([]); }
    setSelectedStudent(''); setStudentData(null);
  }, [selectedClass, toast]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!selectedStudent) { setStudentData(null); return; }
      try {
        const response = await fetch(`/crud/students/${selectedStudent}?expand=institutes,classes,courses`);
        const data = await response.json();
        setStudentData(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching student data' });
      }
    };
    fetchStudentData(); setActiveCertificate(null); setDocumentSequence(null);
  }, [selectedStudent, toast]);

  const checkDues = async () => {
    if (!studentData) return false;
    try {
      const response = await fetch(`/crud/fee_bills?student_id=${studentData.id}&balance_amount_gt=0`);
      const data = await response.json();
      if (data.length > 0) { setOutstandingDues(data); return true; }
      setOutstandingDues([]); setShowDuesDialog(false); return false;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error checking dues' });
      return false;
    }
  };

  const proceedWithGeneration = async (certName, extraProps = {}) => {
    const docInfo = certificateComponents[certName];
    if (!docInfo) return;
    const usePrefix = docInfo.type !== 'transfer_certificate';
    try {
      // Get next document sequence
      const seqResponse = await fetch(`${API_BASE}/document-sequence`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institute_id: instituteId, document_type: docInfo.type, use_prefix: usePrefix })
      });
      const seqData = await seqResponse.json();
      if (!seqResponse.ok) {
        toast({ variant: 'destructive', title: 'Error generating document number', description: seqData.error || 'Unknown error' });
        return;
      }
      const seq = seqData.sequence_number;

      setDocumentSequence(seq);
      setCertificateProps(extraProps);
      setActiveCertificate(certName);

      // Insert generated document record
      const insertResponse = await fetch(`${API_BASE}/generated-documents`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institute_id: instituteId,
          student_id: studentData.id,
          document_type: docInfo.type,
          sequence_number: seq,
          generated_by: user?.id || 1, // Default to 1 if user not available
          document_data: { ...studentData, ...extraProps }
        })
      });
      const insertData = await insertResponse.json();
      if (!insertResponse.ok) {
        toast({ variant: 'destructive', title: 'Error saving document record', description: insertData.error || 'Unknown error' });
      }

      // Update student status if TC is generated
      if (docInfo.type === 'transfer_certificate') {
        const updateResponse = await fetch(`${API_BASE}/students/${studentData.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'tc_issued' })
        });
        const updateData = await updateResponse.json();
        if (updateResponse.ok) {
          toast({ title: 'TC Generated', description: 'Student status updated to TC Issued.' });
        } else {
          toast({ variant: 'destructive', title: 'Error updating student status', description: updateData.error || 'Unknown error' });
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error generating document', description: error.message });
    }
  };

  const handleGenerateClick = async (certName) => {
    if (!studentData) { toast({ variant: 'destructive', title: 'Please select a student first.' }); return; }
    const docInfo = certificateComponents[certName];
    if (docInfo.needsDuesCleared) { if (await checkDues()) { setShowDuesDialog(true); return; } }
    if (docInfo.requiresInput) {
      let dialogConfig;
      if (certName === 'Transfer Certificate') {
        dialogConfig = { title: 'Transfer Certificate Details', fields: [{ name: 'progress', label: 'Progress', defaultValue: 'Good' }, { name: 'conduct', label: 'Conduct', defaultValue: 'Good' }, { name: 'reasonForLeaving', label: 'Reason for Leaving', defaultValue: "Parent's Request" }, { name: 'remarks', label: 'Remarks', defaultValue: '-' }] };
      } else if (certName === 'Bonafide Certificate') {
        dialogConfig = { title: 'Bonafide Certificate Purpose', fields: [{ name: 'purpose', label: 'Purpose for Certificate', defaultValue: '' }] };
      }
      setInputDialogConfig(dialogConfig);
      setShowInputDialog(true);
    } else { proceedWithGeneration(certName); }
  };

  const handleInputFormSubmit = (formData) => {
    const certName = inputDialogConfig.title.includes('Transfer') ? 'Transfer Certificate' : 'Bonafide Certificate';
    setShowInputDialog(false); proceedWithGeneration(certName, formData);
  };
  const handlePrint = () => window.print();

  return (
    <>
      <Helmet><title>Document & Certificate Management - Vidya+</title><meta name="description" content="Generate various student certificates and documents." /></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 print-hidden">
        <div><h1 className="text-3xl font-bold gradient-text">Document & Certificate Management</h1><p className="text-gray-600 mt-1">Generate and print official student documents.</p></div>
        <Card><CardHeader><CardTitle>Select Student</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4"><Select onValueChange={setSelectedCourse} value={selectedCourse} disabled={loading.courses || !instituteId}><SelectTrigger><SelectValue placeholder={loading.courses ? "Loading..." : "Select Course"} /></SelectTrigger><SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent></Select><Select onValueChange={setSelectedClass} value={selectedClass} disabled={loading.classes || !selectedCourse}><SelectTrigger><SelectValue placeholder={loading.classes ? "Loading..." : "Select Class"} /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}{c.section && ` - ${c.section}`}</SelectItem>)}</SelectContent></Select><Select onValueChange={setSelectedStudent} value={selectedStudent} disabled={loading.students || !selectedClass}><SelectTrigger><SelectValue placeholder={loading.students ? "Loading..." : "Select Student"} /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.gr_no})</SelectItem>)}</SelectContent></Select></CardContent></Card>
        {selectedStudent && (<Card><CardHeader><CardTitle>Select Document</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{Object.keys(certificateComponents).map(name => (<Button key={name} variant={activeCertificate === name ? 'default' : 'outline'} onClick={() => handleGenerateClick(name)}>Generate {name}</Button>))}</CardContent></Card>)}
      </motion.div>
      {showDuesDialog && studentData && <DuesDialog dues={outstandingDues} student={studentData} onDuesCleared={checkDues} />}
      {showInputDialog && <InputDialog onGenerate={handleInputFormSubmit} onCancel={() => setShowInputDialog(false)} {...inputDialogConfig} />}
      {ActiveCertificateComponent && studentData && documentSequence && (<div id="printable-area"><div className="print-hidden p-4 bg-gray-100 flex justify-end"><Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print Document</Button></div><ActiveCertificateComponent student={studentData} sequenceNumber={documentSequence} {...certificateProps} /></div>)}
    </>
  );
};

export default DocumentsDashboard;