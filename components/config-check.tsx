"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { ConfigValidator, type ConfigValidationResult } from "@/lib/config-validator"

interface ConfigCheckProps {
  onValidationComplete?: (result: ConfigValidationResult) => void
}

export function ConfigCheck({ onValidationComplete }: ConfigCheckProps) {
  const [validation, setValidation] = useState<ConfigValidationResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const runValidation = async () => {
    setIsChecking(true)
    try {
      const result = await ConfigValidator.validateEnvironment()
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
            <AlertTriangle className="h-4 w-4" />
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
