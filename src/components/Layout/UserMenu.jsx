import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LifeBuoy, LogOut, Settings, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const UserMenu = () => {
  const user = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const signOut = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
      await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      try { localStorage.removeItem('vidya_user'); } catch (e) {}
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/dashboard/login', { replace: true });
    toast({
      title: "Signed Out",
      description: "You have been successfully logged out.",
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0].substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
            <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
            </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;