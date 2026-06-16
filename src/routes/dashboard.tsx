import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User as UserIcon, Mail, Shield } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Canvas Pathsala" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type Profile = { id: string; full_name: string | null; phone: string | null };

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadFor = async (userId: string, userEmail: string | null) => {
      const [{ data: prof }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (!mounted) return;
      setEmail(userEmail);
      setProfile(prof);
      setRoles((roleRows ?? []).map((r) => r.role as string));
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) { navigate({ to: "/auth" }); return; }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        loadFor(session.user.id, session.user.email ?? null);
      }
    });

    (async () => {
      // Re-validate the JWT with the auth server instead of trusting cached session
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        await supabase.auth.signOut().catch(() => {});
        navigate({ to: "/auth" });
        return;
      }
      await loadFor(data.user.id, data.user.email ?? null);
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-4">
              <div className="grid place-items-center w-16 h-16 rounded-2xl bg-[image:var(--gradient-hero)] text-primary-foreground text-2xl font-bold">
                {(profile?.full_name?.[0] || email?.[0] || "U").toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">স্বাগতম, {profile?.full_name || "শিক্ষার্থী"}</h1>
                <p className="text-sm text-muted-foreground">আপনার Canvas Pathsala ড্যাশবোর্ড</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <InfoCard icon={<UserIcon className="w-4 h-4" />} label="নাম" value={profile?.full_name || "—"} />
              <InfoCard icon={<Mail className="w-4 h-4" />} label="ইমেইল" value={email || "—"} />
              <InfoCard icon={<Shield className="w-4 h-4" />} label="ভূমিকা" value={roleLabel(roles)} />
            </div>

            {isAdminRole(roles) && (
              <div className="mt-8 p-5 rounded-xl border border-primary/30 bg-primary/5">
                <h2 className="font-semibold text-primary">Admin Panel</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  আপনি admin হিসেবে লগইন করেছেন। ব্যবস্থাপনা ড্যাশবোর্ডে প্রবেশ করুন।
                </p>
                <Link to="/admin" className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                  Open Admin Panel →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-background">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <p className="mt-1 text-sm font-medium break-words">{value}</p>
    </div>
  );
}

const ADMIN_ROLES = ["super_admin", "content_manager", "blog_manager", "routine_manager", "gallery_manager"];

function isAdminRole(roles: string[]) {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

function roleLabel(roles: string[]): string {
  if (roles.includes("super_admin")) return "সুপার অ্যাডমিন";
  if (roles.includes("content_manager")) return "Content Manager";
  if (roles.includes("blog_manager")) return "Blog Manager";
  if (roles.includes("routine_manager")) return "Routine Manager";
  if (roles.includes("gallery_manager")) return "Gallery Manager";
  return "Student";
}