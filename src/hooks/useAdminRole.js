import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminRole() {
  const [roles, setRoles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (mounted) setLoading(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      if (!mounted) return;
      setUserId(session.user.id);
      setRoles(((data ?? []).map((r) => r.role)));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const isSuper = roles.includes("super_admin");
  const has = (r) => isSuper || roles.includes(r);

  return { roles, userId, loading, isSuper, has };
}