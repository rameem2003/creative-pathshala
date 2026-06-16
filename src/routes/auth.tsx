import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login / Sign Up — Canvas Pathsala" },
      { name: "description", content: "Canvas Pathsala অ্যাকাউন্টে লগইন করুন বা নতুন অ্যাকাউন্ট তৈরি করুন।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings(["site_name", "site_tagline"]);
  const siteName = (settings["site_name"]?.v as string) || "Canvas Pathsala";
  const tagline = (settings["site_tagline"]?.v as string) || "শিক্ষা হোক সহজ ও আনন্দময়";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "একটি সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      setError("পাসওয়ার্ড রিসেট করতে প্রথমে ইমেইল লিখুন।");
      return;
    }
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) setError(error.message);
    else setInfo("পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।");
  };

  return (
    <Layout>
      <section className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mx-auto">
              <BrandLogo className="w-14 h-14 rounded-2xl" iconClassName="w-7 h-7" alt={siteName} />
            </div>
            <h1 className="mt-4 text-2xl font-bold">
              {mode === "login" ? "লগইন করুন" : "নতুন অ্যাকাউন্ট"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {siteName} — {tagline}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted mb-5">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`py-2 rounded-md text-sm font-semibold transition ${
                  mode === "login" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`py-2 rounded-md text-sm font-semibold transition ${
                  mode === "signup" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <Field icon={<User className="w-4 h-4" />} label="পুরো নাম">
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="আপনার নাম"
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </Field>
              )}
              <Field icon={<Mail className="w-4 h-4" />} label="ইমেইল">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none text-sm"
                />
              </Field>
              <Field icon={<Lock className="w-4 h-4" />} label="পাসওয়ার্ড">
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-sm"
                />
              </Field>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-primary">{info}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-[var(--shadow-soft)] disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "login" ? "লগইন" : "সাইন আপ"}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={handleForgot}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              )}
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link to="/" className="hover:text-primary">← হোমে ফিরে যান</Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background focus-within:border-primary transition">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}