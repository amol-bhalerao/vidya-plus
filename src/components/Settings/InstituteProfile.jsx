import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Building, PlusCircle, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useDropzone } from 'react-dropzone';
import { useUser } from '@/contexts/UserContext';

const InstituteProfile = () => {
  const { toast } = useToast();
  const { user, instituteId, isSuperAdmin, selectInstitute } = useUser();
  
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInstituteName, setNewInstituteName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
      const file = acceptedFiles[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
      onDrop,
      accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif'] },
      multiple: false,
  });

  const fetchProfile = useCallback(async () => {
    if (!instituteId) {
      setLoading(false);
      setProfile({});
      setLogoPreview(null);
      return;
    }
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/institutes/${instituteId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status !== 404) {
          toast({ variant: 'destructive', title: 'Error fetching profile', description: 'Failed to load institute profile' });
        }
        setProfile({});
      } else {
        const data = await response.json();
        setProfile(data);
        setLogoPreview(data?.logo_url);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching profile', description: 'Network error occurred' });
      setProfile({});
    }
    setLoading(false);
  }, [instituteId, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  useEffect(() => {
    return () => {
      if (logoPreview && logoFile) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview, logoFile]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleNewInstituteNameChange = useCallback((e) => {
    setNewInstituteName(e.target.value);
  }, []);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Handle logo upload (simplified placeholder for now)
      let uploadedLogoUrl = profile.logo_url;
      if (logoFile) {
        // For file uploads, we need to use FormData
        const formData = new FormData();
        formData.append('logo', logoFile);
        formData.append('institute_id', instituteId);
        
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
        const uploadResponse = await fetch(`${apiBase}/upload-institute-logo`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Failed to upload logo');
        }
        uploadedLogoUrl = uploadResult.logo_url;
      }

      const { id, created_at, ...updateData } = profile;
      const finalUpdateData = { ...updateData, logo_url: uploadedLogoUrl };

      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/institutes/${instituteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(finalUpdateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      toast({ title: 'Success!', description: 'Institute profile updated.' });
      setProfile(prev => ({...prev, logo_url: uploadedLogoUrl}));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving profile', description: error.message });
    }
    setSaving(false);
  };

  const handleCreateInstitute = async () => {
    if (!newInstituteName.trim()) {
        toast({ title: "Name required", description: "Please enter a name for the new institute.", variant: "destructive" });
        return;
    }
    setSaving(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/institutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newInstituteName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create institute');
      }

      const data = await response.json();
      toast({ title: 'Success!', description: `Institute '${newInstituteName}' created.` });
      setIsCreateOpen(false);
      setNewInstituteName('');
      if (isSuperAdmin && selectInstitute) {
        await selectInstitute(data.id);
      }
      await fetchProfile();
    } catch (error) {
      toast({ title: 'Error creating institute', description: error.message, variant: 'destructive' });
    }
    setSaving(false);
  }

  const CreateInstituteDialog = useMemo(() => (
    <Dialog key="create-institute-dialog" open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add New Institute</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Institute</DialogTitle>
          <DialogDescription>Enter the name for the new institute to add it to the system.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-institute-name">Institute Name</Label>
          <Input
            id="new-institute-name"
            value={newInstituteName}
            onChange={handleNewInstituteNameChange}
            autoFocus
            placeholder="Enter institute name"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateInstitute} disabled={saving}>{saving ? "Creating..." : "Create Institute"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ), [isCreateOpen, newInstituteName, saving, handleCreateInstitute, handleNewInstituteNameChange]);
  
  if (loading) {
    return <p>Loading institute profile...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Institute Profile</CardTitle>
                <CardDescription>View and update your institute's information. {isSuperAdmin && 'Select an institute to manage it.'}</CardDescription>
            </div>
            {isSuperAdmin && CreateInstituteDialog}
        </div>
      </CardHeader>
      <CardContent>
        {!instituteId ? (
            <div className="text-center py-10">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{isSuperAdmin ? 'No Institute Selected' : 'No Institute Assigned'}</h3>
                <p className="mt-1 text-sm text-gray-500">{isSuperAdmin ? 'Please select an institute from the top-right dropdown, or create a new one.' : 'Please contact a super admin to be assigned to an institute.'}</p>
                 {isSuperAdmin && (
                    <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create First Institute
                    </Button>
                )}
            </div>
        ) : (
            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <fieldset disabled={saving} className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-40 h-40 border rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                        <p className="text-xs text-gray-500 text-center">No Logo</p>
                    )}
                </div>
                <div className="flex-1 space-y-2">
                    <Label>Institute Logo</Label>
                    <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50">
                        <input {...getInputProps()} />
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Drag 'n' drop a logo here, or click to select a file</p>
                    </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Institute Name</Label>
                  <Input id="name" name="name" value={profile.name || ''} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="udise_code">UDISE Code</Label>
                  <Input id="udise_code" name="udise_code" value={profile.udise_code || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" value={profile.address || ''} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label htmlFor="receipt_header">Receipt Header (HTML allowed)</Label>
                  <Textarea id="receipt_header" name="receipt_header" value={profile.receipt_header || ''} onChange={handleChange} placeholder="<h1 style='font-size:20px'>Your Institute</h1><p>Address Line</p>"/>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="receipt_footer">Receipt Footer (HTML allowed)</Label>
                  <Textarea id="receipt_footer" name="receipt_footer" value={profile.receipt_footer || ''} onChange={handleChange} placeholder="<p style='font-size:10px'>Fees once paid are not refundable.</p>"/>
                </div>
              </div>
              </fieldset>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
        )}
      </CardContent>
    </Card>
  );
};

export default InstituteProfile;