
REVOKE EXECUTE ON FUNCTION public.is_school_teacher(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_school_parent(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_school_student(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.parent_owns_student(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_school_teacher(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_parent(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.parent_owns_student(uuid, uuid) TO authenticated;
