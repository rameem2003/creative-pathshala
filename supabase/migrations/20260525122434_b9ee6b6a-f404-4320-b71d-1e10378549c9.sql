
-- Lock down trigger-only functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Tighten admissions insert policy (replace blanket true)
DROP POLICY IF EXISTS "admissions_public_insert" ON public.admissions;
CREATE POLICY "admissions_public_insert" ON public.admissions
  FOR INSERT
  WITH CHECK (
    length(trim(student_name)) BETWEEN 2 AND 100
    AND length(trim(parent_name)) BETWEEN 2 AND 100
    AND length(trim(phone)) BETWEEN 6 AND 20
    AND length(trim(class_applying)) BETWEEN 1 AND 50
    AND status = 'pending'
    AND admin_notes IS NULL
  );
