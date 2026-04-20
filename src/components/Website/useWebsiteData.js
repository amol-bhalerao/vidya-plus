import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_INSTITUTE,
  DEFAULT_MENU,
  DEFAULT_WEBSITE_CONTENT,
  flattenMenuItems,
  pathToPageKey,
} from './website-utils';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const fetchJson = async (url) => {
  const response = await fetch(url, { credentials: 'include' });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

export const useWebsiteData = (instituteId) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    institute: DEFAULT_INSTITUTE,
    menu: DEFAULT_MENU,
    content: DEFAULT_WEBSITE_CONTENT,
    carousel: [],
    events: [],
    gallery: [],
  });

  const readSection = useCallback(async (page, section = 'main') => {
    try {
      const payload = await fetchJson(`${API_BASE}/website/content?institute_id=${encodeURIComponent(instituteId)}&page=${encodeURIComponent(page)}&section=${encodeURIComponent(section)}`);
      return payload?.content ?? null;
    } catch {
      return null;
    }
  }, [instituteId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [institutes, menuConfig] = await Promise.all([
        fetchJson(`${API_BASE}/institutes`).catch(() => []),
        readSection('global', 'menu'),
      ]);

      const menuRows = Array.isArray(menuConfig) && menuConfig.length > 0 ? menuConfig : DEFAULT_MENU;
      const dynamicPageKeys = Array.from(
        new Set(
          flattenMenuItems(menuRows)
            .map((item) => pathToPageKey(item.path))
            .filter(Boolean),
        ),
      );

      const requiredPages = Array.from(
        new Set(['home', 'about', 'academics', 'admissions', 'contact', ...dynamicPageKeys]),
      );

      const [announcementConfig, footerConfig, homeMain, homeHighlights, homePrograms, homeStats, homeTestimonials, homeAdmissionsCta, homeBirthdays, pageSections, carouselRows, eventRows, galleryRows] = await Promise.all([
        readSection('global', 'announcements'),
        readSection('global', 'footer'),
        readSection('home', 'main'),
        readSection('home', 'highlights'),
        readSection('home', 'programs'),
        readSection('home', 'stats'),
        readSection('home', 'testimonials'),
        readSection('home', 'admissions_cta'),
        readSection('home', 'birthdays'),
        Promise.all(requiredPages.map(async (page) => ({
          page,
          main: await readSection(page, 'main'),
          seo: await readSection(page, 'seo'),
          blocks: await readSection(page, 'blocks'),
        }))),
        fetchJson(`${API_BASE}/website/carousel?institute_id=${encodeURIComponent(instituteId)}`).catch(() => []),
        fetchJson(`${API_BASE}/website/events?institute_id=${encodeURIComponent(instituteId)}`).catch(() => []),
        fetchJson(`${API_BASE}/website/gallery?institute_id=${encodeURIComponent(instituteId)}`).catch(() => []),
      ]);

      const foundInstitute = Array.isArray(institutes)
        ? institutes.find((inst) => String(inst.id) === String(instituteId)) || institutes[0]
        : null;

      const mergedContent = {
        ...DEFAULT_WEBSITE_CONTENT,
        announcement: announcementConfig || DEFAULT_WEBSITE_CONTENT.announcement,
        footer: footerConfig || DEFAULT_WEBSITE_CONTENT.footer,
        home: {
          ...DEFAULT_WEBSITE_CONTENT.home,
          main: homeMain || DEFAULT_WEBSITE_CONTENT.home.main,
          highlights: Array.isArray(homeHighlights) && homeHighlights.length > 0 ? homeHighlights : DEFAULT_WEBSITE_CONTENT.home.highlights,
          programs: Array.isArray(homePrograms) && homePrograms.length > 0 ? homePrograms : DEFAULT_WEBSITE_CONTENT.home.programs,
          stats: Array.isArray(homeStats) && homeStats.length > 0 ? homeStats : DEFAULT_WEBSITE_CONTENT.home.stats,
          testimonials: Array.isArray(homeTestimonials) && homeTestimonials.length > 0 ? homeTestimonials : DEFAULT_WEBSITE_CONTENT.home.testimonials,
          admissionsCta: homeAdmissionsCta || DEFAULT_WEBSITE_CONTENT.home.admissionsCta,
          birthdays: Array.isArray(homeBirthdays) && homeBirthdays.length > 0 ? homeBirthdays : DEFAULT_WEBSITE_CONTENT.home.birthdays,
        },
      };

      pageSections.forEach(({ page, main, seo, blocks }) => {
        const fallbackContent = mergedContent[page] || {
          title: page.charAt(0).toUpperCase() + page.slice(1),
          text: 'Content coming soon.',
        };

        if (page === 'home') {
          mergedContent.home = {
            ...mergedContent.home,
            seo: seo || mergedContent.home?.seo || null,
            blocks: Array.isArray(blocks) ? blocks : mergedContent.home?.blocks || [],
          };
          return;
        }

        const mainContent = main || fallbackContent;
        mergedContent[page] = {
          ...mainContent,
          seo: seo || null,
          blocks: Array.isArray(blocks) ? blocks : [],
        };
      });

      setData({
        institute: foundInstitute || DEFAULT_INSTITUTE,
        menu: menuRows,
        content: mergedContent,
        carousel: Array.isArray(carouselRows) ? carouselRows : [],
        events: Array.isArray(eventRows) ? eventRows : [],
        gallery: Array.isArray(galleryRows) ? galleryRows : [],
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, readSection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, data, refresh };
};
