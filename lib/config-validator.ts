"use client"

export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export class ConfigValidator {
  static async validateEnvironment(): Promise<ConfigValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Supabase Konfiguration prüfen
    const supabaseUrl = 'https://cubmcmzhmskcrfvrlmcc.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Ym1jbXpobXNrY3JmdnJsbWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDEzNDIsImV4cCI6MjA2NDg3NzM0Mn0.2eBgMujDLJ-Wf0QekVg3SFO-c9bnEZuu5aYDNtcNUO4'

    if (!supabaseUrl) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL ist nicht konfiguriert")
    } else if (!supabaseUrl.includes("supabase.co")) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL hat falsches Format")
    }

    if (!supabaseKey) {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY ist nicht konfiguriert")
    } else if (!supabaseKey.startsWith("eyJ")) {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY hat falsches Format (muss JWT sein)")
    }

    // Supabase-Verbindung testen
    try {
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()

      const { data, error } = await supabase.from("bots").select("count").limit(1)
      if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          errors.push("Datenbank-Tabellen sind nicht erstellt. Führe das SQL-Script aus.")
        } else if (error.message.includes("JWT")) {
          errors.push("Supabase JWT-Token ist ungültig oder abgelaufen")
        } else {
          errors.push(`Datenbank-Verbindung fehlgeschlagen: ${error.message}`)
        }
      }
    } catch (error) {
      errors.push(`Supabase-Client konnte nicht erstellt werden: ${error}`)
    }

    // Discord OAuth prüfen
    try {
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()

      const { data: providers } = await supabase.auth.getSession()
      // Hier würden wir normalerweise die verfügbaren OAuth-Provider prüfen
      // Das ist aber nur über die Admin-API möglich
    } catch (error) {
      warnings.push("Discord OAuth-Konfiguration konnte nicht geprüft werden")
    }

    // Browser-Kompatibilität prüfen
    if (typeof Worker === "undefined") {
      errors.push("Web Workers werden nicht unterstützt (für Bot-Engine erforderlich)")
    }

    if (typeof fetch === "undefined") {
      errors.push("Fetch API wird nicht unterstützt")
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  static validateBotConfig(config: any): ConfigValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Bot-Name ist erforderlich")
    }

    if (!config.token || config.token.trim().length === 0) {
      errors.push("Bot-Token ist erforderlich")
    }

    if (!config.prefix || config.prefix.trim().length === 0) {
      warnings.push("Kein Command-Prefix gesetzt")
    } else if (config.prefix.length > 5) {
      warnings.push("Command-Prefix ist sehr lang")
    }

    if (config.customCommands) {
      config.customCommands.forEach((cmd: any, index: number) => {
        if (!cmd.trigger || cmd.trigger.trim().length === 0) {
          errors.push(`Custom Command ${index + 1}: Trigger ist leer`)
        }
        if (!cmd.response || cmd.response.trim().length === 0) {
          errors.push(`Custom Command ${index + 1}: Antwort ist leer`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
