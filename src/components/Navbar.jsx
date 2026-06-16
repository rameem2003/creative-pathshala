import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, User as UserIcon, LayoutDashboard, LogOut, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo, FaviconSync } from "@/components/BrandLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const navItems = [
  { to: "/", label: "হোম" },
  { to: "/about", label: "আমাদের সম্পর্কে" },
  { to: "/courses", label: "কোর্সসমূহ" },
  { to: "/notice", label: "নোটিশ ও রুটিন" },
  { to: "/video-blog", label: "ভিডিও ও ব্লগ" },
  { to: "/contact", label: "যোগাযোগ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {}
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("sb-") || k.includes("supabase")) localStorage.removeItem(k);
      });
      sessionStorage.clear();
    } catch {}
    setMenuOpen(false);
    // Hard reload to wipe any in-memory auth/role cache
    window.location.replace("/");
  };

  const initial = (email?.[0] || "U").toUpperCase();
  const { data: settings } = useSiteSettings(["site_name"]);
  const siteName = settings["site_name"]?.v || "Canvas Pathsala";

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border">
      <FaviconSync />
      <nav className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 md:gap-3 group">
          <BrandLogo
            className="w-10 h-10 md:w-11 md:h-11 lg:w-18 lg:h-18 shrink-0"
            iconClassName="w-5 h-5 md:w-6 md:h-6"
            alt={siteName}
          />
          <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent font-extrabold text-xl md:text-2xl lg:text-[1.7rem] tracking-tight leading-none group-hover:opacity-90 transition-opacity">
            {siteName}
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted transition-colors"
                activeProps={{
                  className: "px-3 py-2 rounded-lg text-sm font-semibold text-primary bg-muted",
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/admission"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 hover:shadow-md transition shadow-[var(--shadow-soft)]"
          >
            ভর্তি হোন
          </Link>

          {email ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="User menu"
                className="grid place-items-center w-9 h-9 rounded-full bg-[image:var(--gradient-hero)] text-primary-foreground text-sm font-bold hover:scale-105 transition shadow-[var(--shadow-soft)]"
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground">সাইন ইন করা</p>
                    <p className="text-sm font-medium truncate">{email}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition"
                  >
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition border-t border-border"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary/40 text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition"
            >
              <LogIn className="w-4 h-4" />
              Login / Sign Up
            </Link>
          )}

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
          <ul className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-foreground/90 hover:bg-muted"
                  activeProps={{
                    className: "block px-3 py-2 rounded-lg text-primary font-semibold bg-muted",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-border mt-2 pt-2">
              {email ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg text-foreground/90 hover:bg-muted"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-destructive hover:bg-muted"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-primary font-semibold hover:bg-muted"
                >
                  Login / Sign Up
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
