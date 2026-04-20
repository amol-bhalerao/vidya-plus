import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, ArrowRight } from 'lucide-react';

const EventsSection = ({ events }) => (
  <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 md:px-8" id="news">
    <div className="mb-6 flex items-center justify-between">
      <h2 className="font-serif text-3xl font-bold text-[#153f63]">Latest News & Events</h2>
      <Link to="/contact" className="inline-flex items-center gap-1 text-sm font-semibold text-[#1567a8]">More Updates <ArrowRight className="h-4 w-4" /></Link>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {events.slice(0, 6).map((event, index) => (
        <motion.article key={event.id || `${event.title}-${index}`} whileHover={{ y: -6 }} className="overflow-hidden rounded-2xl border border-[#d7e8fa] bg-white shadow-sm">
          <img src={event.image_url || 'https://placehold.co/800x500/png?text=Event'} alt={event.title || 'Event'} className="h-48 w-full object-cover" />
          <div className="space-y-2 p-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ef6c3c]"><Newspaper className="h-3.5 w-3.5" /> {event.date || 'Upcoming'}</p>
            <h3 className="font-serif text-xl font-semibold text-[#143d63]">{event.title}</h3>
            <p className="text-sm text-[#4f7397]">{event.description}</p>
          </div>
        </motion.article>
      ))}
    </div>
  </section>
);

export default EventsSection;
