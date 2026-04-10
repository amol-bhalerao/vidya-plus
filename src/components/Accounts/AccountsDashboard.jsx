import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GeneralLedger from './GeneralLedger';
import StudentLedger from './StudentLedger';
import ExpenseManagement from './ExpenseManagement';
import BalanceSheet from './BalanceSheet';

const AccountsDashboard = () => {
  const { instituteId, user, isSuperAdmin } = useUser();
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState(instituteId || null);
  const [loading, setLoading] = useState({ institutes: false });

  useState(() => {
    const fetchInstitutes = async () => {
      if (isSuperAdmin) {
        setLoading(prev => ({ ...prev, institutes: true }));
        try {
          const response = await fetch('/institutes');
          const data = await response.json();
          if (data) {
            setInstitutes(data);
            if (data.length > 0 && !selectedInstitute) {
              setSelectedInstitute(data[0].id);
            }
          }
        } catch (error) {
          console.error("Error fetching institutes:", error);
        }
        setLoading(prev => ({ ...prev, institutes: false }));
      }
    };
    fetchInstitutes();
  }, [isSuperAdmin, selectedInstitute]);

  const currentInstituteId = isSuperAdmin ? selectedInstitute : instituteId;
  
    return (
      <>
        <Helmet>
          <title>Accounts Management - Vidya+</title>
          <meta name="description" content="Manage institutional accounts, ledgers, expenses, and financial statements." />
        </Helmet>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Accounts Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Your central hub for financial accounting and reporting.
              </p>
            </div>
          </div>
  
          {isSuperAdmin && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Super Admin View</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                Please select an institute to manage its accounts.
                <div className="w-64 ml-4">
                  <Select onValueChange={setSelectedInstitute} value={selectedInstitute || ''} disabled={loading.institutes}>
                    <SelectTrigger><SelectValue placeholder="Select an institute..." /></SelectTrigger>
                    <SelectContent>{institutes.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!currentInstituteId && (
            <Card>
                <CardHeader>
                    <CardTitle>No Institute Selected</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Please select an institute to view the accounting dashboard.</p>
                </CardContent>
            </Card>
          )}
          
          {currentInstituteId && (
            <Tabs defaultValue="general_ledger" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="general_ledger">General Ledger</TabsTrigger>
                    <TabsTrigger value="student_ledger">Student Ledger</TabsTrigger>
                    <TabsTrigger value="expenses">Expense Management</TabsTrigger>
                    <TabsTrigger value="balance_sheet">Balance Sheet</TabsTrigger>
                </TabsList>
                <TabsContent value="general_ledger">
                    <GeneralLedger instituteId={currentInstituteId} />
                </TabsContent>
                <TabsContent value="student_ledger">
                    <StudentLedger instituteId={currentInstituteId} />
                </TabsContent>
                <TabsContent value="expenses">
                    <ExpenseManagement instituteId={currentInstituteId} />
                </TabsContent>
                <TabsContent value="balance_sheet">
                    <BalanceSheet instituteId={currentInstituteId} />
                </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </>
    );
};

export default AccountsDashboard;