"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, RefreshCw, Database } from "lucide-react"

interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface ConfigCheckProps {
  onValidationComplete?: (result: ConfigValidationResult) => void
}

export function ConfigCheck({ onValidationComplete }: ConfigCheckProps) {
  const [validation, setValidation] = useState<ConfigValidationResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const runValidation = async () => {
    setIsChecking(true)
    try {
      const errors: string[] = []
      const warnings: string[] = []

      // Supabase Konfiguration prüfen
      const supabaseUrl = "https://cubmcmzhmskcrfvrlmcc.supabase.co"
      const supabaseKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Ym1jbXpobXNrY3JmdnJsbWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDEzNDIsImV4cCI6MjA2NDg3NzM0Mn0.2eBgMujDLJ-Wf0QekVg3SFO-c9bnEZuu5aYDNtcNUO4"

      if (!supabaseUrl) {
        errors.push("NEXT_PUBLIC_SUPABASE_URL ist nicht konfiguriert")
      }

      if (!supabaseKey) {
        errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY ist nicht konfiguriert")
      }

      // Supabase-Verbindung testen
      try {
        const { createClient } = await import("@/lib/supabase")
        const supabase = createClient()

        const { data, error } = await supabase.from("bots").select("count").limit(1)
        if (error) {
          if (error.message.includes("relation") && error.message.includes("does not exist")) {
            errors.push("Datenbank-Tabellen sind nicht erstellt. Führe das SQL-Script aus.")
          } else {
            errors.push(`Datenbank-Verbindung fehlgeschlagen: ${error.message}`)
          }
        }
      } catch (error) {
        errors.push(`Supabase-Client konnte nicht erstellt werden: ${error}`)
      }

      const result = {
        valid: errors.length === 0,
        errors,
        warnings,
      }

      setValidation(result)
      onValidationComplete?.(result)
    } catch (error) {
      setValidation({
        valid: false,
        errors: [`Validierung fehlgeschlagen: ${error}`],
        warnings: [],
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    runValidation()
  }, [])

  if (!validation && !isChecking) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          {isChecking ? (
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          ) : validation?.valid ? (
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 mr-2 text-red-600" />
          )}
          Konfigurationsprüfung
        </CardTitle>
        <CardDescription>
          {isChecking
            ? "Prüfe Konfiguration..."
            : validation?.valid
              ? "Alle Konfigurationen sind korrekt"
              : "Es wurden Konfigurationsprobleme gefunden"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {validation?.errors && validation.errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Fehler gefunden</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation?.warnings && validation.warnings.length > 0 && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Warnungen</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={runValidation} disabled={isChecking} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
          Erneut prüfen
        </Button>
      </CardContent>
    </Card>
  )
}
