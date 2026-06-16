import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_ROLES = [
  "super_admin",
  "content_manager",
  "blog_manager",
  "routine_manager",
  "gallery_manager",
] as const;
const RoleSchema = z.enum(ADMIN_ROLES);

async function assertSuperAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super_admin only");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);

    const { data: roleRows, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ADMIN_ROLES as unknown as any);
    if (roleErr) throw new Error(roleErr.message);

    const ids = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));
    if (ids.length === 0) return { admins: [] };

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, phone, is_active")
      .in("id", ids);

    // Fetch auth user emails + last_sign_in via admin API
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const roleMap = new Map<string, string>();
    (roleRows ?? []).forEach((r) => roleMap.set(r.user_id, r.role));

    const admins = await Promise.all(
      ids.map(async (id) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
        const prof = profileMap.get(id);
        return {
          user_id: id,
          email: u?.user?.email ?? "",
          full_name: prof?.full_name ?? "",
          avatar_url: prof?.avatar_url ?? null,
          is_active: prof?.is_active ?? true,
          role: roleMap.get(id) ?? "user",
          last_sign_in_at: u?.user?.last_sign_in_at ?? null,
          created_at: u?.user?.created_at ?? null,
        };
      }),
    );

    return { admins };
  });

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email().max(255),
        password: z.string().min(8).max(72),
        full_name: z.string().trim().min(1).max(100),
        role: RoleSchema,
        avatar_url: z.string().url().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const newUserId = created.user!.id;

    // handle_new_user trigger creates a default 'user' row; replace with chosen role.
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: data.role });
    if (roleErr) throw new Error(roleErr.message);

    await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      full_name: data.full_name,
      avatar_url: data.avatar_url ?? null,
      is_active: true,
    });

    return { ok: true, user_id: newUserId };
  });

export const updateAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        full_name: z.string().trim().min(1).max(100).optional(),
        role: RoleSchema.optional(),
        is_active: z.boolean().optional(),
        avatar_url: z.string().url().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    if (data.user_id === context.userId && data.role && data.role !== "super_admin") {
      throw new Error("You cannot demote your own super admin role.");
    }
    if (data.user_id === context.userId && data.is_active === false) {
      throw new Error("You cannot deactivate your own account.");
    }

    const profPatch: Record<string, any> = {};
    if (data.full_name !== undefined) profPatch.full_name = data.full_name;
    if (data.is_active !== undefined) profPatch.is_active = data.is_active;
    if (data.avatar_url !== undefined) profPatch.avatar_url = data.avatar_url;
    if (Object.keys(profPatch).length > 0) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(profPatch as any)
        .eq("id", data.user_id);
      if (error) throw new Error(error.message);
    }

    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role });
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account.");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid(), new_password: z.string().min(8).max(72) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.new_password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
