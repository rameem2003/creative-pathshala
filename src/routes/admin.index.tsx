import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, FileText, Video, Image as ImageIcon, CalendarDays, ClipboardList, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

function Overview() {
  const [stats, setStats] = useState({ notices: 0, blogs: 0, videos: 0, gallery: 0, routines: 0, admissions: 0, pending: 0 });

  useEffect(() => {
    (async () => {
      const tables = ["notices", "blogs", "videos", "gallery", "routines", "admissions"] as const;
      const results = await Promise.all(tables.map((t) => supabase.from(t).select("*", { count: "exact", head: true })));
      const { count: pending } = await supabase.from("admissions").select("*", { count: "exact", head: true }).eq("status", "pending");
      setStats({
        notices: results[0].count ?? 0,
        blogs: results[1].count ?? 0,
        videos: results[2].count ?? 0,
        gallery: results[3].count ?? 0,
        routines: results[4].count ?? 0,
        admissions: results[5].count ?? 0,
        pending: pending ?? 0,
      });
    })();
  }, []);

  const cards = [
    { icon: Megaphone, label: "Notices", value: stats.notices, color: "from-blue-500 to-indigo-600" },
    { icon: FileText, label: "Blogs", value: stats.blogs, color: "from-emerald-500 to-teal-600" },
    { icon: Video, label: "Videos", value: stats.videos, color: "from-rose-500 to-pink-600" },
    { icon: ImageIcon, label: "Gallery", value: stats.gallery, color: "from-amber-500 to-orange-600" },
    { icon: CalendarDays, label: "Routines", value: stats.routines, color: "from-violet-500 to-purple-600" },
    { icon: ClipboardList, label: "Admissions", value: stats.admissions, color: "from-cyan-500 to-sky-600" },
    { icon: Users, label: "Pending Admissions", value: stats.pending, color: "from-red-500 to-orange-600" },
  ];

  return (
    <div>
      <PageHeader title="Welcome to Admin Panel" subtitle="Canvas Pathsala সম্পূর্ণ ব্যবস্থাপনা সিস্টেম" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <div className={`inline-grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br ${color} text-white mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}