import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Globe,
  User,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      }
    }
    fetchProfile();
  }, [user]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
    document.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: t('dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('courses'), path: '/courses', icon: BookOpen },
    { name: t('assignments'), path: '/assignments', icon: ClipboardList },
    { name: t('calendar'), path: '/calendar', icon: Calendar },
    { name: t('messages'), path: '/messages', icon: MessageSquare },
  ];

  if (profile?.role === 'teacher' || profile?.role === 'admin') {
    navItems.push({ name: 'Quiz Maker', path: '/quiz-maker', icon: HelpCircle });
    navItems.push({ name: 'Classes', path: '/classes', icon: User });
  }

  if (profile?.role === 'admin') {
    navItems.push({ name: t('analytics'), path: '/analytics', icon: BarChart3 });
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-xl font-serif font-bold tracking-tight text-stone-100">
          {isSidebarOpen || isMobileMenuOpen ? 'Madrassa Fikriyya' : 'MF'}
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex text-stone-400 hover:text-white hover:bg-stone-800"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg transition-colors",
              location.pathname === item.path 
                ? "bg-stone-800 text-white" 
                : "text-stone-400 hover:bg-stone-800 hover:text-white"
            )}
          >
            <item.icon size={20} />
            {(isSidebarOpen || isMobileMenuOpen) && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <Button 
          variant="ghost" 
          className="w-full flex items-center gap-4 text-stone-400 hover:text-white hover:bg-stone-800 justify-start"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          {(isSidebarOpen || isMobileMenuOpen) && <span>{t('logout')}</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex bg-stone-900 text-stone-100 transition-all duration-300 flex-col z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-40">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden text-stone-600" />}>
                <Menu size={20} />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-stone-900 border-stone-800 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-medium text-stone-800 truncate">
              {navItems.find(item => item.path === location.pathname)?.name || t('welcome')}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="text-stone-600">
              <Globe size={20} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-10 w-10 rounded-full" />}>
                <Avatar className="h-10 w-10 border border-stone-200">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                  <AvatarFallback className="bg-stone-100 text-stone-600">
                    <User size={20} />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-stone-500 truncate">{user?.email || 'Anonymous'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-stone-600">
                  <span className="capitalize">{profile?.role}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-stone-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
