'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Bird, 
  Egg, 
  TrendingDown, 
  Wheat, 
  FileText,
  LogOut,
  Menu,
  X,
  Scale,
  Users,
  BookOpen
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Farm Manager', 'Supervisor', 'Farm Worker'] },
    { name: 'Flocks (Layers)', href: '/dashboard/flocks', icon: Bird, roles: ['Farm Manager', 'Supervisor', 'Farm Worker'] },
    { name: 'Batches (Broilers)', href: '/dashboard/batches', icon: Bird, roles: ['Farm Manager', 'Supervisor', 'Farm Worker'] },
    { name: 'Egg Collection', href: '/dashboard/egg-collection', icon: Egg, roles: ['Farm Manager', 'Supervisor', 'Farm Worker'] },
    { name: 'Mortality Records', href: '/dashboard/mortality', icon: TrendingDown, roles: ['Farm Manager', 'Supervisor', 'Farm Worker'] },
    { name: 'Weight Tracking', href: '/dashboard/weight-tracking', icon: Scale, roles: ['Farm Manager', 'Supervisor', 'Farm Worker'] },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['Farm Manager', 'Supervisor'] },
    { name: 'User Management', href: '/dashboard/users', icon: Users, roles: ['Farm Manager'] },
    { name: 'User Manual', href: '/dashboard/user-manual', icon: BookOpen, roles: ['Farm Manager', 'Supervisor', 'Farm Worker'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles?.includes(userRole || '')
  );

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-green-700 to-blue-700 text-white transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white text-green-700 flex items-center justify-center font-bold text-lg">
                RF
              </div>
              <div>
                <h1 className="font-bold text-lg">Royal Farms</h1>
                <p className="text-xs text-white/80">Poultry Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-white text-green-700 font-semibold"
                      : "text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-white/20">
            <div className="mb-3 px-4 py-2 bg-white/10 rounded-lg">
              <p className="text-xs text-white/80">Logged in as</p>
              <p className="text-sm font-semibold">{userRole || 'User'}</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full bg-transparent border-white/30 text-white hover:bg-white hover:text-green-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
