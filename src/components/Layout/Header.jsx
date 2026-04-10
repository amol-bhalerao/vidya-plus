import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from './UserMenu';
import InstituteSelector from './InstituteSelector';
import { useUser } from '@/contexts/UserContext';

const Header = ({ onToggleSidebar }) => {
  const user = useUser();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
        {isSuperAdmin && <InstituteSelector />}
      </div>
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;