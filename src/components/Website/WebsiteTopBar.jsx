import React from 'react';
import { PhoneCall, Mail } from 'lucide-react';

const WebsiteTopBar = ({ contactInfo = {}, announcementText = 'Admissions Open for Academic Year 2026-27' }) => (
  <div className="w-full bg-[#0a0f14] px-4 py-2 text-xs text-white md:px-8">
    <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1 text-[#d7e1eb]"><PhoneCall className="h-3.5 w-3.5 text-[#67ffe2]" /> {contactInfo.phone || '+91 00000 00000'}</span>
        <span className="inline-flex items-center gap-1 text-[#d7e1eb]"><Mail className="h-3.5 w-3.5 text-[#67ffe2]" /> {contactInfo.email || 'info@vidyaplus.edu'}</span>
      </div>
      <p className="text-[#9fd8ff]">{announcementText}</p>
    </div>
  </div>
);

export default WebsiteTopBar;
