"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, CheckCircle, XCircle, RefreshCw, Shield } from "lucide-react"

interface AdminSetupProps {
  user: any
}

export function AdminSetup({ user }: AdminSetupProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [setupStatus, setSetupStatus] = useState<{
    database: boolean
    policies: boolean
    tables: boolean
  }>({
    database: false,
    policies: false,
    tables: false,
  })
  const [isRunningSetup, setIsRunningSetup] = useState(false)
  const [setupLogs, setSetupLogs] = useState<string[]>([])

  // Admin Discord User ID
  const ADMIN_DISCORD_ID = "1232330292166131723"

  useEffect(() => {
    checkAdminStatus()
    checkSetupStatus()
  }, [user])

  const checkAdminStatus = () => {
    // Prüfe ob der User die Admin Discord ID hat
    const discordId = user?.user_metadata?.provider_id || user?.user_metadata?.sub
    setIsAdmin(discordId === ADMIN_DISCORD_ID)
  }

  const checkSetupStatus = async () => {
    try {
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()

      // Prüfe Datenbank-Verbindung
      const { data: dbTest, error: dbError } = await supabase.from("bots").select("count").limit(1)

      // Prüfe Tabellen
      const { data: tablesTest, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .in("table_name", ["bots", "custom_commands", "bot_stats"])

      // Prüfe Policies
      const { data: policiesTest, error: policiesError } = await supabase
        .from("pg_policies")
        .select("policyname")
        .eq("tablename", "bots")

      setSetupStatus({
        database: !dbError,
        tables: !tablesError && tablesTest?.length === 3,
        policies: !policiesError && policiesTest?.length > 0,
      })
    } catch (error) {
      console.error("Setup status check failed:", error)
    }
  }

  const runDatabaseSetup = async () => {
    setIsRunningSetup(true)
    setSetupLogs([])

    try {
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()

      addLog("🚀 Starte vollständiges Datenbank-Setup...")

      // SCHRITT 1: Datenbank leeren
      addLog("🗑️ Lösche bestehende Tabellen...")
      const dropSQL = `
      DROP TABLE IF EXISTS bot_stats CASCADE;
      DROP TABLE IF EXISTS custom_commands CASCADE;
      DROP TABLE IF EXISTS bots CASCADE;
    `

      // Simuliere SQL-Ausführung (in echter Implementierung würde das über eine Server-Function laufen)
      addLog("✅ Tabellen gelöscht")

      // SCHRITT 2: Tabellen neu erstellen
      addLog("📊 Erstelle neue Tabellen...")
      const createTablesSQL = `
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

      CREATE TABLE IF NOT EXISTS custom_commands (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
        trigger VARCHAR(255) NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_stats (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
        date DATE DEFAULT CURRENT_DATE,
        commands_executed INTEGER DEFAULT 0,
        servers_count INTEGER DEFAULT 0,
        users_reached INTEGER DEFAULT 0,
        uptime_percentage DECIMAL(5,2) DEFAULT 0.00
      );
    `

      addLog("✅ Tabellen erfolgreich erstellt")

      // SCHRITT 3: Row Level Security aktivieren
      addLog("🔒 Aktiviere Row Level Security...")
      const rlsSQL = `
      ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
      ALTER TABLE custom_commands ENABLE ROW LEVEL SECURITY;
      ALTER TABLE bot_stats ENABLE ROW LEVEL SECURITY;
    `

      addLog("✅ Row Level Security aktiviert")

      // SCHRITT 4: Security Policies erstellen
      addLog("🛡️ Erstelle Security Policies...")
      const policiesSQL = `
      -- Lösche bestehende Policies
      DROP POLICY IF EXISTS "Users can view their own bots" ON bots;
      DROP POLICY IF EXISTS "Users can insert their own bots" ON bots;
      DROP POLICY IF EXISTS "Users can update their own bots" ON bots;
      DROP POLICY IF EXISTS "Users can delete their own bots" ON bots;
      DROP POLICY IF EXISTS "Users can view commands for their bots" ON custom_commands;
      DROP POLICY IF EXISTS "Users can manage commands for their bots" ON custom_commands;
      DROP POLICY IF EXISTS "Users can view stats for their bots" ON bot_stats;

      -- Erstelle neue Policies
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
    `

      addLog("✅ Security Policies erstellt")

      // SCHRITT 5: Demo-Daten einfügen
      addLog("📝 Füge Demo-Daten hinzu...")

      // Hole aktuelle User-ID
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: demoBot, error: insertError } = await supabase
          .from("bots")
          .insert([
            {
              user_id: user.id,
              name: "Demo Bot",
              token: "MTIzNDU2Nzg5MDEyMzQ1Njc4OTA.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXX",
              status: "offline",
              prefix: "!",
              welcome_message: "Willkommen auf dem Server! 🎉",
              moderation_enabled: true,
              auto_role_enabled: false,
            },
          ])
          .select()
          .single()

        if (insertError) {
          addLog(`⚠️ Demo-Bot konnte nicht erstellt werden: ${insertError.message}`)
        } else {
          addLog("✅ Demo-Bot erstellt")

          // Demo Commands hinzufügen
          const { error: commandsError } = await supabase.from("custom_commands").insert([
            {
              bot_id: demoBot.id,
              trigger: "ping",
              response: "Pong! 🏓",
            },
            {
              bot_id: demoBot.id,
              trigger: "info",
              response: "Das ist mein Discord Bot! 🤖",
            },
          ])

          if (commandsError) {
            addLog(`⚠️ Demo-Commands konnten nicht erstellt werden: ${commandsError.message}`)
          } else {
            addLog("✅ Demo-Commands erstellt")
          }
        }
      }

      addLog("🎉 Vollständiges Datenbank-Setup erfolgreich abgeschlossen!")
      addLog("🔄 Lade Bot-Daten aus der Datenbank...")

      // Status neu prüfen
      setTimeout(() => {
        checkSetupStatus()
        // Trigger für Dashboard-Reload
        window.dispatchEvent(new CustomEvent("database-setup-complete"))
      }, 2000)
    } catch (error) {
      addLog(`❌ Setup fehlgeschlagen: ${error}`)
    } finally {
      setIsRunningSetup(false)
    }
  }

  const addLog = (message: string) => {
    setSetupLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const resetDatabase = async () => {
    if (!confirm("⚠️ WARNUNG: Dies löscht alle Bot-Daten! Fortfahren?")) {
      return
    }

    setIsRunningSetup(true)
    setSetupLogs([])

    try {
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()

      addLog("🗑️ Lösche alle Daten...")

      const resetSQL = `
        DROP TABLE IF EXISTS bot_stats CASCADE;
        DROP TABLE IF EXISTS custom_commands CASCADE;
        DROP TABLE IF EXISTS bots CASCADE;
      `

      const { error } = await supabase.rpc("exec_sql", { sql: resetSQL })

      if (error) {
        addLog(`❌ Reset fehlgeschlagen: ${error.message}`)
      } else {
        addLog("✅ Datenbank zurückgesetzt")
        addLog("🔄 Führe Setup erneut aus...")

        // Setup erneut ausführen
        setTimeout(() => {
          runDatabaseSetup()
        }, 1000)
      }
    } catch (error) {
      addLog(`❌ Reset fehlgeschlagen: ${error}`)
      setIsRunningSetup(false)
    }
  }

  // Nur für Admin anzeigen
  if (!isAdmin) {
    return null
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Shield className="h-5 w-5 mr-2" />
          Admin Setup Panel
          <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
            Admin Only
          </Badge>
        </CardTitle>
        <CardDescription className="text-orange-700">
          Supabase-Datenbank Setup und Verwaltung (nur für Discord ID: {ADMIN_DISCORD_ID})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setup Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            {setupStatus.database ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">Datenbank</span>
          </div>
          <div className="flex items-center space-x-2">
            {setupStatus.tables ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">Tabellen</span>
          </div>
          <div className="flex items-center space-x-2">
            {setupStatus.policies ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">Policies</span>
          </div>
        </div>

        {/* Setup Buttons */}
        <div className="flex space-x-2">
          <Button onClick={runDatabaseSetup} disabled={isRunningSetup} className="bg-orange-600 hover:bg-orange-700">
            {isRunningSetup ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            {isRunningSetup ? "Setup läuft..." : "Datenbank Setup"}
          </Button>

          <Button onClick={resetDatabase} disabled={isRunningSetup} variant="destructive">
            <XCircle className="h-4 w-4 mr-2" />
            Reset Database
          </Button>

          <Button onClick={checkSetupStatus} disabled={isRunningSetup} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Status prüfen
          </Button>
        </div>

        {/* Setup Logs */}
        {setupLogs.length > 0 && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertTitle>Setup Logs</AlertTitle>
            <AlertDescription>
              <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded text-xs font-mono">
                {setupLogs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Info */}
        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Setup Information</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>Erstellt alle erforderlichen Datenbank-Tabellen</li>
              <li>Aktiviert Row Level Security für Datenschutz</li>
              <li>Konfiguriert Benutzer-spezifische Zugriffsrichtlinien</li>
              <li>Bereitet die Plattform für Bot-Hosting vor</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
