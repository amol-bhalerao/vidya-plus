import React from 'react';
import WebsiteTopBar from './WebsiteTopBar';
import WebsiteNavbar from './WebsiteNavbar';

const WebsiteHeader = ({ institute, menuItems, navSearch, mobileNavOpen, setMobileNavOpen, announcementText }) => {
  const contactInfo = institute?.contact_info || {};

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#2a323a] bg-[#11171cf2] shadow-md backdrop-blur-xl">
      <WebsiteTopBar contactInfo={contactInfo} announcementText={announcementText} />
      <WebsiteNavbar
        instituteName={institute?.name || 'Vidya+ College'}
        menuItems={menuItems}
        navSearch={navSearch}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        onCloseMobileNav={() => setMobileNavOpen(false)}
      />
    </header>
  );
};

export default WebsiteHeader;
