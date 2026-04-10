import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

const AdmissionStats = ({ inquiries }) => {
  const stats = {
    total: inquiries.length,
    approved: inquiries.filter(i => i.status === 'approved').length,
    rejected: inquiries.filter(i => i.status === 'rejected').length,
    pending: inquiries.filter(i => i.status === 'inquiry' || i.status === 'applied').length,
  };

  const statItems = [
    { title: 'Total Inquiries', value: stats.total, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    { title: 'Approved', value: stats.approved, icon: UserCheck, color: 'text-green-500', bgColor: 'bg-green-100' },
    { title: 'Rejected', value: stats.rejected, icon: UserX, color: 'text-red-500', bgColor: 'bg-red-100' },
    { title: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item, index) => (
        <Card key={index} className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdmissionStats;