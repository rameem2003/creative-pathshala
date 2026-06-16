import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Fetches the given site_settings keys and subscribes to realtime updates.
export function useSiteSettings(keys) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const keyList = keys.join(",");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: rows } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", keys);
      if (!mounted) return;
      const map = {};
      (rows ?? []).forEach((r) => { map[r.key] = r.value; });
      setData(map);
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel(`site_settings_${keyList}_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload) => {
        const row = (payload.new ?? payload.old);
        if (!row?.key || !keys.includes(row.key)) return;
        setData((prev) => ({ ...prev, [row.key]: payload.new ? payload.new.value : undefined }));
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyList]);

  return { data, loading };
}