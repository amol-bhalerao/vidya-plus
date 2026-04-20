import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const defaultMenu = [{ label: 'Home', path: '/home', children: [] }];

const normalizePath = (path = '/home') => {
  const trimmed = String(path || '').trim();
  if (!trimmed) {
    return '/home';
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const VisualMenuBuilder = ({ currentInstituteId, fetchJson, onSaved }) => {
  const [items, setItems] = useState(defaultMenu);
  const [dragIndex, setDragIndex] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');

  const flattenedPaths = useMemo(() => {
    const paths = [];
    const walk = (rows) => {
      rows.forEach((row) => {
        paths.push(normalizePath(row.path));
        if (Array.isArray(row.children) && row.children.length > 0) {
          walk(row.children);
        }
      });
    };
    walk(items);
    return Array.from(new Set(paths));
  }, [items]);

  const load = async () => {
    if (!currentInstituteId) {
      return;
    }
    const payload = await fetchJson(`website/content?institute_id=${encodeURIComponent(currentInstituteId)}&page=global&section=menu`, { method: 'GET' });
    const content = Array.isArray(payload?.content) && payload.content.length > 0 ? payload.content : defaultMenu;
    setItems(content.map((item) => ({ ...item, children: item.children || [] })));
  };

  const save = async () => {
    if (!currentInstituteId) {
      return;
    }

    const normalized = [];
    const walk = (rows) => {
      rows.forEach((row) => {
        const label = String(row.label || '').trim();
        const path = normalizePath(row.path);
        normalized.push({ label, path });
        if (Array.isArray(row.children) && row.children.length > 0) {
          walk(row.children);
        }
      });
    };
    walk(items);

    if (normalized.some((row) => !row.label || !row.path || row.path === '/')) {
      setValidationMessage('Each menu and submenu must have a label and a valid route path like /home or /services.');
      return;
    }

    if (normalized.some((row) => !/^\/[a-z0-9\-/_]*$/i.test(row.path))) {
      setValidationMessage('Route paths can only use letters, numbers, hyphens, underscores, and slashes.');
      return;
    }

    const pathCounts = normalized.reduce((acc, row) => ({ ...acc, [row.path]: (acc[row.path] || 0) + 1 }), {});
    const duplicates = Object.entries(pathCounts).filter(([, count]) => count > 1).map(([path]) => path);
    if (duplicates.length > 0) {
      setValidationMessage(`Duplicate paths found: ${duplicates.join(', ')}. Keep each route unique.`);
      return;
    }

    setValidationMessage('');

    await fetchJson('website/content', {
      method: 'POST',
      body: JSON.stringify({
        institute_id: currentInstituteId,
        page: 'global',
        section: 'menu',
        content: items,
      }),
    });
    if (onSaved) {
      onSaved(flattenedPaths);
    }
  };

  useEffect(() => {
    load();
  }, [currentInstituteId]);

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: key === 'path' ? normalizePath(value) : value } : item)));
  };

  const addTopLevel = () => {
    setItems((prev) => [...prev, { label: 'New Menu', path: '/new-page', children: [] }]);
  };

  const removeTopLevel = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addChild = (index) => {
    setItems((prev) => prev.map((item, i) => (i === index
      ? { ...item, children: [...(item.children || []), { label: 'Submenu', path: '/sub-page' }] }
      : item)));
  };

  const updateChild = (index, childIndex, key, value) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) {
        return item;
      }
      const children = [...(item.children || [])];
      children[childIndex] = {
        ...children[childIndex],
        [key]: key === 'path' ? normalizePath(value) : value,
      };
      return { ...item, children };
    }));
  };

  const removeChild = (index, childIndex) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) {
        return item;
      }
      return { ...item, children: (item.children || []).filter((_, c) => c !== childIndex) };
    }));
  };

  const onDropTopLevel = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      return;
    }
    setItems((prev) => {
      const copy = [...prev];
      const [dragged] = copy.splice(dragIndex, 1);
      copy.splice(targetIndex, 0, dragged);
      return copy;
    });
    setDragIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drag-and-Drop Menu Builder</CardTitle>
        <CardDescription>Build navbar items visually and drag to reorder top-level menus. Submenus can be added under each menu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.path}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropTopLevel(index)}
              className="rounded-lg border p-3"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Menu Label</Label>
                  <Input aria-label={`Menu label ${index + 1}`} value={item.label || ''} onChange={(e) => updateItem(index, 'label', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Route Path</Label>
                  <Input aria-label={`Route path ${index + 1}`} value={item.path || ''} onChange={(e) => updateItem(index, 'path', e.target.value)} />
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addChild(index)}>Add Submenu</Button>
                <Button variant="destructive" size="sm" onClick={() => removeTopLevel(index)}>Remove</Button>
              </div>

              {(item.children || []).length > 0 && (
                <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-2">
                  {item.children.map((child, childIndex) => (
                    <div key={`${child.path}-${childIndex}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <Input aria-label={`Submenu label ${index + 1}-${childIndex + 1}`} value={child.label || ''} onChange={(e) => updateChild(index, childIndex, 'label', e.target.value)} placeholder="Submenu label" />
                      <Input aria-label={`Submenu path ${index + 1}-${childIndex + 1}`} value={child.path || ''} onChange={(e) => updateChild(index, childIndex, 'path', e.target.value)} placeholder="/submenu-path" />
                      <Button variant="destructive" size="sm" onClick={() => removeChild(index, childIndex)}>Delete</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {validationMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" aria-live="polite">
            {validationMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={addTopLevel}>Add Top-Level Menu</Button>
          <Button variant="outline" onClick={load}>Reload</Button>
          <Button className="bg-[#1567a8] hover:bg-[#0f4f81]" onClick={save}>Save Menu Builder</Button>
        </div>

        <div className="rounded-md border bg-slate-50 p-3 text-xs">
          <p className="font-semibold">Bound Routes Preview</p>
          <p className="mt-1 text-slate-600">{flattenedPaths.join(', ')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualMenuBuilder;
