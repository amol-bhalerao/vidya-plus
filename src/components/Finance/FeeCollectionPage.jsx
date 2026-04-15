import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StudentFeeDetails from './StudentFeeDetails';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

const FeeCollectionPage = () => {
  const { instituteId } = useUser();
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedStudentId(null);
    setSearchTerm('');
    setStudents([]);
  }, [instituteId]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!instituteId || searchTerm.length < 3) {
        setStudents([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/students?institute_id=${instituteId}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok) {
          // Filter students by search term on the frontend
          const filteredStudents = Array.isArray(data) ?
            data.filter(student =>
              student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              student.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10) : [];
          setStudents(filteredStudents);
        } else {
          console.error('Error fetching students:', data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchStudents();
    }, 500);

    return () => clearTimeout(debounceFetch);

  }, [instituteId, searchTerm]);

  return (
    <>
      <Helmet>
        <title>Fee Collection - Vidya+</title>
        <meta name="description" content="Search students and collect outstanding fees." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Fee Collection</h1>
          <p className="text-gray-600 mt-1">Search for any student to view their fee details and collect payments.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Student</CardTitle>
            <CardDescription>Begin by finding the student you wish to collect fees from.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by Name, GR No, or Admission No..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!instituteId}
                />
              </div>
              <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''} disabled={!students.length}>
                <SelectTrigger className="md:w-[400px]">
                  <SelectValue placeholder={loading ? "Searching..." : "Select Student"} />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.full_name} ({s.course_name || s.courses?.course_name || 'N/A'} | {s.gr_no || s.admission_no})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {searchTerm.length > 0 && searchTerm.length < 3 && <p className="text-sm text-gray-500 mt-2">Type at least 3 characters to search.</p>}
          </CardContent>
        </Card>

        {selectedStudentId && instituteId && (
          <StudentFeeDetails studentId={selectedStudentId} instituteId={instituteId} key={selectedStudentId} />
        )}
      </motion.div>
    </>
  );
};

export default FeeCollectionPage;