"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Shield, Zap, Info } from "lucide-react"

export function PublicRegistrationInfo() {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Öffentliche Registrierung aktiviert!</strong> Jeder Discord-Benutzer kann sich jetzt anmelden und
          sofort mit Demo-Bots loslegen.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Für alle offen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Jeder Discord-Benutzer kann sich anmelden - keine Einschränkungen oder Wartelisten.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Sofort loslegen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Neue Benutzer erhalten automatisch 3 Demo-Bots zum Testen und Experimentieren.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Sicher & Privat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Jeder Benutzer sieht nur seine eigenen Bots - vollständige Datentrennung durch RLS.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
