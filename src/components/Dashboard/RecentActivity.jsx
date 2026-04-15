import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, DollarSign, FileUp, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';


const RecentActivity = () => {
  const { instituteId } = useUser();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

     const iconMap = {
        fee_collection: { icon: DollarSign, color: 'bg-green-500' },
        student_admission: { icon: User, color: 'bg-blue-500' },
        admission_inquiry: { icon: User, color: 'bg-blue-500' },
        expense_payment: { icon: DollarSign, color: 'bg-red-500' },
        bulk_upload: { icon: FileUp, color: 'bg-purple-500' },
    };

  const fetchAll = useCallback(async () => {
    if (!instituteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  const res = await fetch(`${apiBase}/general_ledger?institute_id=${instituteId}`, { credentials: 'include' });
      const data = await res.json();
      setActivities(Array.isArray(data) ? data.filter(a => ['fee_collection','student_admission','expense_payment'].includes(a.transaction_type)).sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,10) : []);
    } catch (e) {
      setActivities([]);
    }
    setLoading(false);
  }, [instituteId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);


  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
          <ScrollArea className="h-[calc(100vh_-_300px)]">
            {loading && <p>Loading activities...</p>}
            {!loading && activities.length === 0 && <p className="text-sm text-gray-500">No recent activity to display.</p>}
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const ActivityIcon = iconMap[activity.transaction_type] ? iconMap[activity.transaction_type].icon : Clock;
                const color = iconMap[activity.transaction_type] ? iconMap[activity.transaction_type].color : 'bg-gray-500';

                return (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                    <div className={`p-2 rounded-full ${color}`}>
                        <ActivityIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                        {activity.account}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                        {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                    </div>
                    </motion.div>
                )
              })}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;