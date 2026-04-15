import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { API_BASE } from '@/lib/constants';
import AdmissionStats from '@/components/Admission/AdmissionStats';
import InquiryList from '@/components/Admission/InquiryList';
import AdmissionForm from '@/components/Admission/AdmissionForm';
import AddNewStudent from '@/components/Students/AddNewStudent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const PAGE_SIZE = 10;

const AdmissionDashboard = () => {
  const { user, instituteId: selectedInstituteId } = useUser();
  const instituteId = selectedInstituteId || user?.institute_id;
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('inquiry'); // 'inquiry' or 'admission'
  const [selectedInquiryData, setSelectedInquiryData] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const fetchInquiries = useCallback(async () => {
    if (!instituteId) {
      setLoading(false);
      setInquiries([]);
      setCount(0);
      return;
    }

    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const params = new URLSearchParams({
        instituteId,
        status_neq: 'admitted',
        order_by: 'inquiry_date',
        order_direction: 'desc',
        range_from: from,
        range_to: to
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${API_BASE}/admission_inquiries?institute_id=${instituteId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setInquiries(Array.isArray(result) ? result : []);
      setCount(Array.isArray(result) ? result.length : 0);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      setInquiries([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [instituteId, page, searchTerm]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedInquiryData(null);
    fetchInquiries();
  };

  const handleOpenForm = (mode, inquiryData = null) => {
    setFormMode(mode);
    setSelectedInquiryData(inquiryData);
    setIsFormOpen(true);
  }

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(count / PAGE_SIZE)) {
      setPage(newPage);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admission Management - Vidya+</title>
        <meta name="description" content="Manage student admission inquiries and applications." />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Admission Management</h1>
            <p className="text-gray-600 mt-1">Track and manage new student applications.</p>
          </div>
          {instituteId && (
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button onClick={() => handleOpenForm('inquiry')} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />Add New Inquiry
              </Button>
              <Button onClick={() => handleOpenForm('admission')} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <PlusCircle className="mr-2 h-4 w-4" />Direct Admission
              </Button>
            </div>
          )}
        </div>

        <AdmissionStats inquiries={inquiries} />
        <InquiryList inquiries={inquiries} loading={loading} onRefresh={fetchInquiries} onConvertToAdmission={(inquiry) => handleOpenForm('admission', inquiry)} searchTerm={searchTerm} onSearchChange={handleSearchChange} page={page} count={count} pageSize={PAGE_SIZE} onPageChange={handlePageChange} />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{formMode === 'admission' ? 'New Student Registration' : 'New Admission Inquiry'}</DialogTitle>
              <DialogDescription>
                {formMode === 'admission' ? "Fill in the details for direct student registration." : "Fill in the details for the new inquiry."}
              </DialogDescription>
            </DialogHeader>
            {instituteId && (
              formMode === 'admission' ?
                <AddNewStudent instituteId={instituteId} inquiryData={selectedInquiryData} onSuccess={handleFormSuccess} /> :
                <AdmissionForm instituteId={instituteId} onSuccess={handleFormSuccess} />
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
};

export default AdmissionDashboard;