import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, UserPlus, Users, DollarSign, Calendar, BookOpen, FileText, Settings, Building, Globe, LogOut, ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/admin' },
  { id: 'admission', label: 'Admission', icon: UserPlus, path: '/admin/admission' },
  { id: 'students', label: 'Students', icon: Users, path: '/admin/students' },
  { id: 'finance', label: 'Finance', icon: DollarSign, path: '/admin/finance' },
  { id: 'attendance', label: 'Attendance', icon: Calendar, path: '/admin/attendance' },
  { id: 'examination', label: 'Exams', icon: BookOpen, path: '/admin/examination' },
  { id: 'online-exam', label: 'Online Exams', icon: ClipboardCheck, path: '/admin/online-exam' },
  { id: 'documents', label: 'Documents', icon: FileText, path: '/admin/documents' },
  { id: 'website', label: 'Website', icon: Globe, path: '/admin/website' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const NavItem = ({ item, isSidebarOpen }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));

  return (
    <NavLink to={item.path} className={`flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
      <item.icon className="h-5 w-5" />
      {!isSidebarOpen && <span className="ml-4 font-medium">{item.label}</span>}
    </NavLink>
  );
};


const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, handleLogout } = useUser();
  // For now, super admin always sees all modules
  const isSuperAdmin = user?.role === 'super_admin';
  const signOut = async () => { await handleLogout(); };

  const visibleMenuItems = isSuperAdmin
    ? menuItems // Show all modules for super admin
    : menuItems; // TODO: Add per-role filtering for regular users

  return (
    <motion.div
      animate={{ width: isOpen ? '80px' : '280px' }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col h-screen bg-white/70 backdrop-blur-sm border-r border-gray-200/80 shadow-sm"
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!isOpen && <div className="flex items-center gap-2">
          <Building className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold gradient-text">Vidya+</span>
        </div>}
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="absolute -right-5 top-8 bg-white border rounded-full h-10 w-10 shadow-md hover:bg-gray-100">
          {isOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <ScrollArea className="flex-grow">
        <nav className="space-y-2 p-4">
          {visibleMenuItems.map((item) => <NavItem key={item.id} item={item} isSidebarOpen={isOpen} />)}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <button onClick={signOut} className={`flex items-center p-3 rounded-lg w-full text-left transition-colors text-red-500 hover:bg-red-50`}>
          <LogOut className="h-5 w-5" />
          {!isOpen && <span className="ml-4 font-medium">Logout</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;