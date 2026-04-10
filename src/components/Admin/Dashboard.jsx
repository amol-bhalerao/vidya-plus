import React from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import RecentActivity from '@/components/Dashboard/RecentActivity';
import QuickActions from '@/components/Dashboard/QuickActions';
import UpcomingBirthdays from '@/components/Dashboard/UpcomingBirthdays';

const Dashboard = () => {
    const user = useUser();

    return (
        <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">
                        Welcome back, {user?.full_name || user?.email}!
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Here's what's happening at your institution today.
                    </p>
                </div>
            </div>

            <UpcomingBirthdays />
            <DashboardStats />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <QuickActions />
                </div>
                <div className="lg:col-span-2">
                    <RecentActivity />
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
