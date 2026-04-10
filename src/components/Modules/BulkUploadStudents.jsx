import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE } from '@/lib/constants';

const BulkUploadStudents = ({ instituteId, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ total: 0, success: 0, failed: 0, errors: [] });
  const { toast } = useToast();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDownloadTemplate = () => {
    const headers = "admission_no,gr_no,full_name,mother_name,date_of_birth,birth_place,gender,aadhaar_no,caste,category,religion,mother_tongue,admission_date,course_name,class_name,section";
    const example = "ADM101,GR101,John Doe,Jane Doe,2005-04-23,New York,male,123456789012,General,OPEN,Hinduism,English,2024-06-01,Science,XI,A";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a CSV file to upload.', variant: 'destructive' });
      return;
    }
    if (!instituteId) {
      toast({ title: 'Institute not found', description: 'Cannot upload students without an institute ID.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadStatus({ total: 0, success: 0, failed: 0, errors: [] });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const students = results.data;
        setUploadStatus(prev => ({ ...prev, total: students.length }));

        let successCount = 0;
        let failedCount = 0;
        let errorMessages = [];

        for (const [index, student] of students.entries()) {
          try {
            // Find class ID using the API
            const classResponse = await fetch(`${API_BASE}/find-class-id`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                institute_id: instituteId,
                course_name: student.course_name,
                class_name: student.class_name,
                section: student.section
              })
            });

            if (!classResponse.ok) {
              const errorData = await classResponse.json();
              throw new Error(errorData.error || 'Could not find matching class');
            }

            const classData = await classResponse.json();
            if (!classData.class_id) {
              throw new Error('Could not find matching class');
            }

            const class_id = classData.class_id;

            // Get course ID for the class
            const courseResponse = await fetch(`${API_BASE}/classes/${class_id}`, {
              method: 'GET',
              credentials: 'include'
            });

            if (!courseResponse.ok) {
              const errorData = await courseResponse.json();
              throw new Error(errorData.error || 'Could not get course information');
            }

            const courseData = await courseResponse.json();
            const course_id = courseData.course_id;

            // Prepare student data for upload
            const { course_name, class_name, section, ...studentData } = student;
            const studentUploadData = {
              ...studentData,
              institute_id: instituteId,
              class_id,
              course_id,
              status: 'active'
            };

            // Upload student data
            const studentResponse = await fetch(`${API_BASE}/students`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(studentUploadData)
            });

            if (!studentResponse.ok) {
              const errorData = await studentResponse.json();
              throw new Error(errorData.error || 'Failed to upload student');
            }

            successCount++;
          } catch (error) {
            failedCount++;
            errorMessages.push(`Row ${index + 1} (${student.full_name || `Row ${index + 1}`}): ${error.message}`);
          }

          setUploadStatus({ total: students.length, success: successCount, failed: failedCount, errors: errorMessages });
        }

        toast({
          title: 'Upload Complete',
          description: `${successCount} students uploaded, ${failedCount} failed.`,
        });

        if (successCount > 0 && onUploadComplete) {
          onUploadComplete();
        }
        setUploading(false);
      },
      error: (error) => {
        toast({ title: 'CSV Parsing Error', description: error.message, variant: 'destructive' });
        setUploading(false);
      },
    });
  };

  return (
    <Card className="card-hover bg-white/80 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle>Bulk Student Upload</CardTitle>
        <CardDescription>Upload a CSV file with student data. Make sure to use the template for correct column headers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="secondary" onClick={handleDownloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV Template
        </Button>
        <div className="flex items-center space-x-2">
          <Input type="file" accept=".csv" onChange={handleFileChange} disabled={uploading} />
          <Button onClick={handleUpload} disabled={!file || uploading}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(uploadStatus.success + uploadStatus.failed) / uploadStatus.total * 100}%` }}></div>
          </div>
        )}
        {uploadStatus.total > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p>Total Records: {uploadStatus.total}</p>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Successful: {uploadStatus.success}</span>
            </div>
            <div className="flex items-center space-x-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span>Failed: {uploadStatus.failed}</span>
            </div>
            {uploadStatus.errors.length > 0 && (
              <Card className="max-h-32 overflow-y-auto">
                <CardHeader className="p-2"><CardTitle className="text-sm">Error Details</CardTitle></CardHeader>
                <CardContent className="p-2 text-xs">
                  {uploadStatus.errors.map((err, i) => <p key={i}>{err}</p>)}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkUploadStudents;