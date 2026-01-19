import { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Pill,
  Calendar,
  HeartPulse,
  Settings,
  User,
  Menu,
  X,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import EmergencyButton from '@/components/emergency/EmergencyButton';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/medications', icon: Pill, label: 'Medications' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/health', icon: HeartPulse, label: 'Health' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <HeartPulse className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">RTHA</h1>
              <p className="text-xs text-muted-foreground">Real-Time Health</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-2">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-glow'
                          : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Emergency Button - Desktop */}
            <div className="mt-auto pt-4">
              <EmergencyButton />
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-4 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <HeartPulse className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">RTHA</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              3
            </span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-lg lg:hidden"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                      <HeartPulse className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-foreground">RTHA</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 space-y-2 p-4">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-glow'
                            : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="border-t border-border p-4">
                  <EmergencyButton />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
