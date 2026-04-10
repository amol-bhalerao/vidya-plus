import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import TodaysCollections from './TodaysCollections';
import ExpenseManagement from '@/components/Accounts/ExpenseManagement';
import GeneralLedger from '@/components/Accounts/GeneralLedger';
import StudentLedger from '@/components/Accounts/StudentLedger';
import BalanceSheet from '@/components/Accounts/BalanceSheet';
import { DollarSign } from 'lucide-react';

const FinanceDashboard = () => {
  const { user, instituteId } = useUser();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Finance & Accounts - Vidya+</title>
        <meta name="description" content="Manage student fees, collections, expenses, and financial accounting." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Finance & Accounts</h1>
            <p className="text-gray-600 mt-1">Your central hub for financial operations and reporting.</p>
          </div>
          <Button onClick={() => navigate('/admin/finance/collect')}>
            <DollarSign className="mr-2 h-4 w-4" />
            Collect Fee
          </Button>
        </div>

        {!instituteId && (
          <Card>
            <CardHeader>
              <CardTitle>No Institute Selected</CardTitle>
              <CardDescription>Please select an institute from the header to view the finance and accounts dashboard.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {instituteId && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="overview">Collections</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="general_ledger">General Ledger</TabsTrigger>
              <TabsTrigger value="student_ledger">Student Ledger</TabsTrigger>
              <TabsTrigger value="reports">Financial Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <TodaysCollections instituteId={instituteId} />
            </TabsContent>
            <TabsContent value="expenses">
              <ExpenseManagement instituteId={instituteId} />
            </TabsContent>
            <TabsContent value="general_ledger">
              <GeneralLedger instituteId={instituteId} />
            </TabsContent>
            <TabsContent value="student_ledger">
              <StudentLedger instituteId={instituteId} />
            </TabsContent>
            <TabsContent value="reports">
              <BalanceSheet instituteId={instituteId} />
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </>
  );
};

export default FinanceDashboard;