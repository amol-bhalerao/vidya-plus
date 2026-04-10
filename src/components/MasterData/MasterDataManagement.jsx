import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CoursesData from './components/CoursesData';
import ClassesData from './components/ClassesData';
import SubjectsData from './components/SubjectsData';
import FeeTypesData from './components/FeeTypesData';
import ExpenseCategoriesData from './components/ExpenseCategoriesData';

const MasterDataManagement = ({ instituteId }) => {
  return (
    <>
      <Helmet>
        <title>Master Data Management - Vidya+</title>
        <meta name="description" content="Manage core master data for your institute." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold gradient-text">Master Data Management</h1>
        </div>
        <p className="text-gray-600">
          Manage core data types for your institute. This data will be used across different modules.
        </p>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="fee_types">Fee Types</TabsTrigger>
            <TabsTrigger value="expense_categories">Expense Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="courses">
            <CoursesData instituteId={instituteId} />
          </TabsContent>
          <TabsContent value="classes">
            <ClassesData instituteId={instituteId} />
          </TabsContent>
          <TabsContent value="subjects">
            <SubjectsData instituteId={instituteId} />
          </TabsContent>
           <TabsContent value="fee_types">
            <FeeTypesData instituteId={instituteId} />
          </TabsContent>
          <TabsContent value="expense_categories">
            <ExpenseCategoriesData instituteId={instituteId} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
};

export default MasterDataManagement;