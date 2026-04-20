import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const appendSearch = (path, search) => {
  if (!search) {
    return path;
  }
  return path.includes('?') ? `${path}&${search.slice(1)}` : `${path}${search}`;
};

const WebsiteNavbar = ({ instituteName, menuItems, navSearch, mobileNavOpen, onToggleMobileNav, onCloseMobileNav }) => (
  <div className="relative mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between gap-3 px-4 md:px-8">
    <Link to={appendSearch('/home', navSearch)} className="flex min-w-0 items-center gap-3">
      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#2fe0ff] via-[#31a8ff] to-[#2df0ca]" />
      <div className="min-w-0">
        <p className="truncate font-serif text-base font-bold text-[#f2f6f9] md:text-lg">{instituteName}</p>
        <p className="truncate text-[10px] uppercase tracking-[0.22em] text-[#67ffe2]">Learning | Leadership | Legacy</p>
      </div>
    </Link>

    <nav className="hidden flex-1 items-center justify-center gap-2 xl:flex">
      {menuItems.map((item, index) => (
        <div key={`${item.path}-${item.label}-${index}`} className="group relative">
          <Link to={appendSearch(item.path, navSearch)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-[#d4e1ec] transition hover:bg-[#1e2935] hover:text-[#67ffe2]">
            {item.label}
            {Array.isArray(item.children) && item.children.length > 0 && <ChevronDown className="h-4 w-4" />}
          </Link>
          {Array.isArray(item.children) && item.children.length > 0 && (
            <div className="absolute left-0 top-full hidden min-w-60 rounded-xl border border-[#2f3b48] bg-[#171f27] p-2 shadow-2xl group-hover:block">
              {item.children.map((child, childIndex) => (
                <Link key={`${child.path}-${child.label}-${childIndex}`} to={appendSearch(child.path, navSearch)} className="block rounded-lg px-3 py-2 text-sm text-[#d3dfeb] hover:bg-[#223041] hover:text-[#67ffe2]">
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>

    <div className="flex items-center gap-2">
      <Button asChild className="hidden bg-[#21e6c1] text-[#122233] hover:bg-[#18c9a8] lg:inline-flex">
        <Link to={appendSearch('/admin/login', navSearch)}>Admin Panel</Link>
      </Button>
      <Button variant="ghost" size="icon" className="text-[#67ffe2] hover:bg-[#202a35] hover:text-[#9bffec] xl:hidden" onClick={onToggleMobileNav}>
        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </div>

    {mobileNavOpen && (
      <div className="absolute inset-x-0 top-full border-t border-[#29313a] bg-[#151d25] px-4 py-3 shadow-md xl:hidden">
        {menuItems.map((item, index) => (
          <div key={`${item.path}-${item.label}-${index}`} className="mb-1">
            <Link to={appendSearch(item.path, navSearch)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#d6e3ee] hover:bg-[#1e2935] hover:text-[#67ffe2]" onClick={onCloseMobileNav}>
              {item.label}
            </Link>
            {Array.isArray(item.children) && item.children.map((child, childIndex) => (
              <Link key={`${child.path}-${child.label}-${childIndex}`} to={appendSearch(child.path, navSearch)} className="ml-3 block rounded-lg px-3 py-1.5 text-sm text-[#9ab0c5] hover:bg-[#1d2833] hover:text-[#67ffe2]" onClick={onCloseMobileNav}>
                {child.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default WebsiteNavbar;
