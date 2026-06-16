import React from "react";
import { Link, useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";
import { clearAuth, getAuthRole, getAuthUsername } from "@/lib/auth";
import schoolLogo from "@assets/image_1781358894878.png";
import { 
  LayoutDashboard, 
  Users, 
  Banknote, 
  CalendarCheck, 
  Bell, 
  LogOut, 
  Menu,
  Settings,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/fees", label: "Fees", icon: Banknote },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/academic", label: "Academic", icon: BookOpen },
  { href: "/announcements", label: "Announcements", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const role = getAuthRole();
  const username = getAuthUsername();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        clearAuth();
        setLocation("/login");
      }
    });
  };

  if (!role || role === "teacher") return <>{children}</>;

  const NavLinks = () => (
    <div className="flex flex-col gap-2 w-full">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href || location.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} className="w-full">
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent font-medium" : "font-normal"}`}
            >
              <item.icon className="w-5 h-5 opacity-80" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
        <Link href="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src={schoolLogo} alt="Allied School Logo" className="w-10 h-10 object-contain" />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sidebar-foreground leading-tight text-lg">Allied School</span>
            <span className="text-xs text-sidebar-foreground/70">Rehman Campus</span>
          </div>
        </Link>
        <div className="px-4 flex-1 py-4">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-sidebar-accent/50">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase">
              {username?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate capitalize">{username ?? "user"}</p>
              <p className="text-[10px] text-sidebar-foreground/60 capitalize">{role === 'admin' ? 'Admin / Full Access' : 'Director / View Only'}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <LogOut className="w-5 h-5 opacity-80" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src={schoolLogo} alt="Allied School" className="w-8 h-8 object-contain" />
            <span className="font-serif font-bold text-foreground">Rehman Campus</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 border-none">
              <Link href="/dashboard" className="p-6 flex items-center gap-3 border-b border-sidebar-border hover:opacity-90 transition-opacity">
                <img src={schoolLogo} alt="Logo" className="w-10 h-10 object-contain" />
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-sidebar-foreground text-lg leading-tight">Allied School</span>
                  <span className="text-xs text-sidebar-foreground/70">Admin Portal</span>
                </div>
              </Link>
              <div className="px-4 py-6">
                <NavLinks />
              </div>
              <div className="absolute bottom-0 w-full p-4 border-t border-sidebar-border">
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent">
                  <LogOut className="w-5 h-5 opacity-80" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
