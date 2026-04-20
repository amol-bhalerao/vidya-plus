import React from 'react';
import { MapPin, PhoneCall, Mail } from 'lucide-react';

const ContactSection = ({ institute, content }) => {
  const contactInfo = institute?.contact_info || {};

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-20 md:px-8">
      <h1 className="font-serif text-5xl font-bold text-[#153f63]">{content?.title || 'Contact Us'}</h1>
      <p className="mt-6 text-lg leading-8 text-[#496c8f]">{content?.text || 'Reach out for admissions counseling, campus tours, and scholarship guidance.'}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#d6e8fb] bg-white p-5">
          <p className="inline-flex items-center gap-2 font-semibold text-[#1b4c77]"><MapPin className="h-4 w-4" /> Address</p>
          <p className="mt-2 text-sm text-[#4b7095]">{institute?.address || 'Hingoli, Maharashtra'}</p>
        </div>
        <div className="rounded-2xl border border-[#d6e8fb] bg-white p-5">
          <p className="inline-flex items-center gap-2 font-semibold text-[#1b4c77]"><PhoneCall className="h-4 w-4" /> Phone</p>
          <p className="mt-2 text-sm text-[#4b7095]">{contactInfo.phone || '+91 00000 00000'}</p>
        </div>
        <div className="rounded-2xl border border-[#d6e8fb] bg-white p-5">
          <p className="inline-flex items-center gap-2 font-semibold text-[#1b4c77]"><Mail className="h-4 w-4" /> Email</p>
          <p className="mt-2 text-sm text-[#4b7095]">{contactInfo.email || 'info@vidyaplus.edu'}</p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
