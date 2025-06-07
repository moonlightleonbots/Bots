-- Create tables for bot hosting platform
-- Führe dieses Script in deinem Supabase SQL Editor aus

-- Users table (handled by Supabase Auth)
-- We'll use the auth.users table

-- Bots table
CREATE TABLE IF NOT EXISTS bots (
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
CREATE TABLE IF NOT EXISTS custom_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  trigger VARCHAR(255) NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot statistics table
CREATE TABLE IF NOT EXISTS bot_stats (
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

-- Insert some sample data for testing
INSERT INTO bots (user_id, name, token, status, prefix, welcome_message, moderation_enabled, auto_role_enabled) 
VALUES 
  (
    (SELECT id FROM auth.users LIMIT 1), 
    'Demo Bot', 
    'MTIzNDU2Nzg5MDEyMzQ1Njc4OTA.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXX',
    'offline',
    '!',
    'Willkommen auf dem Server! 🎉',
    true,
    false
  ) ON CONFLICT DO NOTHING;
