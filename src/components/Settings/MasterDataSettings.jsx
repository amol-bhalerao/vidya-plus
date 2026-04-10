import React from 'react';
import MasterDataManagementTabs from '../MasterData/MasterDataManagement';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';

const MasterDataSettings = () => {
    const { user } = useUser();
    const instituteId = user?.institute_id;
    const isSuperAdmin = user?.role === 'super_admin';

    if (!instituteId) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Master Data Settings</CardTitle>
                    <CardDescription>
                        {isSuperAdmin ? 'Please select an institute to manage its master data.' : 'You are not assigned to an institute.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-center text-gray-500 py-8">
                        {isSuperAdmin ? 'Select an institute from the dropdown in the header to continue.' : 'Please contact a Super Admin for assistance.'}
                    </p>
                </CardContent>
            </Card>
        );
    }
    
  return (
    <div className="space-y-4">
        <MasterDataManagementTabs instituteId={instituteId} />
    </div>
  );
};

export default MasterDataSettings;