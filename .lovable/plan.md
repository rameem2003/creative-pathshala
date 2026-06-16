## Multi Admin Management System

### 1. Database (migration)
- `app_role` enum এ `gallery_manager` যোগ করা।
- `profiles` table এ `is_active boolean default true` ও (optional) `avatar_url` already আছে।
- নতুন function: `current_user_role()` — সবচেয়ে high-privilege role return করবে (super_admin > অন্যান্য)।
- RLS update:
  - **Notices/Routines** — write এখন `has_role(super_admin) OR has_role(routine_manager)` দিয়ে gated।
  - **Blogs/Videos** — `super_admin OR blog_manager`।
  - **Home/About/Courses/Settings** — `super_admin OR content_manager`।
  - **Gallery** — `super_admin OR gallery_manager`।
  - **Admissions/Results** — `super_admin` only (sensitive)।
  - `user_roles` insert/update/delete — শুধু `super_admin`।
  - `profiles` — super_admin সব profile দেখতে/edit করতে পারবে।

### 2. Server functions (`src/lib/admins.functions.ts`)
Service-role দরকার (user create/delete/password-reset), তাই `supabaseAdmin` ব্যবহার, `requireSupabaseAuth` middleware + manual super_admin check:
- `listAdmins()` — সব admin (profile + role + email + last_sign_in)।
- `createAdmin({ email, password, full_name, role, avatar_url })` — `auth.admin.createUser` + role insert।
- `updateAdmin({ user_id, full_name, role, is_active, avatar_url })`।
- `deleteAdmin({ user_id })` — `auth.admin.deleteUser`।
- `resetAdminPassword({ user_id, new_password })`।
- প্রতিটিতে caller-এর super_admin check।

`src/start.ts` এ `attachSupabaseAuth` registered কিনা verify করব।

### 3. Role-based UI guard
- নতুন hook `useAdminRole()` — current user-এর সব role return করে।
- `src/routes/admin.tsx`:
  - প্রতি nav item এ `roles: AppRole[]` যোগ — শুধু allowed role-এর menu দেখাবে।
  - "Admin Management" item শুধু super_admin দেখবে।
  - Path-based guard: current route allowed না হলে `/admin` এ redirect।

### 4. নতুন page `/admin/admins` (super_admin only)
- Table: avatar, name, email, role badge, status, last sign-in, actions।
- Search + role filter।
- "Add Admin" modal: full_name, email, password, role select, avatar upload (existing `media/branding` bucket reuse → `media/avatars`)।
- Edit modal: name, role, status toggle।
- "Reset Password" + "Delete" actions, confirm dialog সহ।

### 5. Files
- `supabase/migrations/<ts>_multi_admin.sql` (new)
- `src/lib/admins.functions.ts` (new)
- `src/hooks/useAdminRole.ts` (new)
- `src/routes/admin.admins.tsx` (new)
- `src/routes/admin.tsx` (edit — role-filtered nav + per-route gate)

### Notes
- Email/password auth ইতিমধ্যে enabled — auto-confirm করব এই admin-created accounts-এর জন্য (createUser এ `email_confirm: true`)।
- Avatar upload existing `cropImage` helper দিয়ে 1:1 crop।
- "Login Activity" বলতে `auth.users.last_sign_in_at` দেখানো হবে (extra logging table এই round-এ skip)।

Confirm করলে migration থেকে শুরু করব।
