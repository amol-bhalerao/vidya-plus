import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import QuestionBankManagement from './QuestionBankManagement';
import OnlineExamManagement from './OnlineExamManagement';
import EvaluateAnswers from './EvaluateAnswers';
import StudentExamList from './StudentExamList';

const OnlineExamDashboard = () => {
    const { instituteId, user } = useUser();
    const userRole = user?.role;

    return (
        <>
            <Helmet>
                <title>Online Examination - Vidya+</title>
                <meta name="description" content="Manage question banks, create online exams, and evaluate student submissions." />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Online Examination System</h1>
                    <p className="text-gray-600 mt-1">Your hub for creating, managing, and evaluating digital assessments.</p>
                </div>

                {!instituteId && (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Institute Selected</CardTitle>
                            <CardDescription>Please select an institute from the header to manage online exams.</CardDescription>
                        </CardHeader>
                    </Card>
                )}

                {instituteId && (
                    userRole === 'institute_admin' ? (
                        <Tabs defaultValue="question_bank" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="question_bank">Question Bank</TabsTrigger>
                                <TabsTrigger value="exam_management">Exam Management</TabsTrigger>
                                <TabsTrigger value="evaluation">Evaluate Answers</TabsTrigger>
                            </TabsList>
                            <TabsContent value="question_bank">
                                <QuestionBankManagement instituteId={instituteId} />
                            </TabsContent>
                            <TabsContent value="exam_management">
                                <OnlineExamManagement instituteId={instituteId} />
                            </TabsContent>
                             <TabsContent value="evaluation">
                                <EvaluateAnswers instituteId={instituteId} />
                            </TabsContent>
                        </Tabs>
                    ) : (
                         <StudentExamList instituteId={instituteId} />
                    )
                )}
            </motion.div>
        </>
    );
};

export default OnlineExamDashboard;