import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Megaphone, FileText, Video, Image as ImageIcon,
  CalendarDays, ClipboardList, Settings, LogOut, Loader2, GraduationCap, Menu, X, Home, Info, BookOpen, Award, Users, Eye,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Canvas Pathsala" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const ADMIN_ROLES = ["super_admin", "content_manager", "blog_manager", "routine_manager", "gallery_manager"];

type AppRole = "super_admin" | "content_manager" | "blog_manager" | "routine_manager" | "gallery_manager";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; roles?: AppRole[] };
const navItems: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/preview", label: "Live Preview", icon: Eye },
  { to: "/admin/home", label: "Home Page", icon: Home, roles: ["content_manager"] },
  { to: "/admin/about", label: "About Page", icon: Info, roles: ["content_manager"] },
  { to: "/admin/courses", label: "Courses", icon: BookOpen, roles: ["content_manager"] },
  { to: "/admin/notices", label: "Notices", icon: Megaphone, roles: ["routine_manager"] },
  { to: "/admin/routines", label: "Routines", icon: CalendarDays, roles: ["routine_manager"] },
  { to: "/admin/results", label: "Results", icon: Award, roles: [] },
  { to: "/admin/blogs", label: "Blogs", icon: FileText, roles: ["blog_manager"] },
  { to: "/admin/videos", label: "Videos", icon: Video, roles: ["blog_manager"] },
  { to: "/admin/gallery", label: "Gallery", icon: ImageIcon, roles: ["gallery_manager"] },
  { to: "/admin/admissions", label: "Admissions", icon: ClipboardList, roles: [] },
  { to: "/admin/settings", label: "Site Settings", icon: Settings, roles: ["content_manager"] },
  { to: "/admin/admins", label: "Admin Management", icon: Users, roles: [] },
];

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/auth" }); return; }
      setEmail(session.user.email ?? "");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const ok = roles?.some((r) => ADMIN_ROLES.includes(r.role as string));
      if (!ok) { navigate({ to: "/dashboard" }); return; }
      setUserRoles((roles ?? []).map((r) => r.role as AppRole));
      setAllowed(true);
      setLoading(false);
    })();
  }, [navigate]);

  const isSuper = userRoles.includes("super_admin");
  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true; // overview
    if (isSuper) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });

  // Block direct URL access to disallowed sections
  useEffect(() => {
    if (!allowed) return;
    const current = navItems.find((i) => (i.exact ? path === i.to : path.startsWith(i.to)));
    if (!current) return;
    if (!current.roles) return;
    if (isSuper) return;
    const ok = current.roles.some((r) => userRoles.includes(r));
    if (!ok) navigate({ to: "/admin" });
  }, [path, allowed, isSuper, userRoles, navigate]);

  const handleLogout = async () => {
    try { await supabase.auth.signOut({ scope: "global" }); } catch {}
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("sb-") || k.includes("supabase")) localStorage.removeItem(k);
      });
      sessionStorage.clear();
    } catch {}
    window.location.replace("/");
  };

  if (loading || !allowed) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform`}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span>Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 hover:bg-muted rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "text-foreground/80 hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-muted-foreground">Signed in</p>
            <p className="text-xs font-medium truncate">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-muted transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {open && <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 z-30 bg-black/40" />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="p-1.5 hover:bg-muted rounded-md">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold">Admin Panel</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}