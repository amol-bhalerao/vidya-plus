import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { PlusCircle, UploadCloud, Search, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentList from '@/components/Students/StudentList';
import BulkUploadStudents from '@/components/Modules/BulkUploadStudents';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';

const PAGE_SIZE = 10;

const StudentManagementDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const instituteId = user?.institute_id || null;

  const fetchStudents = useCallback(async () => {
    if (!instituteId || userLoading) {
      setLoading(false);
      setStudents([]);
      setCount(0);
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env?.VITE_API_BASE || 'http://127.0.0.1:8000';
      const params = new URLSearchParams();
      params.append('institute_id', instituteId);
      params.append('limit', PAGE_SIZE.toString());
      params.append('offset', ((page - 1) * PAGE_SIZE).toString());
      params.append('sort', 'full_name');
      params.append('order', 'asc');

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await fetch(`${API_BASE}/students?${params}`, {
        credentials: 'include',
        method: 'GET'
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      // The CRUD API returns data directly as an array
      setStudents(Array.isArray(data) ? data : []);
      setCount(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [instituteId, page, searchTerm, userLoading]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
        <title>Student Management - Vidya+</title>
        <meta name="description" content="Manage student profiles, academic records, and more." />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Student Management</h1>
            <p className="text-gray-600 mt-1">Search, view, and manage student records.</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild><Button variant="outline"><UploadCloud className="mr-2 h-4 w-4" />Bulk Upload</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Student Upload</DialogTitle>
                  <DialogDescription>Upload a CSV file to add multiple students at once.</DialogDescription>
                </DialogHeader>
                <BulkUploadStudents instituteId={instituteId} onUploadComplete={() => { setIsBulkUploadOpen(false); fetchStudents(); }} />
              </DialogContent>
            </Dialog>
            <Button onClick={() => navigate('/dashboard/students/add')} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"><PlusCircle className="mr-2 h-4 w-4" />Add New Student</Button>
          </div>
        </div>

        <Tabs defaultValue="student_list">
          <TabsList>
            <TabsTrigger value="student_list">Student List</TabsTrigger>
            <TabsTrigger value="reports"><PieChart className="mr-2 h-4 w-4" />Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="student_list" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, GR No, Admission No..." value={searchTerm} onChange={handleSearch} className="pl-10" />
            </div>
            <StudentList students={students} loading={loading} onRefresh={fetchStudents} instituteId={instituteId} page={page} count={count} pageSize={PAGE_SIZE} onPageChange={handlePageChange} />
          </TabsContent>
          <TabsContent value="reports" className="mt-4">
            <StudentReports instituteId={instituteId} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
};

export default StudentManagementDashboard;