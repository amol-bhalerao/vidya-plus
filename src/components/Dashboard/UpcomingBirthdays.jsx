import React, { useState, useEffect, useCallback } from 'react';
import { Gift } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { format } from 'date-fns';

const UpcomingBirthdays = () => {
    const user = useUser();
    const instituteId = user?.institute_id;
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBirthdays = useCallback(async () => {
        if (!instituteId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const apiBase = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
            const res = await fetch(`${apiBase}/students?institute_id=${instituteId}&status=active`, { credentials: 'include' });
            const data = await res.json();
            if (Array.isArray(data)) {
                const today = new Date();
                const currentMonth = today.getMonth();
                const upcoming = data
                    .filter(s => s.date_of_birth)
                    .map(s => {
                        const dob = new Date(s.date_of_birth);
                        return { ...s, dob };
                    })
                    .filter(s => s.dob.getMonth() === currentMonth)
                    .sort((a,b) => a.dob.getDate() - b.dob.getDate());
                setBirthdays(upcoming);
            } else {
                setBirthdays([]);
            }
        } catch (e) {
            setBirthdays([]);
        }
        setLoading(false);
    }, [instituteId]);

    useEffect(() => {
        fetchBirthdays();
    }, [fetchBirthdays]);

    if (loading || birthdays.length === 0) return null;

    return (
        <div className="bg-pink-100/50 border border-pink-200 rounded-lg p-2 overflow-hidden mb-6">
            <div className="flex items-center whitespace-nowrap">
                <Gift className="w-5 h-5 text-pink-600 mr-2 flex-shrink-0"/>
                <marquee className="text-sm font-medium text-pink-800">
                    {birthdays.map(student => (
                        <span key={student.id} className="mx-4">
                            Happy Birthday, <strong>{student.full_name}</strong>! ({format(student.dob, 'dd MMM')})
                        </span>
                    ))}
                </marquee>
            </div>
        </div>
    )
}

export default UpcomingBirthdays;