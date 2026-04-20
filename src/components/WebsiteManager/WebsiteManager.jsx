import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VisualMenuBuilder from '@/components/WebsiteManager/VisualMenuBuilder';
import PageSeoEditor from '@/components/WebsiteManager/PageSeoEditor';
import PageBlockBuilder from '@/components/WebsiteManager/PageBlockBuilder';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const WebsiteManager = () => {
  const { user, instituteId, isSuperAdmin } = useUser();
  const { toast } = useToast();

  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');

  const [page, setPage] = useState('home');
  const [section, setSection] = useState('main');
  const [contentJson, setContentJson] = useState('{}');

  const [carousel, setCarousel] = useState([]);
  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [team, setTeam] = useState([]);

  const [carouselForm, setCarouselForm] = useState({ title: '', image_url: '', sort_order: 0 });
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', image_url: '' });
  const [galleryForm, setGalleryForm] = useState({ title: '', image_url: '' });
  const [teamForm, setTeamForm] = useState({ name: '', designation: '', image_url: '' });
  const [selectedPageSlug, setSelectedPageSlug] = useState('home');
  const [pageDraft, setPageDraft] = useState({ title: '', text: '' });
  const [menuPageSlugs, setMenuPageSlugs] = useState(['home', 'about', 'academics', 'admissions', 'gallery', 'contact']);

  const currentInstituteId = useMemo(() => {
    if (isSuperAdmin) {
      return selectedInstitute || '';
    }
    return String(instituteId || user?.institute_id || '1');
  }, [isSuperAdmin, selectedInstitute, instituteId, user]);

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  };

  const loadCollections = async (institute) => {
    if (!institute) {
      return;
    }
    try {
      const [carouselRows, eventRows, galleryRows, teamRows] = await Promise.all([
        fetchJson(`${API_BASE}/website/carousel?institute_id=${encodeURIComponent(institute)}`).catch(() => []),
        fetchJson(`${API_BASE}/website/events?institute_id=${encodeURIComponent(institute)}`).catch(() => []),
        fetchJson(`${API_BASE}/website/gallery?institute_id=${encodeURIComponent(institute)}`).catch(() => []),
        fetchJson(`${API_BASE}/website/team?institute_id=${encodeURIComponent(institute)}`).catch(() => []),
      ]);

      setCarousel(Array.isArray(carouselRows) ? carouselRows : []);
      setEvents(Array.isArray(eventRows) ? eventRows : []);
      setGallery(Array.isArray(galleryRows) ? galleryRows : []);
      setTeam(Array.isArray(teamRows) ? teamRows : []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Load failed', description: error.message });
    }
  };

  const loadSection = async () => {
    if (!currentInstituteId) {
      return;
    }

    try {
      const payload = await fetchJson(`${API_BASE}/website/content?institute_id=${encodeURIComponent(currentInstituteId)}&page=${encodeURIComponent(page)}&section=${encodeURIComponent(section)}`);
      const content = payload?.content ?? {};
      setContentJson(JSON.stringify(content, null, 2));
    } catch (error) {
      setContentJson('{}');
      toast({ variant: 'destructive', title: 'Section fetch failed', description: error.message });
    }
  };

  const pathToSlug = (path = '/home') => {
    const normalized = String(path || '/home').trim();
    const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
    const trimmed = withSlash.replace(/^\/+|\/+$/g, '');
    return (trimmed.split('/')[0] || 'home').toLowerCase();
  };

  const extractMenuSlugs = (menuRows) => {
    const slugs = new Set(['home']);
    const walk = (rows) => {
      rows.forEach((row) => {
        slugs.add(pathToSlug(row.path));
        if (Array.isArray(row.children) && row.children.length > 0) {
          walk(row.children);
        }
      });
    };
    walk(Array.isArray(menuRows) ? menuRows : []);
    return Array.from(slugs).filter(Boolean);
  };

  const loadMenuSlugs = async () => {
    if (!currentInstituteId) {
      return;
    }
    try {
      const payload = await fetchJson(`${API_BASE}/website/content?institute_id=${encodeURIComponent(currentInstituteId)}&page=global&section=menu`);
      const slugs = extractMenuSlugs(payload?.content || []);
      setMenuPageSlugs(slugs.length > 0 ? slugs : ['home']);
      if (!slugs.includes(selectedPageSlug)) {
        setSelectedPageSlug(slugs[0] || 'home');
      }
    } catch {
      setMenuPageSlugs(['home', 'about', 'academics', 'admissions', 'gallery', 'contact']);
    }
  };

  const loadPageDraft = async (slug) => {
    if (!currentInstituteId || !slug) {
      return;
    }
    try {
      const payload = await fetchJson(`${API_BASE}/website/content?institute_id=${encodeURIComponent(currentInstituteId)}&page=${encodeURIComponent(slug)}&section=main`);
      const content = payload?.content || {};
      setPageDraft({
        title: content.title || '',
        text: content.text || '',
      });
    } catch (error) {
      setPageDraft({ title: '', text: '' });
      toast({ variant: 'destructive', title: 'Page load failed', description: error.message });
    }
  };

  const savePageDraft = async () => {
    if (!currentInstituteId || !selectedPageSlug) {
      return;
    }
    try {
      await fetchJson(`${API_BASE}/website/content`, {
        method: 'POST',
        body: JSON.stringify({
          institute_id: currentInstituteId,
          page: selectedPageSlug,
          section: 'main',
          content: {
            title: pageDraft.title,
            text: pageDraft.text,
          },
        }),
      });
      toast({ title: 'Page Saved', description: `${selectedPageSlug} content updated.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Page save failed', description: error.message });
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isSuperAdmin) {
        try {
          const rows = await fetchJson(`${API_BASE}/institutes`);
          setInstitutes(Array.isArray(rows) ? rows : []);
          if (Array.isArray(rows) && rows.length > 0 && !selectedInstitute) {
            setSelectedInstitute(String(rows[0].id));
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Institute fetch failed', description: error.message });
        }
      }
    };

    init();
  }, [isSuperAdmin]);

  useEffect(() => {
    loadSection();
  }, [currentInstituteId, page, section]);

  useEffect(() => {
    loadCollections(currentInstituteId);
  }, [currentInstituteId]);

  useEffect(() => {
    loadPageDraft(selectedPageSlug);
  }, [currentInstituteId, selectedPageSlug]);

  useEffect(() => {
    loadMenuSlugs();
  }, [currentInstituteId]);

  const saveSection = async () => {
    if (!currentInstituteId) {
      return;
    }
    try {
      const parsed = JSON.parse(contentJson);
      await fetchJson(`${API_BASE}/website/content`, {
        method: 'POST',
        body: JSON.stringify({
          institute_id: currentInstituteId,
          page,
          section,
          content: parsed,
        }),
      });
      toast({ title: 'Saved', description: `Updated ${page}/${section}` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
    }
  };

  const addCarouselItem = async () => {
    if (!currentInstituteId || !carouselForm.image_url) {
      return;
    }
    try {
      await fetchJson(`${API_BASE}/website/carousel`, {
        method: 'POST',
        body: JSON.stringify({ institute_id: currentInstituteId, ...carouselForm }),
      });
      setCarouselForm({ title: '', image_url: '', sort_order: 0 });
      await loadCollections(currentInstituteId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Carousel save failed', description: error.message });
    }
  };

  const addEvent = async () => {
    if (!currentInstituteId || !eventForm.title) {
      return;
    }
    try {
      await fetchJson(`${API_BASE}/website/events`, {
        method: 'POST',
        body: JSON.stringify({ institute_id: currentInstituteId, ...eventForm }),
      });
      setEventForm({ title: '', description: '', date: '', image_url: '' });
      await loadCollections(currentInstituteId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Event save failed', description: error.message });
    }
  };

  const addGallery = async () => {
    if (!currentInstituteId || !galleryForm.image_url) {
      return;
    }
    try {
      await fetchJson(`${API_BASE}/website/gallery`, {
        method: 'POST',
        body: JSON.stringify({ institute_id: currentInstituteId, ...galleryForm }),
      });
      setGalleryForm({ title: '', image_url: '' });
      await loadCollections(currentInstituteId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gallery save failed', description: error.message });
    }
  };

  const addTeamMember = async () => {
    if (!currentInstituteId || !teamForm.name) {
      return;
    }
    try {
      await fetchJson(`${API_BASE}/website/team`, {
        method: 'POST',
        body: JSON.stringify({ institute_id: currentInstituteId, ...teamForm }),
      });
      setTeamForm({ name: '', designation: '', image_url: '' });
      await loadCollections(currentInstituteId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Team save failed', description: error.message });
    }
  };

  const removeItem = async (endpoint, id) => {
    try {
      await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `id=${encodeURIComponent(id)}`,
      });
      await loadCollections(currentInstituteId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
    }
  };

  const loadTemplate = async () => {
    if (!currentInstituteId) {
      return;
    }

    const templateEntries = [
      {
        page: 'global',
        section: 'menu',
        content: [
          { label: 'Home', path: '/home' },
          { label: 'About', path: '/about' },
          { label: 'Admissions', path: '/admissions' },
          { label: 'Academics', path: '/academics' },
          { label: 'Gallery', path: '/gallery' },
          { label: 'Contact', path: '/contact' },
        ],
      },
      {
        page: 'global',
        section: 'announcements',
        content: {
          items: [
            'Admissions are open for 2026-27.',
            'Scholarship assistance available for eligible students.',
            'Visit campus for counseling and program guidance.',
          ],
        },
      },
      {
        page: 'home',
        section: 'main',
        content: {
          badge: 'NAAC Accredited Institution',
          headline: 'Empowering Futures Through Knowledge, Research, and Character',
          subheadline: 'A professional, student-first campus where academics, culture, and career development move together.',
          ctaPrimary: 'Start Admission Inquiry',
          ctaSecondary: 'Explore Programs',
        },
      },
      {
        page: 'home',
        section: 'highlights',
        content: [
          { title: 'Industry-Aligned Curriculum', description: 'Course structure updated with practical and employability focus.' },
          { title: 'Experienced Faculty', description: 'Dedicated mentors guiding students across disciplines.' },
          { title: 'Research & Innovation Culture', description: 'Project-based learning with seminars and competitions.' },
        ],
      },
      {
        page: 'home',
        section: 'programs',
        content: [
          { title: 'Arts & Humanities', description: 'Strong foundation in languages, social sciences, and communication.' },
          { title: 'Science Stream', description: 'Lab-intensive science education with strong conceptual learning.' },
          { title: 'Career Readiness', description: 'Soft skills, internships, and placement support for final-year students.' },
        ],
      },
      {
        page: 'home',
        section: 'stats',
        content: [
          { label: 'Students', value: 3500, suffix: '+' },
          { label: 'Faculty Members', value: 120, suffix: '+' },
          { label: 'Programs', value: 18, suffix: '' },
          { label: 'Placement Support', value: 95, suffix: '%' },
        ],
      },
      {
        page: 'home',
        section: 'testimonials',
        content: [
          { name: 'Aditi Patil', role: 'B.Sc Graduate', quote: 'The faculty support and practical sessions prepared me for postgraduate studies with confidence.' },
          { name: 'Rahul Deshmukh', role: 'B.A Student', quote: 'Campus activities and mentoring helped me improve communication and leadership skills.' },
        ],
      },
      {
        page: 'home',
        section: 'admissions_cta',
        content: {
          title: 'Admissions 2026-27 Are Open',
          text: 'Apply online, upload documents, and track your admission status from the portal.',
          button: 'Apply Now',
        },
      },
      { page: 'about', section: 'main', content: { title: 'About Our Institution', text: 'Update this content from Website Manager > Content tab.' } },
      { page: 'admissions', section: 'main', content: { title: 'Admissions Open', text: 'Manage forms, deadlines, and notices dynamically from admin.' } },
      { page: 'academics', section: 'main', content: { title: 'Academics & Departments', text: 'Show department highlights, outcomes, and achievements.' } },
      { page: 'contact', section: 'main', content: { title: 'Contact Us', text: 'Update phone, email, and office hours via admin panel.' } },
      { page: 'global', section: 'footer', content: { note: 'Committed to quality education and student success.' } },
      {
        page: 'home',
        section: 'birthdays',
        content: [
          { name: 'Student Name', role: 'B.Sc. Student', image_url: 'https://placehold.co/180x180/png?text=Student' },
          { name: 'Faculty Name', role: 'Professor', image_url: 'https://placehold.co/180x180/png?text=Faculty' },
        ],
      },
    ];

    try {
      await Promise.all(templateEntries.map((entry) => fetchJson(`${API_BASE}/website/content`, {
        method: 'POST',
        body: JSON.stringify({
          institute_id: currentInstituteId,
          page: entry.page,
          section: entry.section,
          content: entry.content,
        }),
      })));

      toast({ title: 'Template loaded', description: 'Default website template content has been added.' });
      await loadSection();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Template failed', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Website Manager</CardTitle>
          <CardDescription>Manage public website pages, menus, carousel, events, birthdays, and gallery content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>Institute</Label>
              <Select value={selectedInstitute} onValueChange={setSelectedInstitute}>
                <SelectTrigger className="max-w-md"><SelectValue placeholder="Select institute" /></SelectTrigger>
                <SelectContent>
                  {institutes.map((inst) => (
                    <SelectItem key={inst.id} value={String(inst.id)}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={loadTemplate} variant="outline">Load Beautiful Template</Button>
            <Button asChild className="bg-[#1e5162] hover:bg-[#173f4c]"><a href="/home" target="_blank" rel="noreferrer">Preview Website</a></Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="carousel">Carousel</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="navigation">
          <VisualMenuBuilder
            currentInstituteId={currentInstituteId}
            fetchJson={(url, options = {}) => fetchJson(`${API_BASE}/${url}`, options)}
            onSaved={() => {
              toast({ title: 'Navigation Saved', description: 'Navbar menu and dynamic route bindings were updated.' });
            }}
          />
        </TabsContent>

        <TabsContent value="pages">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Page Development</CardTitle>
                <CardDescription>
                  Build pages with simple controls. Slugs are automatically derived from Navigation tab routes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Pick Existing Page</Label>
                    <Select value={selectedPageSlug} onValueChange={setSelectedPageSlug}>
                      <SelectTrigger><SelectValue placeholder="Select page slug" /></SelectTrigger>
                      <SelectContent>
                        {menuPageSlugs.map((slug) => (
                          <SelectItem key={slug} value={slug}>{slug}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Slug (optional)</Label>
                    <Input
                      value={selectedPageSlug}
                      onChange={(e) => setSelectedPageSlug(pathToSlug(e.target.value))}
                      placeholder="services / digital-marketing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={pageDraft.title}
                      onChange={(e) => setPageDraft((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Page title"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description / Body</Label>
                  <Textarea
                    value={pageDraft.text}
                    onChange={(e) => setPageDraft((prev) => ({ ...prev, text: e.target.value }))}
                    className="min-h-[220px]"
                    placeholder="Page details"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePageDraft}>Save Page</Button>
                  <Button variant="outline" onClick={() => loadPageDraft(selectedPageSlug)}>Reload Page</Button>
                  <Button variant="outline" onClick={loadMenuSlugs}>Refresh Slugs</Button>
                </div>
              </CardContent>
            </Card>

            <PageSeoEditor
              currentInstituteId={currentInstituteId}
              pageSlug={selectedPageSlug}
              fetchJson={(url, options = {}) => fetchJson(`${API_BASE}/${url}`, options)}
            />

            <PageBlockBuilder
              currentInstituteId={currentInstituteId}
              pageSlug={selectedPageSlug}
              fetchJson={(url, options = {}) => fetchJson(`${API_BASE}/${url}`, options)}
            />
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Page/Section JSON Editor</CardTitle>
              <CardDescription>Every section is saved as JSON, allowing dynamic website rendering and nested menu/sub-menu support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Page</Label>
                  <Select value={page} onValueChange={setPage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['global', 'home', 'about', 'admissions', 'academics', 'contact'].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="main / menu / announcements / highlights / programs / stats / testimonials / admissions_cta / footer / birthdays" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>JSON Content</Label>
                <Textarea value={contentJson} onChange={(e) => setContentJson(e.target.value)} className="min-h-[280px] font-mono text-xs" />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveSection}>Save Section</Button>
                <Button variant="outline" onClick={loadSection}>Reload Section</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carousel">
          <Card>
            <CardHeader><CardTitle>Homepage Carousel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input placeholder="Slide title" value={carouselForm.title} onChange={(e) => setCarouselForm((prev) => ({ ...prev, title: e.target.value }))} />
                <Input placeholder="Image URL" value={carouselForm.image_url} onChange={(e) => setCarouselForm((prev) => ({ ...prev, image_url: e.target.value }))} />
                <Input type="number" placeholder="Sort order" value={carouselForm.sort_order} onChange={(e) => setCarouselForm((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))} />
              </div>
              <Button onClick={addCarouselItem}>Add Slide</Button>
              <div className="space-y-2">
                {carousel.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{item.title || 'Untitled slide'}</span>
                    <Button variant="destructive" size="sm" onClick={() => removeItem('/website/carousel', item.id)}>Delete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader><CardTitle>News & Events</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Event title" value={eventForm.title} onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))} />
                <Input placeholder="Event date (YYYY-MM-DD)" value={eventForm.date} onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))} />
                <Input placeholder="Image URL" value={eventForm.image_url} onChange={(e) => setEventForm((prev) => ({ ...prev, image_url: e.target.value }))} className="md:col-span-2" />
                <Textarea placeholder="Description" value={eventForm.description} onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))} className="md:col-span-2" />
              </div>
              <Button onClick={addEvent}>Add Event</Button>
              <div className="space-y-2">
                {events.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{item.title}</span>
                    <Button variant="destructive" size="sm" onClick={() => removeItem('/website/events', item.id)}>Delete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader><CardTitle>Animated Gallery</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Image title" value={galleryForm.title} onChange={(e) => setGalleryForm((prev) => ({ ...prev, title: e.target.value }))} />
                <Input placeholder="Image URL" value={galleryForm.image_url} onChange={(e) => setGalleryForm((prev) => ({ ...prev, image_url: e.target.value }))} />
              </div>
              <Button onClick={addGallery}>Add Gallery Image</Button>
              <div className="space-y-2">
                {gallery.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{item.title || item.image_url}</span>
                    <Button variant="destructive" size="sm" onClick={() => removeItem('/website/gallery', item.id)}>Delete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader><CardTitle>Birthday/People Cards</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input placeholder="Name" value={teamForm.name} onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))} />
                <Input placeholder="Designation" value={teamForm.designation} onChange={(e) => setTeamForm((prev) => ({ ...prev, designation: e.target.value }))} />
                <Input placeholder="Image URL" value={teamForm.image_url} onChange={(e) => setTeamForm((prev) => ({ ...prev, image_url: e.target.value }))} />
              </div>
              <Button onClick={addTeamMember}>Add Person</Button>
              <div className="space-y-2">
                {team.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{item.name} - {item.designation}</span>
                    <Button variant="destructive" size="sm" onClick={() => removeItem('/website/team', item.id)}>Delete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebsiteManager;
