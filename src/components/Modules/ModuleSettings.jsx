import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { API_BASE } from '@/lib/constants';

const ModuleSettings = ({ instituteId, menuItems, isSuperAdmin }) => {
  const { user } = useUser();
  const [moduleVisibility, setModuleVisibility] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      if (!instituteId) {
        setLoading(false);
        const allOn = menuItems.reduce((acc, item) => ({...acc, [item.id]: true}), {});
        setModuleVisibility(allOn);
        return;
      };

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/settings/module-settings?institute_id=${encodeURIComponent(instituteId)}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        
        const initialSettings = menuItems.reduce((acc, item) => {
          acc[item.id] = true;
          return acc;
        }, {});

        if (res.ok && data && data.settings) {
          setModuleVisibility({ ...initialSettings, ...data.settings });
        } else {
          setModuleVisibility(initialSettings);
        }
      } catch (error) {
        console.error("Error fetching module settings:", error);
        const initialSettings = menuItems.reduce((acc, item) => {
          acc[item.id] = true;
          return acc;
        }, {});
        setModuleVisibility(initialSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [instituteId, menuItems, API_BASE]);
  
  const handleVisibilityChange = (moduleId, isVisible) => {
    if (isSuperAdmin) {
        toast({ title: "Read-only", description: "Super Admin view is read-only.", variant: "default" });
        return;
    }
    setModuleVisibility(prev => ({ ...prev, [moduleId]: isVisible }));
  };

  const handleSaveChanges = async () => {
    if (isSuperAdmin) {
        toast({ title: "Read-only", description: "Super Admin view is read-only.", variant: "default" });
        return;
    }
    
    if (!instituteId) {
      toast({ title: "Error", description: "Institute ID not found.", variant: "destructive" });
      return;
    }
    
    if (user?.role !== 'institute_admin') {
      toast({ title: "Permission Denied", description: "You do not have permission to change these settings.", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings/module-settings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institute_id: instituteId, settings: moduleVisibility })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "Settings Saved!", description: "Module visibility has been updated. Please refresh for changes to take effect." });
      } else {
        toast({ title: "Save Failed", description: data.error || 'Failed to save settings', variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving module settings:", error);
      toast({ title: "Save Failed", description: 'Network error occurred', variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  
  if (!instituteId && !isSuperAdmin) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Module Visibility</CardTitle>
            </CardHeader>
            <CardContent><p>Settings not available. You are not linked to an institute.</p></CardContent>
        </Card>
      );
  }

  if (loading && instituteId) {
    return <p>Loading settings...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Visibility</CardTitle>
        <CardDescription>Control which modules are visible to users in this institute.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems
            .map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <Label htmlFor={item.id} className="text-base font-medium">{item.label}</Label>
              <Switch
                id={item.id}
                checked={moduleVisibility[item.id] !== false}
                onCheckedChange={(checked) => handleVisibilityChange(item.id, checked)}
                disabled={isSuperAdmin}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-6 mt-4 border-t">
          <Button onClick={handleSaveChanges} disabled={saving || isSuperAdmin}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleSettings;