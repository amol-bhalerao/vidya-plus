import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, DollarSign, ListTodo, FileText, PlusCircle, Globe, Settings, BarChart, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AdmissionForm from '@/components/Admission/AdmissionForm';
import { useUser } from '@/contexts/UserContext';

const QuickActions = () => {
  const navigate = useNavigate();
  const { instituteId } = useUser();
  const [isAdmissionFormOpen, setIsAdmissionFormOpen] = useState(false);

  const actions = [
    { name: 'New Inquiry', icon: <UserPlus className="h-5 w-5" />, action: () => setIsAdmissionFormOpen(true) },
    { name: 'Collect Fee', icon: <DollarSign className="h-5 w-5" />, path: '/admin/finance/collect' },
    { name: 'Attendance', icon: <ListTodo className="h-5 w-5" />, path: '/admin/attendance' },
    { name: 'Website', icon: <Globe className="h-5 w-5" />, path: '/admin/website' },
    { name: 'Exams', icon: <PlusCircle className="h-5 w-5" />, path: '/admin/examination' },
    { name: 'Students', icon: <Users className="h-5 w-5" />, path: '/admin/students' },
    { name: 'Documents', icon: <FileText className="h-5 w-5" />, path: '/admin/documents' },
    { name: 'Reports', icon: <BarChart className="h-5 w-5" />, path: '/admin/students' }, // Assuming reports are in student mgmt
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/admin/settings' },
  ];

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {actions.map((action) => (
              <Button
                key={action.name}
                variant="outline"
                className="flex-col h-24 text-center p-2 transition-all duration-300 ease-in-out hover:bg-primary/10 hover:text-primary"
                onClick={() => action.path ? navigate(action.path) : action.action()}
              >
                {action.icon}
                <span className="mt-1 text-xs font-medium text-center">{action.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAdmissionFormOpen} onOpenChange={setIsAdmissionFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Admission Inquiry</DialogTitle>
            <DialogDescription>Fill in the details for the new inquiry.</DialogDescription>
          </DialogHeader>
          <AdmissionForm instituteId={instituteId} onSuccess={() => setIsAdmissionFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickActions;