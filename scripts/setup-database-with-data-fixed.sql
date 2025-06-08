-- Create tables for bot hosting platform
-- Führe dieses Script in deinem Supabase SQL Editor aus

-- Drop existing tables if they exist
DROP TABLE IF EXISTS bot_stats CASCADE;
DROP TABLE IF EXISTS custom_commands CASCADE;
DROP TABLE IF EXISTS bots CASCADE;

-- Bots table
CREATE TABLE bots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'offline',
  prefix VARCHAR(10) DEFAULT '!',
  welcome_message TEXT,
  moderation_enabled BOOLEAN DEFAULT false,
  auto_role_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom commands table
CREATE TABLE custom_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  trigger VARCHAR(255) NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot statistics table
CREATE TABLE bot_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  commands_executed INTEGER DEFAULT 0,
  servers_count INTEGER DEFAULT 0,
  users_reached INTEGER DEFAULT 0,
  uptime_percentage DECIMAL(5,2) DEFAULT 0.00
);

-- Enable Row Level Security
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bots" ON bots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bots" ON bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots" ON bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots" ON bots
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view commands for their bots" ON custom_commands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bots 
      WHERE bots.id = custom_commands.bot_id 
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage commands for their bots" ON custom_commands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bots 
      WHERE bots.id = custom_commands.bot_id 
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view stats for their bots" ON bot_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bots 
      WHERE bots.id = bot_stats.bot_id 
      AND bots.user_id = auth.uid()
    )
  );

-- Funktion zum Erstellen von Demo-Daten für neue User
-- WICHTIG: Parameter umbenannt von user_id zu target_user_id um Mehrdeutigkeit zu vermeiden
CREATE OR REPLACE FUNCTION create_demo_data_for_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  bot_id UUID;
BEGIN
  -- Erstelle Demo-Bot 1: Willkommens Bot
  INSERT INTO bots (user_id, name, token, status, prefix, welcome_message, moderation_enabled, auto_role_enabled)
  VALUES (
    target_user_id,
    'Willkommens Bot',
    'MTIzNDU2Nzg5MDEyMzQ1Njc4OTA.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXX',
    'offline',
    '!',
    'Willkommen auf unserem Discord Server! 🎉 Schön, dass du da bist!',
    true,
    true
  ) RETURNING id INTO bot_id;

  -- Erstelle Demo Custom Commands für Willkommens Bot
  INSERT INTO custom_commands (bot_id, trigger, response) VALUES
    (bot_id, 'ping', 'Pong! 🏓 Der Bot ist online und bereit!'),
    (bot_id, 'info', 'Ich bin ein Discord Bot, der dir bei allem hilft! 🤖'),
    (bot_id, 'hilfe', 'Verfügbare Commands: !ping, !info, !hilfe, !server'),
    (bot_id, 'server', 'Dieser Server ist der beste Discord Server! 🌟');

  -- Erstelle Demo-Bot 2: Moderations Bot
  INSERT INTO bots (user_id, name, token, status, prefix, welcome_message, moderation_enabled, auto_role_enabled)
  VALUES (
    target_user_id,
    'Moderations Bot',
    'OTg3NjU0MzIxMDk4NzY1NDMyMQ.YYYYYY.YYYYYYYYYYYYYYYYYYYYYYYY',
    'offline',
    '?',
    'Willkommen! Bitte beachte die Serverregeln. 📋',
    true,
    false
  ) RETURNING id INTO bot_id;

  -- Erstelle Commands für Moderations Bot
  INSERT INTO custom_commands (bot_id, trigger, response) VALUES
    (bot_id, 'regeln', 'Hier sind unsere Serverregeln: 1. Sei respektvoll 2. Kein Spam 3. Hab Spaß! 📜'),
    (bot_id, 'mute', 'Moderation: User wurde stummgeschaltet 🔇'),
    (bot_id, 'warn', 'Warnung ausgesprochen! ⚠️');

  -- Erstelle Demo-Bot 3: Musik Bot
  INSERT INTO bots (user_id, name, token, status, prefix, welcome_message, moderation_enabled, auto_role_enabled)
  VALUES (
    target_user_id,
    'Musik Bot',
    'NTQzMjEwOTg3NjU0MzIxMDk4Nw.ZZZZZZ.ZZZZZZZZZZZZZZZZZZZZZZZZ',
    'online',
    '♪',
    'Lass uns zusammen Musik hören! 🎵',
    false,
    false
  ) RETURNING id INTO bot_id;

  -- Erstelle Commands für Musik Bot
  INSERT INTO custom_commands (bot_id, trigger, response) VALUES
    (bot_id, 'play', 'Spiele Musik ab! 🎵 Welchen Song möchtest du hören?'),
    (bot_id, 'stop', 'Musik gestoppt! ⏹️'),
    (bot_id, 'skip', 'Song übersprungen! ⏭️'),
    (bot_id, 'queue', 'Hier ist die aktuelle Warteschlange: 📝');

  -- Erstelle Demo-Statistiken für alle Bots des Users
  -- WICHTIG: Verwende bots.user_id um Mehrdeutigkeit zu vermeiden
  INSERT INTO bot_stats (bot_id, commands_executed, servers_count, users_reached, uptime_percentage)
  SELECT bots.id, 
         (random() * 1000)::integer,
         (random() * 50 + 1)::integer,
         (random() * 5000 + 100)::integer,
         (random() * 20 + 80)::numeric(5,2)
  FROM bots WHERE bots.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger zum automatischen Erstellen von Demo-Daten für neue User
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Erstelle Demo-Daten für den neuen User
  PERFORM create_demo_data_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger aktivieren (falls noch nicht vorhanden)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Für bestehende User: Erstelle Demo-Daten falls noch keine Bots vorhanden
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Prüfe ob User bereits Bots hat
    IF NOT EXISTS (SELECT 1 FROM bots WHERE user_id = user_record.id) THEN
      PERFORM create_demo_data_for_user(user_record.id);
    END IF;
  END LOOP;
END $$;
