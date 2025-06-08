import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Shield, Zap, Settings, Users, MessageSquare } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">BotHost</span>
          </div>
          <Link href="/login">
            <Button>Mit Discord anmelden</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Discord Bots einfach hosten</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Erstelle und hoste deine Discord Bots mit nur wenigen Klicks. Keine Server-Konfiguration, keine Komplexität
            - einfach loslegen!
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-3">
              Jetzt starten
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Warum BotHost?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Schnell & Einfach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Bot-Token eingeben, konfigurieren und sofort online. Keine technischen Kenntnisse erforderlich.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Sicher & Zuverlässig</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Deine Bot-Tokens sind verschlüsselt gespeichert. 99.9% Uptime garantiert.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Vollständig Konfigurierbar</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Moderation, Musik, Custom Commands und mehr. Alles über ein benutzerfreundliches Panel.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bot Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Bot Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Moderation</h3>
              <p className="text-sm text-gray-600">Automatische Moderation und Admin-Tools</p>
            </div>
            <div className="text-center">
              <MessageSquare className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Custom Commands</h3>
              <p className="text-sm text-gray-600">Eigene Befehle und Antworten erstellen</p>
            </div>
            <div className="text-center">
              <Bot className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Auto-Rollen</h3>
              <p className="text-sm text-gray-600">Automatische Rollenvergabe</p>
            </div>
            <div className="text-center">
              <Zap className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Logs & Analytics</h3>
              <p className="text-sm text-gray-600">Detaillierte Server-Statistiken</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Bot className="h-6 w-6" />
            <span className="text-xl font-bold">BotHost</span>
          </div>
          <p className="text-gray-400">© 2024 BotHost. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}
