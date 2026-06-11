CREATE OR REPLACE FUNCTION delete_user_completely(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Supprimer le profil
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- 2. Supprimer les logs d'audit liés à cet utilisateur
  DELETE FROM public.audit_logs WHERE user_id = p_user_id;
  
  -- 3. Supprimer les éventuels fichiers uploadés par cet utilisateur dans le Storage
  DELETE FROM storage.objects WHERE owner = p_user_id;
  
  -- 4. Enfin, supprimer le compte d'authentification
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
