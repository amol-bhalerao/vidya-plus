import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, Mail, MapPin } from 'lucide-react';

const appendSearch = (path, search) => {
  if (!search) {
    return path;
  }
  return path.includes('?') ? `${path}&${search.slice(1)}` : `${path}${search}`;
};

const WebsiteFooter = ({ institute, menuItems, navSearch, footerNote }) => {
  const contactInfo = institute?.contact_info || {};

  return (
    <footer className="bg-[#0f1419] text-white">
      <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <h3 className="font-serif text-2xl">{institute?.name || 'Vidya+ College'}</h3>
          <p className="mt-3 max-w-xl text-sm text-[#b9c5d1]">{footerNote || 'Academic excellence with values, discipline, and innovation.'}</p>
          <p className="mt-4 inline-flex items-start gap-2 text-sm text-[#d5dce5]"><MapPin className="mt-0.5 h-4 w-4" /> {institute?.address || 'Hingoli, Maharashtra'}</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#67ffe2]">Quick Links</p>
          <div className="space-y-2 text-sm">
            {menuItems.slice(0, 6).map((item, index) => (
              <Link key={`footer-${item.path}-${item.label}-${index}`} to={appendSearch(item.path, navSearch)} className="block text-[#cbd6e2] hover:text-[#67ffe2]">{item.label}</Link>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#67ffe2]">Reach Us</p>
          <p className="mb-2 inline-flex items-center gap-2 text-sm text-[#d3dce6]"><PhoneCall className="h-4 w-4" /> {contactInfo.phone || '+91 00000 00000'}</p>
          <p className="inline-flex items-center gap-2 text-sm text-[#d3dce6]"><Mail className="h-4 w-4" /> {contactInfo.email || 'info@vidyaplus.edu'}</p>
        </div>
      </div>
      <div className="border-t border-[#2a323b] px-4 py-4 text-center text-xs text-[#9ba9b6]">© {new Date().getFullYear()} {institute?.name || 'Vidya+ College'}. All rights reserved.</div>
    </footer>
  );
};

export default WebsiteFooter;
