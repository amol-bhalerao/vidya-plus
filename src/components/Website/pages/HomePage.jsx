import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import {
  ArrowUpRight,
  BellRing,
  CalendarClock,
  Dot,
  GraduationCap,
  Landmark,
  Newspaper,
  Sparkles,
  Timer,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseNumberish } from '../website-utils';

const withSearch = (path, search) => {
  if (!search) {
    return path;
  }
  return path.includes('?') ? `${path}&${search.slice(1)}` : `${path}${search}`;
};

const getSlideTheme = (slide = {}) => {
  const theme = String(slide?.text_theme || slide?.theme || '').toLowerCase();
  if (theme === 'dark') {
    return {
      textClass: 'text-[#0b1b2b]',
      subTextClass: 'text-[#22384d]',
      chipClass: 'border-[#2c4f74]/40 bg-[#f3f8ff]/85 text-[#11355a]',
      overlayClass: 'bg-gradient-to-r from-[#f6fbffdf] via-[#eaf4ffbd] to-[#d7ebff45]',
      ctaSecondaryClass: 'border-[#2a5e92] bg-[#e8f3ff] text-[#12406d] hover:bg-[#d6eaff]',
    };
  }

  return {
    textClass: 'text-white',
    subTextClass: 'text-[#d0dde8]',
    chipClass: 'border-[#21e6c1]/40 bg-[#0f2233]/80 text-[#67ffe2]',
    overlayClass: 'bg-gradient-to-r from-[#050d15f2] via-[#0d1f31dc] to-[#0d1f3170]',
    ctaSecondaryClass: 'border-[#6fb4ff] bg-[#11253a]/60 text-[#d9eeff] hover:bg-[#17314c]',
  };
};

