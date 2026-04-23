import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, ClipboardList, Dumbbell, Home, ListChecks, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/today', label: 'Today', icon: Home },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/log', label: 'Log', icon: ClipboardList },
  { to: '/routines', label: 'Routines', icon: ListChecks },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">StretchPlanner</span>
          <nav className="hidden gap-1 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground',
                    isActive && 'bg-secondary text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="container flex-1 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] text-muted-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
