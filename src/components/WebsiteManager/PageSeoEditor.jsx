import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const defaultSeo = {
  title: '',
  description: '',
  ogImage: '',
  canonicalUrl: '',
  noindex: false,
};

const PageSeoEditor = ({ currentInstituteId, pageSlug, fetchJson }) => {
  const [seo, setSeo] = useState(defaultSeo);

  const loadSeo = async () => {
    if (!currentInstituteId || !pageSlug) {
      return;
    }
    const payload = await fetchJson(`website/content?institute_id=${encodeURIComponent(currentInstituteId)}&page=${encodeURIComponent(pageSlug)}&section=seo`, { method: 'GET' });
    const incoming = payload?.content || {};
    setSeo({
      title: incoming.title || '',
      description: incoming.description || '',
      ogImage: incoming.ogImage || '',
      canonicalUrl: incoming.canonicalUrl || '',
      noindex: Boolean(incoming.noindex),
    });
  };

  const saveSeo = async () => {
    if (!currentInstituteId || !pageSlug) {
      return;
    }
    await fetchJson('website/content', {
      method: 'POST',
      body: JSON.stringify({
        institute_id: currentInstituteId,
        page: pageSlug,
        section: 'seo',
        content: seo,
      }),
    });
  };

  useEffect(() => {
    loadSeo();
  }, [currentInstituteId, pageSlug]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page SEO Controls</CardTitle>
        <CardDescription>Set title, meta description, OG image, canonical URL, and noindex flags for this page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="seo-title">Meta Title</Label>
          <Input id="seo-title" value={seo.title} onChange={(e) => setSeo((prev) => ({ ...prev, title: e.target.value }))} placeholder="Page title for search engines" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="seo-description">Meta Description</Label>
          <Textarea id="seo-description" value={seo.description} onChange={(e) => setSeo((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description for search snippets" className="min-h-[90px]" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="seo-og-image">OG Image URL</Label>
          <Input id="seo-og-image" value={seo.ogImage} onChange={(e) => setSeo((prev) => ({ ...prev, ogImage: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="seo-canonical">Canonical URL</Label>
          <Input id="seo-canonical" value={seo.canonicalUrl} onChange={(e) => setSeo((prev) => ({ ...prev, canonicalUrl: e.target.value }))} placeholder="https://yourdomain.com/page" />
        </div>
        <label htmlFor="seo-noindex" className="inline-flex items-center gap-2 text-sm">
          <input
            id="seo-noindex"
            type="checkbox"
            checked={seo.noindex}
            onChange={(e) => setSeo((prev) => ({ ...prev, noindex: e.target.checked }))}
          />
          Prevent indexing for this page
        </label>
        <div className="flex gap-2">
          <Button onClick={saveSeo}>Save SEO</Button>
          <Button variant="outline" onClick={loadSeo}>Reload SEO</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PageSeoEditor;
