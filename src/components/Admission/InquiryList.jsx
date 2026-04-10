import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckSquare, Search } from 'lucide-react';

const getStatusVariant = (status) => {
  switch (status) {
    case 'approved': return 'success';
    case 'admitted': return 'success';
    case 'rejected': return 'destructive';
    case 'applied': return 'default';
    default: return 'secondary';
  }
};

const InquiryList = ({ inquiries, loading, onRefresh, onConvertToAdmission, searchTerm, onSearchChange, onPageChange, page, count, pageSize }) => {
  
  const getDesiredClassText = (inquiry) => {
    let text = '';
    if (inquiry.courses?.course_name) text += inquiry.courses.course_name;
    if (inquiry.classes?.class_name) text += (text ? ' - ' : '') + inquiry.classes.class_name;
    if (inquiry.classes?.section) text += ` (${inquiry.classes.section})`;
    return text || 'N/A';
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border-white/20 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">All Inquiries</h3>
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search inquiries..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead><TableHead>Desired Course/Class</TableHead><TableHead>Contact</TableHead><TableHead>Inquiry Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
            ) : inquiries.length > 0 ? (
              inquiries.map((inquiry) => (
                <motion.tr key={inquiry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                  <TableCell className="font-medium">{inquiry.full_name}</TableCell>
                  <TableCell>{getDesiredClassText(inquiry)}</TableCell>
                  <TableCell>{inquiry.contact_email || inquiry.contact_phone}</TableCell>
                  <TableCell>{format(new Date(inquiry.inquiry_date), 'PPP')}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(inquiry.status)}>{inquiry.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onConvertToAdmission(inquiry)} disabled={inquiry.status === 'admitted'}>
                      <CheckSquare className="mr-2 h-4 w-4"/>Convert to Admission
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center">No active inquiries found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <div className="flex justify-end items-center space-x-2 py-4">
        <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(count / pageSize)}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Previous</Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page * pageSize >= count}>Next</Button>
      </div>
    </div>
  );
};

export default InquiryList;