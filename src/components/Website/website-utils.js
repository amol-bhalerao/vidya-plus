export const DEFAULT_INSTITUTE = {
  name: 'Kai Baburao Patil Arts & Science College, Hingoli',
  address: 'Hingoli, Maharashtra',
  contact_info: {
    phone: '+91 00000 00000',
    email: 'info@vidyaplus.edu',
  },
};

export const DEFAULT_MENU = [
  { label: 'Home', path: '/home' },
  {
    label: 'Academics',
    path: '/academics',
    children: [
      { label: 'Departments', path: '/academics' },
      { label: 'Programs', path: '/academics' },
    ],
  },
  { label: 'Admissions', path: '/admissions' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Contact', path: '/contact' },
];

export const DEFAULT_WEBSITE_CONTENT = {
  announcement: {
    items: [
      'Admissions are open for 2026-27.',
      'Scholarship support available for meritorious students.',
      'Modern labs, digital classrooms, and active placement cell.',
    ],
  },
  home: {
    main: {
      badge: 'NAAC Accredited Institution',
      headline: 'Empowering Futures Through Knowledge, Research, and Character',
      subheadline: 'A professional, student-first campus where academics, culture, and career development move together.',
      ctaPrimary: 'Start Admission Inquiry',
      ctaSecondary: 'Explore Programs',
    },
    highlights: [
      { title: 'Industry-Aligned Curriculum', description: 'Course structure updated with practical and employability focus.' },
      { title: 'Experienced Faculty', description: 'Dedicated mentors guiding students across disciplines.' },
      { title: 'Research & Innovation Culture', description: 'Project-based learning with seminars and competitions.' },
    ],
    programs: [
      { title: 'Arts & Humanities', description: 'Strong foundation in languages, social sciences, and communication.' },
      { title: 'Science Stream', description: 'Lab-intensive science education with strong conceptual learning.' },
      { title: 'Career Readiness', description: 'Soft skills, internships, and placement support for final-year students.' },
    ],
    stats: [
      { label: 'Students', value: 3500, suffix: '+' },
      { label: 'Faculty Members', value: 120, suffix: '+' },
      { label: 'Programs', value: 18, suffix: '' },
      { label: 'Placement Support', value: 95, suffix: '%' },
    ],
    testimonials: [
      { name: 'Aditi Patil', role: 'B.Sc Graduate', quote: 'The faculty support and practical sessions prepared me for postgraduate studies with confidence.' },
      { name: 'Rahul Deshmukh', role: 'B.A Student', quote: 'Campus activities and mentoring helped me improve communication and leadership skills.' },
    ],
    admissionsCta: {
      title: 'Admissions 2026-27 Are Open',
      text: 'Apply online, upload documents, and track your admission status from the portal.',
      button: 'Apply Now',
    },
    birthdays: [
      { name: 'Aaradhya Patil', role: 'B.Sc Student', image_url: 'https://placehold.co/220x220/png?text=Student' },
      { name: 'Prof. Vivek Joshi', role: 'Chemistry Department', image_url: 'https://placehold.co/220x220/png?text=Faculty' },
    ],
  },
  about: {
    title: 'About Our Institution',
    text: 'We nurture disciplined, socially responsible, and professionally competent graduates through quality education.',
  },
  academics: {
    title: 'Academics & Departments',
    text: 'Our programs combine foundational knowledge, modern pedagogy, and practical exposure.',
  },
  admissions: {
    title: 'Admissions Process',
    text: 'Complete admissions online with transparent merit handling, document verification, and fee workflow.',
  },
  contact: {
    title: 'Contact & Campus Visit',
    text: 'Reach out for admissions counseling, campus tours, and scholarship guidance.',
  },
  footer: {
    note: 'Academic excellence with values, discipline, and innovation.',
  },
};

export const normalizePath = (path = '/home') => {
  const candidate = String(path || '/home').trim();
  if (!candidate.startsWith('/')) {
    return `/${candidate}`;
  }
  return candidate;
};

export const pathToPageKey = (path = '/home') => {
  const normalized = normalizePath(path);
  const trimmed = normalized.replace(/^\/+|\/+$/g, '');
  if (!trimmed) {
    return 'home';
  }
  return trimmed.split('/')[0].toLowerCase();
};

export const flattenMenuItems = (items = []) => {
  const rows = [];
  const walk = (collection) => {
    collection.forEach((item) => {
      rows.push(item);
      if (Array.isArray(item.children) && item.children.length > 0) {
        walk(item.children);
      }
    });
  };
  walk(items);
  return rows;
};

export const dedupePaths = (items = []) => {
  const seen = new Set();
  const unique = [];
  items.forEach((item) => {
    const path = normalizePath(item.path || '/home');
    if (!seen.has(path)) {
      seen.add(path);
      unique.push(path);
    }
  });
  return unique;
};

export const parseNumberish = (value) => {
  if (typeof value === 'number') {
    return { end: value, suffix: '' };
  }
  const stringValue = String(value || '').trim();
  const numeric = Number(stringValue.replace(/[^\d.]/g, '')) || 0;
  const suffix = stringValue.replace(/[\d.,\s]/g, '');
  return { end: numeric, suffix };
};
