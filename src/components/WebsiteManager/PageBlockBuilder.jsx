import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const makeBlock = (type) => {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  if (type === 'hero') {
    return { id, type, data: { title: 'Hero Title', subtitle: 'Hero subtitle text', ctaText: 'Learn More', ctaLink: '/contact', backgroundImage: '' } };
  }
  if (type === 'cards') {
    return { id, type, data: { sectionTitle: 'Cards Section', items: [{ title: 'Card One', text: 'Card description.' }] } };
  }
  if (type === 'stats') {
    return { id, type, data: { sectionTitle: 'Key Stats', items: [{ label: 'Students', value: '3500', suffix: '+' }] } };
  }
  return { id, type: 'gallery', data: { sectionTitle: 'Gallery', images: [{ url: 'https://placehold.co/900x700/png?text=Gallery', caption: 'Campus View' }] } };
};

const PageBlockBuilder = ({ currentInstituteId, pageSlug, fetchJson }) => {
  const [blocks, setBlocks] = useState([]);
  const [newType, setNewType] = useState('hero');

  const loadBlocks = async () => {
    if (!currentInstituteId || !pageSlug) {
      return;
    }
    const payload = await fetchJson(`website/content?institute_id=${encodeURIComponent(currentInstituteId)}&page=${encodeURIComponent(pageSlug)}&section=blocks`, { method: 'GET' });
    setBlocks(Array.isArray(payload?.content) ? payload.content : []);
  };

  const saveBlocks = async () => {
    if (!currentInstituteId || !pageSlug) {
      return;
    }
    await fetchJson('website/content', {
      method: 'POST',
      body: JSON.stringify({
        institute_id: currentInstituteId,
        page: pageSlug,
        section: 'blocks',
        content: blocks,
      }),
    });
  };

  useEffect(() => {
    loadBlocks();
  }, [currentInstituteId, pageSlug]);

  const addBlock = () => {
    setBlocks((prev) => [...prev, makeBlock(newType)]);
  };

  const removeBlock = (index) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index, direction) => {
    setBlocks((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const updateBlockField = (index, key, value) => {
    setBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, data: { ...block.data, [key]: value } } : block)));
  };

  const addNestedItem = (index, listKey, newItem) => {
    setBlocks((prev) => prev.map((block, i) => {
      if (i !== index) {
        return block;
      }
      const currentList = Array.isArray(block.data?.[listKey]) ? block.data[listKey] : [];
      return {
        ...block,
        data: {
          ...block.data,
          [listKey]: [...currentList, newItem],
        },
      };
    }));
  };

  const removeNestedItem = (index, listKey, itemIndex) => {
    setBlocks((prev) => prev.map((block, i) => {
      if (i !== index) {
        return block;
      }
      const currentList = Array.isArray(block.data?.[listKey]) ? block.data[listKey] : [];
      return {
        ...block,
        data: {
          ...block.data,
          [listKey]: currentList.filter((_, c) => c !== itemIndex),
        },
      };
    }));
  };

  const updateNestedItemField = (index, listKey, itemIndex, key, value) => {
    setBlocks((prev) => prev.map((block, i) => {
      if (i !== index) {
        return block;
      }
      const currentList = Array.isArray(block.data?.[listKey]) ? block.data[listKey] : [];
      const nextList = currentList.map((item, c) => (c === itemIndex ? { ...item, [key]: value } : item));
      return {
        ...block,
        data: {
          ...block.data,
          [listKey]: nextList,
        },
      };
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reusable Block Builder</CardTitle>
        <CardDescription>Create page sections with reusable block types: hero, cards, stats, and gallery.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-56 space-y-1">
            <Label>Block Type</Label>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="cards">Cards</SelectItem>
                <SelectItem value="stats">Stats</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addBlock}>Add Block</Button>
        </div>

        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div key={block.id || `${block.type}-${index}`} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase">{block.type} block</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => moveBlock(index, -1)}>Up</Button>
                  <Button size="sm" variant="outline" onClick={() => moveBlock(index, 1)}>Down</Button>
                  <Button size="sm" variant="destructive" onClick={() => removeBlock(index)}>Delete</Button>
                </div>
              </div>

              {block.type === 'hero' && (
                <div className="grid gap-2 md:grid-cols-2">
                  <Input value={block.data.title || ''} onChange={(e) => updateBlockField(index, 'title', e.target.value)} placeholder="Hero title" />
                  <Input value={block.data.subtitle || ''} onChange={(e) => updateBlockField(index, 'subtitle', e.target.value)} placeholder="Hero subtitle" />
                  <Input value={block.data.ctaText || ''} onChange={(e) => updateBlockField(index, 'ctaText', e.target.value)} placeholder="CTA text" />
                  <Input value={block.data.ctaLink || ''} onChange={(e) => updateBlockField(index, 'ctaLink', e.target.value)} placeholder="CTA link" />
                  <Input className="md:col-span-2" value={block.data.backgroundImage || ''} onChange={(e) => updateBlockField(index, 'backgroundImage', e.target.value)} placeholder="Background image URL" />
                </div>
              )}

              {block.type !== 'hero' && (
                <Input value={block.data.sectionTitle || ''} onChange={(e) => updateBlockField(index, 'sectionTitle', e.target.value)} placeholder="Section title" />
              )}

              {block.type === 'cards' && (
                <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-3">
                  {(Array.isArray(block.data?.items) ? block.data.items : []).map((card, itemIndex) => (
                    <div key={`card-${itemIndex}`} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                      <Input value={card.title || ''} onChange={(e) => updateNestedItemField(index, 'items', itemIndex, 'title', e.target.value)} placeholder="Card title" />
                      <Input value={card.text || ''} onChange={(e) => updateNestedItemField(index, 'items', itemIndex, 'text', e.target.value)} placeholder="Card description" />
                      <Button size="sm" variant="destructive" onClick={() => removeNestedItem(index, 'items', itemIndex)}>Delete</Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addNestedItem(index, 'items', { title: 'New Card', text: 'Card description.' })}>Add Card Item</Button>
                </div>
              )}

              {block.type === 'stats' && (
                <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-3">
                  {(Array.isArray(block.data?.items) ? block.data.items : []).map((stat, itemIndex) => (
                    <div key={`stat-${itemIndex}`} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <Input value={stat.label || ''} onChange={(e) => updateNestedItemField(index, 'items', itemIndex, 'label', e.target.value)} placeholder="Stat label" />
                      <Input value={stat.value || ''} onChange={(e) => updateNestedItemField(index, 'items', itemIndex, 'value', e.target.value)} placeholder="Value" />
                      <Input value={stat.suffix || ''} onChange={(e) => updateNestedItemField(index, 'items', itemIndex, 'suffix', e.target.value)} placeholder="Suffix e.g. +" />
                      <Button size="sm" variant="destructive" onClick={() => removeNestedItem(index, 'items', itemIndex)}>Delete</Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addNestedItem(index, 'items', { label: 'Metric', value: '100', suffix: '+' })}>Add Stat Item</Button>
                </div>
              )}

              {block.type === 'gallery' && (
                <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-3">
                  {(Array.isArray(block.data?.images) ? block.data.images : []).map((image, itemIndex) => (
                    <div key={`image-${itemIndex}`} className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
                      <Input value={image.url || ''} onChange={(e) => updateNestedItemField(index, 'images', itemIndex, 'url', e.target.value)} placeholder="Image URL" />
                      <Input value={image.caption || ''} onChange={(e) => updateNestedItemField(index, 'images', itemIndex, 'caption', e.target.value)} placeholder="Caption" />
                      <Button size="sm" variant="destructive" onClick={() => removeNestedItem(index, 'images', itemIndex)}>Delete</Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addNestedItem(index, 'images', { url: 'https://placehold.co/900x700/png?text=Gallery', caption: 'Image caption' })}>Add Gallery Image</Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={saveBlocks}>Save Blocks</Button>
          <Button variant="outline" onClick={loadBlocks}>Reload Blocks</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PageBlockBuilder;
