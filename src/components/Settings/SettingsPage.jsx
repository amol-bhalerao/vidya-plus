import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Sliders, Users } from 'lucide-react';
import InstituteProfile from '@/components/Settings/InstituteProfile';
import MasterDataSettings from '@/components/Settings/MasterDataSettings';
import UserManagement from '@/components/Settings/UserManagement';
import { useUser } from '@/contexts/UserContext';

const SettingsPage = () => {
  const { instituteId } = useUser();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="institute" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="institute"><Building className="mr-2 h-4 w-4" />Institute Profile</TabsTrigger>
          <TabsTrigger value="master-data" disabled={!instituteId}><Sliders className="mr-2 h-4 w-4" />Master Data</TabsTrigger>
          <TabsTrigger value="user-management"><Users className="mr-2 h-4 w-4" />User Management</TabsTrigger>
        </TabsList>
        <TabsContent value="institute">
          <InstituteProfile />
        </TabsContent>
        <TabsContent value="master-data">
          <MasterDataSettings />
        </TabsContent>
        <TabsContent value="user-management">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;