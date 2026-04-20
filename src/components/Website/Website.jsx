import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import WebsiteHeader from './WebsiteHeader';
import WebsiteFooter from './WebsiteFooter';
import HomePage from './pages/HomePage';
import DynamicPage from './pages/DynamicPage';
import GallerySection from './sections/GallerySection';
import ContactSection from './sections/ContactSection';
import { useWebsiteData } from './useWebsiteData';
import {
  dedupePaths,
  DEFAULT_MENU,
  pathToPageKey,
  normalizePath,
  flattenMenuItems,
} from './website-utils';

const applySeo = (pageContent, instituteName) => {
  if (typeof document === 'undefined') {
    return;
  }

  const seo = pageContent?.seo || {};
  const title = seo.title || pageContent?.title || `${instituteName || 'Institute'} Website`;
  const description = seo.description || pageContent?.text || 'Official page.';
  const canonicalUrl = seo.canonicalUrl || window.location.href;

  document.title = title;

  const upsertMeta = (name, content, attribute = 'name') => {
    if (!content) {
      return;
    }
    let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  upsertMeta('description', description);
  upsertMeta('og:title', title, 'property');
  upsertMeta('og:description', description, 'property');
  if (seo.ogImage) {
    upsertMeta('og:image', seo.ogImage, 'property');
  }

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);

  let robots = document.head.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    document.head.appendChild(robots);
  }
  robots.setAttribute('content', seo.noindex ? 'noindex, nofollow' : 'index, follow');
};

const Website = () => {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navSearch = location.search || '';

  useEffect(() => {
    const onMove = (event) => {
      document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  const instituteId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('inst') || '1';
  }, [location.search]);

  const { loading, data } = useWebsiteData(instituteId);
  const { institute, menu, content, carousel, events, gallery } = data;

  const slideRows = carousel.length > 0
    ? carousel
    : [{ id: 'default-hero', title: 'Campus Excellence', image_url: 'https://placehold.co/1600x900/png?text=College+Campus' }];
  const eventRows = events.length > 0
    ? events
    : [{ id: 'default-event', title: 'Orientation Program', description: 'Event information can be managed from the admin panel.', date: new Date().toISOString().slice(0, 10), image_url: 'https://placehold.co/800x500/png?text=Event' }];

  const flatMenuItems = useMemo(() => flattenMenuItems(Array.isArray(menu) && menu.length > 0 ? menu : DEFAULT_MENU), [menu]);
  const uniqueMenuPaths = useMemo(() => dedupePaths(flatMenuItems), [flatMenuItems]);
  const homePath = uniqueMenuPaths.find((path) => pathToPageKey(path) === 'home') || '/home';
  const galleryRows = gallery.length > 0
    ? gallery
    : [{ id: 'gallery-default', image_url: 'https://placehold.co/900x700/png?text=Campus+Gallery', title: 'Campus Memory' }];

  const PageLayout = ({ children }) => (
    <div className="relative min-h-screen overflow-x-clip bg-[#f5f9ff] text-[#103554]">
      <div className="site-mouse-aura" />
      <WebsiteHeader
        institute={institute}
        menuItems={Array.isArray(menu) && menu.length > 0 ? menu : DEFAULT_MENU}
        navSearch={navSearch}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        announcementText={content?.announcement?.items?.[0] || 'Admissions Open for Academic Year 2026-27'}
      />
      <div className="edu-grid-bg pt-[128px]">
        <AnimatePresence mode="wait">
          <motion.main key={location.pathname} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
      <WebsiteFooter
        institute={institute}
        menuItems={Array.isArray(menu) && menu.length > 0 ? menu : DEFAULT_MENU}
        navSearch={navSearch}
        footerNote={content?.footer?.note}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f9ff]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="h-12 w-12 rounded-full border-4 border-[#1a6aa8] border-t-transparent" />
      </div>
    );
  }

  const SeoWrapped = ({ pageContent, children }) => {
    useEffect(() => {
      applySeo(pageContent || {}, institute?.name);
    }, [pageContent, institute?.name, location.pathname]);

    return children;
  };

  const resolvePageElement = (path) => {
    const normalizedPath = normalizePath(path);
    const pageKey = pathToPageKey(normalizedPath);

    if (pageKey === 'home') {
      return (
        <SeoWrapped pageContent={content?.home || {}}>
          <HomePage content={content} carousel={slideRows} events={eventRows} navSearch={navSearch} />
        </SeoWrapped>
      );
    }

    if (pageKey === 'gallery') {
      return (
        <SeoWrapped pageContent={content?.gallery || {}}>
          <GallerySection gallery={galleryRows} title="Campus Gallery" />
        </SeoWrapped>
      );
    }

    if (pageKey === 'contact') {
      return (
        <SeoWrapped pageContent={content?.contact || {}}>
          <ContactSection institute={institute} content={content.contact} />
        </SeoWrapped>
      );
    }

    return (
      <SeoWrapped pageContent={content?.[pageKey] || {}}>
        <DynamicPage content={content[pageKey]} />
      </SeoWrapped>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} replace />} />
      {uniqueMenuPaths.map((path) => (
        <Route key={path} path={path} element={<PageLayout>{resolvePageElement(path)}</PageLayout>} />
      ))}
      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
};

export default Website;
