import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const InstituteSelector = () => {
    const { instituteId, setInstituteId } = useUser();
    const [institutes, setInstitutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstitutes = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${apiBase}/institutes`, { credentials: 'include' });
                if (!res.ok) throw new Error(`Failed to fetch institutes: ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setInstitutes(list);
                if (list.length > 0 && !instituteId && setInstituteId) {
                    setInstituteId(String(list[0].id));
                }
            } catch (e) {
                console.error('Error fetching institutes:', e.message || e);
                setInstitutes([]);
            } finally {
                setLoading(false);
            }
        };
        fetchInstitutes();
    }, [instituteId, setInstituteId]);

    return (
        <div className="w-64">
            <Select onValueChange={setInstituteId} value={instituteId || ''} disabled={loading}>
                <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading institutes..." : "Select an institute"} />
                </SelectTrigger>
                <SelectContent>
                        {(institutes || []).map(inst => (
                            <SelectItem key={inst.id} value={String(inst.id)}>{inst.name}</SelectItem>
                        ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default InstituteSelector;