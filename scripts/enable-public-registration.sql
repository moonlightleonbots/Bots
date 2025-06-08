-- Öffentliche Registrierung für alle Discord-Benutzer aktivieren
-- Führe dieses Script in deinem Supabase SQL Editor aus

-- 1. Stelle sicher, dass neue Benutzer sich registrieren können
-- (Supabase Auth sollte standardmäßig öffentliche Registrierung erlauben)

-- 2. Aktualisiere die RLS-Policies um sicherzustellen, dass sie für alle Benutzer funktionieren
-- (Die bestehenden Policies sind bereits korrekt konfiguriert)

-- 3. Stelle sicher, dass der Trigger für neue Benutzer funktioniert
-- Überprüfe ob der Trigger existiert
SELECT EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
);

-- Falls der Trigger nicht existiert, erstelle ihn erneut
DO $$
BEGIN
  -- Prüfe ob Trigger existiert
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    -- Erstelle Trigger für neue Benutzer
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    
    RAISE NOTICE 'Trigger on_auth_user_created wurde erstellt';
  ELSE
    RAISE NOTICE 'Trigger on_auth_user_created existiert bereits';
  END IF;
END $$;

-- 4. Teste die Demo-Daten-Funktion
-- Diese Funktion wird automatisch für neue Benutzer aufgerufen
SELECT 'Demo-Daten-Funktion ist verfügbar' as status 
WHERE EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'create_demo_data_for_user'
);

-- 5. Zeige aktuelle Benutzer-Statistiken
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_today
FROM auth.users;

-- 6. Zeige Bot-Statistiken
SELECT 
  COUNT(*) as total_bots,
  COUNT(DISTINCT user_id) as users_with_bots
FROM bots;
