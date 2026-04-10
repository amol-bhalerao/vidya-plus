import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, DollarSign, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';

const DashboardStats = () => {
    const user = useUser();
    const instituteId = user?.institute_id;
    const isSuperAdmin = user?.role === 'super_admin';
    const [stats, setStats] = useState({
        students: { value: 0, color: 'from-blue-500 to-blue-600', icon: Users, title: 'Total Students' },
        employees: { value: 0, color: 'from-green-500 to-green-600', icon: GraduationCap, title: 'Faculty Members' },
        revenue: { value: '₹0', color: 'from-purple-500 to-purple-600', icon: DollarSign, title: 'Today\'s Revenue' },
        courses: { value: 0, color: 'from-orange-500 to-orange-600', icon: BookOpen, title: 'Active Courses' },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            if (!instituteId && !isSuperAdmin) {
                setLoading(false);
                return;
            }
            try {
                const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

                // Fetch students count
                const studentsUrl = isSuperAdmin
                    ? `${apiBase}/students`
                    : `${apiBase}/students?institute_id=${instituteId}&status=active`;
                const studentsRes = await fetch(studentsUrl, { credentials: 'include' });
                const students = await studentsRes.json();
                setStats(prev => ({ ...prev, students: { ...prev.students, value: Array.isArray(students) ? students.length : 0 } }));

                // Fetch employees count
                const employeesUrl = isSuperAdmin
                    ? `${apiBase}/employees`
                    : `${apiBase}/employees?institute_id=${instituteId}`;
                const employeesRes = await fetch(employeesUrl, { credentials: 'include' });
                const employees = await employeesRes.json();
                setStats(prev => ({ ...prev, employees: { ...prev.employees, value: Array.isArray(employees) ? employees.length : 0 } }));

                // Fetch courses count
                const coursesUrl = isSuperAdmin
                    ? `${apiBase}/courses`
                    : `${apiBase}/courses?institute_id=${instituteId}`;
                const coursesRes = await fetch(coursesUrl, { credentials: 'include' });
                const courses = await coursesRes.json();
                setStats(prev => ({ ...prev, courses: { ...prev.courses, value: Array.isArray(courses) ? courses.length : 0 } }));

                // Fetch today's revenue
                const today = new Date().toISOString().split('T')[0];
                const revenueUrl = isSuperAdmin
                    ? `${apiBase}/fee_transactions?payment_date=${today}`
                    : `${apiBase}/fee_transactions?institute_id=${instituteId}&payment_date=${today}`;
                const revenueRes = await fetch(revenueUrl, { credentials: 'include' });
                const revenue = await revenueRes.json();
                const totalRevenue = Array.isArray(revenue) ? revenue.reduce((sum, t) => sum + (parseFloat(t.amount_paid) || 0), 0) : 0;
                setStats(prev => ({ ...prev, revenue: { ...prev.revenue, value: `₹${totalRevenue.toLocaleString()}` } }));
            } catch (e) {
                console.error('Error fetching dashboard stats:', e);
                setStats(prev => ({
                    ...prev,
                    students: { ...prev.students, value: 0 },
                    employees: { ...prev.employees, value: 0 },
                    courses: { ...prev.courses, value: 0 },
                    revenue: { ...prev.revenue, value: '₹0' }
                }));
            }
            setLoading(false);
        };
        fetchStats();
    }, [instituteId, isSuperAdmin]);

    const statItems = Object.values(stats);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statItems.map((stat, index) => (
                <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="card-hover bg-white/80 backdrop-blur-sm border-white/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                                <stat.icon className="w-4 h-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {stat.title === 'Today\'s Revenue' ? 'Collected Today' : 'Total Active'}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

export default DashboardStats;