const HomePage = ({ content, carousel, events, navSearch = '' }) => {
  const home = content?.home || {};

  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const announcementItems = useMemo(() => {
    const incoming = Array.isArray(content?.announcement?.items) ? content.announcement.items : [];
    if (incoming.length > 0) {
      return incoming;
    }
    return [
      'Admissions are open for 2026-27.',
      'Research fellowship applications are live this month.',
      'Academic calendar and examination notices updated.',
    ];
  }, [content?.announcement?.items]);

  const eventRows = useMemo(() => (Array.isArray(events) ? events : []), [events]);

  const newsInFocus = useMemo(() => {
    const fromEvents = eventRows.slice(0, 6).map((event, index) => ({
      id: event.id || `event-focus-${index}`,
      title: event.title || 'University Update',
      summary: event.description || 'Latest university circular and activity update.',
      date: event.date || '',
      link: event.link || '#',
      type: 'event',
    }));

    const fromAnnouncements = announcementItems.slice(0, 4).map((item, index) => ({
      id: `ann-focus-${index}`,
      title: `Announcement ${index + 1}`,
      summary: item,
      date: '',
      link: '#',
      type: 'announcement',
    }));

    return [...fromEvents, ...fromAnnouncements].slice(0, 8);
  }, [eventRows, announcementItems]);

  const liveStats = useMemo(() => {
    const thisMonth = clock.getMonth();
    const thisYear = clock.getFullYear();

    const liveEventCount = eventRows.filter((item) => {
      const date = item?.date ? new Date(item.date) : null;
      return date && !Number.isNaN(date.getTime()) && date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    const updatesCount = announcementItems.length;
    const departmentCount = Array.isArray(home?.programs) ? home.programs.length : 0;
    const noticesTrend = Math.min(98, 55 + (updatesCount * 7));

    return [
      { label: 'Live Events This Month', value: liveEventCount || 3, icon: CalendarClock, color: '#5fd3ff' },
      { label: 'Notices in Focus', value: updatesCount || 6, icon: BellRing, color: '#22e6c1' },
      { label: 'Academic Pathways', value: departmentCount || 12, icon: Landmark, color: '#74b5ff' },
      { label: 'Engagement Index', value: noticesTrend, suffix: '%', icon: Trophy, color: '#7df8d5' },
    ];
  }, [eventRows, announcementItems, home?.programs, clock]);

  const quickLinks = useMemo(() => {
    const base = [
      { label: 'Student Corner', path: '/contact', tone: '#0f5d99' },
      { label: 'Admissions Portal', path: '/admissions', tone: '#a34a1d' },
      { label: 'Research & Innovation', path: '/academics', tone: '#146c94' },
      { label: 'Exam & Results Helpdesk', path: '/contact', tone: '#1a7f79' },
    ];
    return base;
  }, []);

  const timelineRows = useMemo(() => {
    const rows = [...eventRows].slice(0, 6);
    if (rows.length > 0) {
      return rows;
    }
    return [
      { id: 'evt-1', title: 'International Workshop on Advanced Materials', date: '2026-04-20', description: 'Research and industry collaboration event.' },
      { id: 'evt-2', title: 'Mega Job Fair On Campus', date: '2026-04-28', description: 'Placement and internship opportunities.' },
      { id: 'evt-3', title: 'Academic Excellence Meet', date: '2026-05-03', description: 'Department-level curriculum innovation summit.' },
    ];
  }, [eventRows]);

  const statsRows = Array.isArray(home?.stats) && home.stats.length > 0
    ? home.stats
    : [
      { label: 'Year of Establishment', value: 1958, suffix: '' },
      { label: 'Campus Area (Acres)', value: 752, suffix: '+' },
      { label: 'Affiliated Colleges', value: 489, suffix: '+' },
      { label: 'Students', value: '4.5', suffix: ' lac+' },
    ];

  const highlights = Array.isArray(home?.highlights) && home.highlights.length > 0
    ? home.highlights
    : [
      { title: 'Industry-Aligned Curriculum', description: 'Updated course design with employability-first learning outcomes.' },
      { title: 'Academic Excellence', description: 'Strong learning ecosystem with faculty mentoring and practical orientation.' },
      { title: 'Inclusive Campus Culture', description: 'Clubs, social impact projects, and student leadership opportunities.' },
    ];

  const programs = Array.isArray(home?.programs) && home.programs.length > 0
    ? home.programs
    : [
      { title: 'Arts & Humanities', description: 'Foundations in languages, social sciences, and communication.' },
      { title: 'Science & Technology', description: 'Lab-driven education and interdisciplinary research exposure.' },
      { title: 'Professional Readiness', description: 'Career guidance, internships, and placement preparation tracks.' },
    ];

  const testimonials = Array.isArray(home?.testimonials) && home.testimonials.length > 0
    ? home.testimonials
    : [
      { name: 'Campus Alumna', role: 'Graduate', quote: 'The learning environment helped me build both confidence and skills.' },
      { name: 'Current Student', role: 'Final Year', quote: 'Mentorship and practical projects are the strongest part of this campus.' },
    ];

  const birthdays = Array.isArray(home?.birthdays) && home.birthdays.length > 0
    ? home.birthdays
    : [
      { name: 'Student Name', role: 'B.Sc Student', image_url: 'https://placehold.co/220x220/png?text=Student' },
      { name: 'Faculty Name', role: 'Professor', image_url: 'https://placehold.co/220x220/png?text=Faculty' },
    ];

  const formatDate = (value) => {
    if (!value) {
      return 'Upcoming';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <section className="announcement-marquee border-y border-[#203142] bg-[#081523] py-2 text-sm text-[#d8e9f6]">
        <div className="announcement-track">
          {[...announcementItems, ...announcementItems].map((item, index) => (
            <span key={`announcement-${index}`} className="mx-8 inline-flex items-center gap-2"><Dot className="h-4 w-4 text-[#21e6c1]" />{item}</span>
          ))}
        </div>
      </section>

      <section className="relative z-0 mx-auto mt-6 w-full max-w-[1600px] px-4 pb-8 md:px-8">
        <Swiper modules={[Autoplay, EffectFade, Pagination, Navigation]} effect="fade" loop autoplay={{ delay: 5000, disableOnInteraction: false }} pagination={{ clickable: true }} navigation className="h-[76vh] min-h-[520px] overflow-hidden rounded-3xl border border-[#2c4f6f]">
          {carousel.map((slide, index) => (
            <SwiperSlide key={slide.id || `${slide.image_url}-${index}`}>
              {(() => {
                const tone = getSlideTheme(slide);
                return (
              <div className="relative h-full" style={{ backgroundImage: `url(${slide.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className={`absolute inset-0 ${tone.overlayClass}`} />
                <div className="absolute inset-0 mx-auto flex h-full w-full max-w-[1600px] items-center px-4 md:px-8">
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className={`max-w-3xl ${tone.textClass}`}>
                    <p className={`mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tone.chipClass}`}>
                      <GraduationCap className="h-4 w-4" /> {home.main?.badge}
                    </p>
                    <h1 className="hero-reveal font-serif text-4xl font-bold leading-tight md:text-6xl">{home.main?.headline || 'A Campus That Moves At The Speed Of Ideas'}</h1>
                    <p className={`mt-5 max-w-2xl text-base md:text-lg ${tone.subTextClass}`}>{home.main?.subheadline || 'Live academic updates, research momentum, and admissions intelligence in one dynamic university homepage.'}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Button asChild className="bg-[#21e6c1] text-[#07151f] hover:bg-[#16cfac]"><Link to={withSearch('/admissions', navSearch)}>{home.main?.ctaPrimary || 'Start Admission Inquiry'}</Link></Button>
                      <Button asChild variant="outline" className={tone.ctaSecondaryClass}><Link to={withSearch('/academics', navSearch)}>{home.main?.ctaSecondary || 'Explore Programs'}</Link></Button>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d2e8fb]">
                      <span className={`rounded-full border px-3 py-1 ${tone.chipClass}`}>NIRF-Inspired Excellence</span>
                      <span className={`rounded-full border px-3 py-1 ${tone.chipClass}`}>Research Focus</span>
                      <span className={`rounded-full border px-3 py-1 ${tone.chipClass}`}>Student-Centric Campus</span>
                    </div>
                  </motion.div>
                </div>
              </div>
                );
              })()}
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section className="relative z-20 mx-auto mt-2 w-full max-w-[1600px] px-4 pb-12 md:mt-4 md:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {liveStats.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.08 }}
                className="tech-glow-card rounded-2xl border-2 border-[#2f5e86] bg-[#0f1f30f0] p-5 shadow-[0_16px_36px_rgba(2,14,26,0.55)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ac8ef]">{item.label}</p>
                  <span className="rounded-full p-2" style={{ backgroundColor: `${item.color}18` }}><Icon className="h-4 w-4" style={{ color: item.color }} /></span>
                </div>
                <p className="mt-4 text-4xl font-bold" style={{ color: item.color }}>
                  <CountUp end={Number(item.value) || 0} duration={1.5} />{item.suffix || ''}
                </p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1600px] gap-4 px-4 py-10 md:grid-cols-3 md:px-8">
        {highlights.map((item, index) => (
          <motion.article key={`${item.title}-${index}`} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08 }} className="tech-glow-card rounded-2xl border-2 border-[#2f5f88] bg-[#0d1d2df0] p-6 shadow-sm">
            <p className="mb-3 inline-flex rounded-full bg-[#16324e] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6ed8ff]">Performance Signal</p>
            <h3 className="font-serif text-2xl font-semibold text-[#e0efff]">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[#9db7ce]">{item.description}</p>
          </motion.article>
        ))}
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y border-[#d8d5cf] py-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#1a2530]">Newsroom + Announcements</h2>
            <p className="text-sm text-[#5b6672]">Editorial view of latest university updates and important circulars.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#11171c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f1c679]"><Timer className="h-3.5 w-3.5" /> Updated {clock.toLocaleTimeString()}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {newsInFocus.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-2xl border-2 border-[#d7d8dc] bg-white p-5 shadow-sm"
            >
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1c2732] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f1c97f]">
                <Newspaper className="h-3 w-3" /> {item.type}
              </p>
              <h3 className="line-clamp-2 text-base font-semibold text-[#1b2733]">{item.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#566575]">{item.summary}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-[#6a7581]">
                <span>{formatDate(item.date)}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#a55d2a]">View <ArrowUpRight className="h-3.5 w-3.5" /></span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 md:px-8">
        <div className="rounded-3xl border border-[#c8b28f] bg-gradient-to-r from-[#2f2319] via-[#4f3820] to-[#7e5830] p-8 text-white md:p-10">
          <div className="mb-8 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#ffe08a]" />
            <h2 className="font-serif text-3xl font-bold">Programs & Learning Pathways</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {programs.map((program) => (
              <div key={program.title} className="rounded-2xl border-2 border-[#f0c67a]/35 bg-black/20 p-5">
                <h3 className="font-serif text-2xl">{program.title}</h3>
                <p className="mt-2 text-sm text-[#f0e4d4]">{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 md:px-8">
        <div className="grid gap-4 rounded-3xl border-2 border-[#d9d3c8] bg-[#fffdfa] p-6 md:grid-cols-4 md:p-10">
          {statsRows.map((stat, index) => {
            const computed = parseNumberish(stat.value);
            const suffix = stat.suffix ?? computed.suffix;
            return (
              <motion.div key={`${stat.label}-${index}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ delay: index * 0.07 }} className="text-center">
                <p className="font-serif text-4xl font-bold text-[#242f3b]">
                  <CountUp end={computed.end} duration={1.9} separator="," />
                  {suffix}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#707d8b]">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 md:px-8">
        <div className="mb-6 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-[#bf6d34]" />
          <h2 className="font-serif text-3xl font-bold text-[#1b2733]">Live Events Timeline</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {timelineRows.map((event, index) => (
            <motion.article key={event.id || `${event.title}-${index}`} whileHover={{ y: -4 }} className="rounded-2xl border-2 border-[#d8d9dd] bg-[#ffffff] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#788594]">{formatDate(event.date)}</p>
              <h3 className="mt-2 text-lg font-semibold text-[#1f2a37]">{event.title || 'University Event'}</h3>
              <p className="mt-2 text-sm text-[#586574]">{event.description || 'Live event details will be managed from admin panel.'}</p>
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[#ececec]">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[#d09e56] to-[#b85f31]" initial={{ width: 0 }} whileInView={{ width: `${40 + (index * 9)}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 md:px-8">
        <div className="rounded-3xl border-2 border-[#d9d5cd] bg-[#fffaf2] p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-3xl font-bold text-[#1d2834]">Quick Access Portals</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#10161b] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f2c679]"><BellRing className="h-3.5 w-3.5" /> Updated {clock.toLocaleTimeString()}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => (
              <Link key={item.label} to={withSearch(item.path, navSearch)} className="group rounded-2xl border-2 border-[#d9d8d4] bg-white p-5 transition hover:-translate-y-1 hover:shadow-md">
                <p className="text-lg font-semibold" style={{ color: item.tone }}>{item.label}</p>
                <p className="mt-2 text-sm text-[#617080]">Direct access to frequently used student and academic services.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: item.tone }}>Open <ArrowUpRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 md:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#cb7c2e]" />
          <h2 className="font-serif text-3xl font-bold text-[#1d2935]">Voices of Our Campus</h2>
        </div>
        <Swiper modules={[Autoplay, Pagination]} slidesPerView={1} spaceBetween={18} autoplay={{ delay: 4200 }} pagination={{ clickable: true }} breakpoints={{ 768: { slidesPerView: 2 }, 1120: { slidesPerView: 3 } }}>
          {testimonials.map((item, index) => (
            <SwiperSlide key={`${item.name}-${index}`}>
              <div className="h-full rounded-2xl border-2 border-[#d9d7d1] bg-[#faf7f2] p-6 shadow-sm">
                <p className="text-sm italic leading-7 text-[#576474]">"{item.quote}"</p>
                <p className="mt-4 font-serif text-xl font-semibold text-[#1b2733]">{item.name}</p>
                <p className="text-sm text-[#6f7985]">{item.role}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 md:px-8">
        <h2 className="mb-6 font-serif text-3xl font-bold text-[#1e2935]">Birthday Wishes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {birthdays.map((person) => (
            <motion.div key={person.name} whileHover={{ scale: 1.03 }} className="rounded-2xl border-2 border-[#d8d8d5] bg-white p-5 text-center shadow-sm">
              <img src={person.image_url || 'https://placehold.co/220x220/png?text=Birthday'} alt={person.name} className="mx-auto h-24 w-24 rounded-full border-4 border-[#f2eee7] object-cover" />
              <p className="mt-3 font-serif text-lg font-semibold text-[#1d2733]">{person.name}</p>
              <p className="text-sm text-[#707b89]">{person.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-20 md:px-8">
        <div className="rounded-3xl border border-[#2f3740] bg-[#11171c] p-8 md:p-10">
          <h2 className="font-serif text-3xl font-bold text-[#f1f5f8]">{home.admissionsCta?.title || 'Admissions 2026-27 Are Open'}</h2>
          <p className="mt-2 max-w-2xl text-[#b8c6d3]">{home.admissionsCta?.text || 'Apply online, upload documents, and track your admission status from the portal.'}</p>
          <Button asChild className="mt-5 bg-[#f0ba63] text-[#151c23] hover:bg-[#ddb05f]"><Link to={withSearch('/admissions', navSearch)}>{home.admissionsCta?.button || 'Apply Now'}</Link></Button>
        </div>
      </section>
    </>
  );
};

export default HomePage;
