import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart2, Home, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to}>
        <div className={cn(
          "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-200",
          isActive ? "bg-lime-brand border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "hover:bg-gray-100"
        )}>
          <Icon className={cn("h-6 w-6 mb-1", isActive ? "text-black" : "text-gray-500")} />
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar / Topbar */}
      <nav className="hidden md:flex bg-white/50 backdrop-blur-md border-b-2 border-black px-6 py-4 sticky top-0 z-50 justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src="/logo.png" alt="MediTrack Logo" className="h-10 w-10 rounded-xl" />
          <span className="text-2xl font-heading font-bold">MediTrack</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}>Dashboard</Button>
          </Link>
          <Link to="/schedule">
            <Button variant={location.pathname === '/schedule' ? 'secondary' : 'ghost'}>Schedule</Button>
          </Link>
          <Link to="/reports">
            <Button variant={location.pathname === '/reports' ? 'secondary' : 'ghost'}>Reports</Button>
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white border-2 border-black rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 z-50 flex justify-around items-center">
        <NavItem to="/dashboard" icon={Home} label="Home" />
        <NavItem to="/schedule" icon={CalendarDays} label="Schedule" />
        <NavItem to="/reports" icon={BarChart2} label="Reports" />
      </nav>
    </>
  );
}
