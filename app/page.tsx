import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Shield, Zap, Settings, Users, MessageSquare, Sparkles } from "lucide-react"

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
            <Button>Kostenlos starten</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-6">
            <Alert className="max-w-2xl mx-auto mb-8">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Jetzt für alle verfügbar!</strong> Keine Warteliste, keine Einschränkungen - einfach mit Discord
                anmelden und loslegen! 🚀
              </AlertDescription>
            </Alert>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">Discord Bots einfach hosten</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Erstelle und hoste deine Discord Bots mit nur wenigen Klicks. Keine Server-Konfiguration, keine Komplexität
            - einfach loslegen! <strong>Für jeden Discord-Benutzer kostenlos verfügbar.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-3">
                Jetzt kostenlos starten
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Demo ansehen
            </Button>
          </div>

          <div className="mt-8 text-sm text-gray-600">
            ✅ Keine Registrierung erforderlich • ✅ Sofort 3 Demo-Bots • ✅ Komplett kostenlos
          </div>
        </div>
      </section>

      {/* Öffentliche Verfügbarkeit */}
      <section className="py-16 px-4 bg-indigo-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Für jeden Discord-Benutzer verfügbar</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Keine Einschränkungen</h3>
              <p className="text-gray-600">
                Jeder Discord-Benutzer kann sich anmelden. Keine Wartelisten, keine Genehmigungen, keine Limits.
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sofort einsatzbereit</h3>
              <p className="text-gray-600">
                Nach der Anmeldung erhältst du automatisch 3 vorkonfigurierte Demo-Bots zum Testen.
              </p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sicher & Privat</h3>
              <p className="text-gray-600">
                Deine Bots und Daten sind vollständig privat. Jeder Benutzer sieht nur seine eigenen Bots.
              </p>
            </div>
          </div>
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
                  Mit Discord anmelden, Bot-Token eingeben und sofort online. Keine technischen Kenntnisse erforderlich.
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
                  Deine Bot-Tokens sind verschlüsselt gespeichert. 99.9% Uptime garantiert. Vollständige Datentrennung.
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

      {/* CTA Section */}
      <section className="py-16 px-4 bg-indigo-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit zum Starten?</h2>
          <p className="text-xl mb-8 opacity-90">
            Melde dich jetzt mit Discord an und erhalte sofort Zugang zu deinem Bot-Dashboard!
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Jetzt kostenlos starten
            </Button>
          </Link>
          <div className="mt-6 text-sm opacity-75">
            Keine Kreditkarte erforderlich • Sofort verfügbar • Für alle Discord-Benutzer
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
          <div className="mt-4 space-x-4 text-sm">
            <a href="#" className="text-gray-400 hover:text-white">
              Datenschutz
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              Nutzungsbedingungen
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
