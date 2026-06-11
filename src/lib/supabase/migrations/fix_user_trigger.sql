-- Remplacer la fonction du trigger de création d'utilisateur pour NE PAS créer d'entreprise automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Créer uniquement le profil, en laissant le workspace_id à NULL
  INSERT INTO public.profiles (id, full_name, email, role, workspace_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    'user',
    NULL
  );
  
  RETURN NEW;
END;
$$;
