"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bot, Plus, Activity, Users, MessageSquare, Shield, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { BotManager } from "@/lib/bot-manager"
import { ConfigValidator } from "@/lib/config-validator"
import { ConfigCheck } from "@/components/config-check"

interface BotConfig {
  id: string
  name: string
  token: string
  status: "online" | "offline" | "starting" | "error"
  prefix: string
  welcomeMessage: string
  moderationEnabled: boolean
  autoRoleEnabled: boolean
  customCommands: Array<{
    trigger: string
    response: string
  }>
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [bots, setBots] = useState<BotConfig[]>([])
  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null)
  const [showAddBot, setShowAddBot] = useState(false)
  const [newBotToken, setNewBotToken] = useState("")
  const [newBotName, setNewBotName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [botManager] = useState(() => BotManager.getInstance())
  const [configValid, setConfigValid] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Only import and use Supabase on the client side
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUser(user)
      loadBots()
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  const loadBots = () => {
    // Simulierte Bot-Daten
    const mockBots: BotConfig[] = [
      {
        id: "1",
        name: "MeinBot",
        token: "MTIzNDU2Nzg5MDEyMzQ1Njc4OTA.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXX",
        status: "online",
        prefix: "!",
        welcomeMessage: "Willkommen auf dem Server!",
        moderationEnabled: true,
        autoRoleEnabled: false,
        customCommands: [
          { trigger: "ping", response: "Pong!" },
          { trigger: "info", response: "Das ist mein Discord Bot!" },
        ],
      },
    ]
    setBots(mockBots)
    if (mockBots.length > 0) {
      setSelectedBot(mockBots[0])
    }
  }

  const handleLogout = async () => {
    try {
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/")
    }
  }

  const addBot = async () => {
    if (!newBotToken || !newBotName) return

    // Token validieren
    const tokenValidation = await botManager.validateToken(newBotToken)
    if (!tokenValidation.valid) {
      alert(`Token-Fehler: ${tokenValidation.error}`)
      return
    }

    const newBot: BotConfig = {
      id: Date.now().toString(),
      name: newBotName,
      token: newBotToken,
      status: "offline",
      prefix: "!",
      welcomeMessage: "Willkommen!",
      moderationEnabled: false,
      autoRoleEnabled: false,
      customCommands: [],
    }

    // Bot-Konfiguration validieren
    const configValidation = ConfigValidator.validateBotConfig(newBot)
    if (!configValidation.valid) {
      alert(`Konfigurationsfehler: ${configValidation.errors.join(", ")}`)
      return
    }

    setBots([...bots, newBot])
    setSelectedBot(newBot)
    setShowAddBot(false)
    setNewBotToken("")
    setNewBotName("")
  }

  const updateBot = (updates: Partial<BotConfig>) => {
    if (!selectedBot) return

    const updatedBot = { ...selectedBot, ...updates }
    setBots(bots.map((bot) => (bot.id === selectedBot.id ? updatedBot : bot)))
    setSelectedBot(updatedBot)
  }

  const toggleBotStatus = async () => {
    if (!selectedBot) return

    if (selectedBot.status === "online") {
      const result = await botManager.stopBot(selectedBot.id)
      if (!result.success) {
        alert(`Bot-Stop fehlgeschlagen: ${result.error}`)
        return
      }
      updateBot({ status: "offline" })
    } else {
      const result = await botManager.startBot(selectedBot)
      if (!result.success) {
        alert(`Bot-Start fehlgeschlagen: ${result.error}`)
        return
      }
      updateBot({ status: "starting" })

      // Status-Updates vom BotManager abonnieren
      const checkStatus = () => {
        const botStatus = botManager.getBotStatus(selectedBot.id)
        if (botStatus && botStatus.status !== selectedBot.status) {
          updateBot({ status: botStatus.status })
          if (botStatus.error) {
            alert(`Bot-Fehler: ${botStatus.error}`)
          }
        }
      }

      const interval = setInterval(checkStatus, 1000)
      setTimeout(() => clearInterval(interval), 10000) // 10 Sekunden überwachen
    }
  }

  const addCustomCommand = () => {
    if (!selectedBot) return

    const newCommands = [...selectedBot.customCommands, { trigger: "", response: "" }]
    updateBot({ customCommands: newCommands })
  }

  const updateCustomCommand = (index: number, field: "trigger" | "response", value: string) => {
    if (!selectedBot) return

    const newCommands = [...selectedBot.customCommands]
    newCommands[index][field] = value
    updateBot({ customCommands: newCommands })
  }

  const removeCustomCommand = (index: number) => {
    if (!selectedBot) return

    const newCommands = selectedBot.customCommands.filter((_, i) => i !== index)
    updateBot({ customCommands: newCommands })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Bot className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold">BotHost Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Hallo, {user.user_metadata?.full_name || user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <ConfigCheck onValidationComplete={(result) => setConfigValid(result.valid)} />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r min-h-screen p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Meine Bots</h2>
            <Button size="sm" onClick={() => setShowAddBot(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {showAddBot && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Neuen Bot hinzufügen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Bot Name" value={newBotName} onChange={(e) => setNewBotName(e.target.value)} />
                <Input
                  placeholder="Bot Token"
                  type="password"
                  value={newBotToken}
                  onChange={(e) => setNewBotToken(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={addBot}>
                    Hinzufügen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddBot(false)}>
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedBot?.id === bot.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedBot(bot)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{bot.name}</span>
                  <Badge
                    variant={
                      bot.status === "online"
                        ? "default"
                        : bot.status === "starting"
                          ? "secondary"
                          : bot.status === "error"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {bot.status === "starting" ? "Startet..." : bot.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedBot ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedBot.name}</h2>
                  <p className="text-gray-600">Bot Konfiguration</p>
                </div>
                <Button onClick={toggleBotStatus}>
                  {selectedBot.status === "online" ? "Bot stoppen" : "Bot starten"}
                </Button>
              </div>

              <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="general">Allgemein</TabsTrigger>
                  <TabsTrigger value="moderation">Moderation</TabsTrigger>
                  <TabsTrigger value="commands">Commands</TabsTrigger>
                  <TabsTrigger value="stats">Statistiken</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Grundeinstellungen</CardTitle>
                      <CardDescription>Konfiguriere die grundlegenden Bot-Einstellungen</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="prefix">Command Prefix</Label>
                        <Input
                          id="prefix"
                          value={selectedBot.prefix}
                          onChange={(e) => updateBot({ prefix: e.target.value })}
                          placeholder="!"
                        />
                      </div>

                      <div>
                        <Label htmlFor="welcome">Willkommensnachricht</Label>
                        <Textarea
                          id="welcome"
                          value={selectedBot.welcomeMessage}
                          onChange={(e) => updateBot({ welcomeMessage: e.target.value })}
                          placeholder="Willkommen auf dem Server!"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-role"
                          checked={selectedBot.autoRoleEnabled}
                          onCheckedChange={(checked) => updateBot({ autoRoleEnabled: checked })}
                        />
                        <Label htmlFor="auto-role">Automatische Rollenvergabe</Label>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="moderation" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Moderation
                      </CardTitle>
                      <CardDescription>Konfiguriere Moderations-Features für deinen Server</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="moderation"
                          checked={selectedBot.moderationEnabled}
                          onCheckedChange={(checked) => updateBot({ moderationEnabled: checked })}
                        />
                        <Label htmlFor="moderation">Moderation aktivieren</Label>
                      </div>

                      {selectedBot.moderationEnabled && (
                        <div className="space-y-4 pl-6 border-l-2 border-indigo-200">
                          <div className="flex items-center space-x-2">
                            <Switch id="auto-mod" />
                            <Label htmlFor="auto-mod">Auto-Moderation</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="spam-filter" />
                            <Label htmlFor="spam-filter">Spam-Filter</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="bad-words" />
                            <Label htmlFor="bad-words">Schimpfwort-Filter</Label>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="commands" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MessageSquare className="h-5 w-5 mr-2" />
                          Custom Commands
                        </div>
                        <Button size="sm" onClick={addCustomCommand}>
                          <Plus className="h-4 w-4 mr-2" />
                          Command hinzufügen
                        </Button>
                      </CardTitle>
                      <CardDescription>Erstelle eigene Commands für deinen Bot</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedBot.customCommands.map((command, index) => (
                          <div key={index} className="flex space-x-2 items-end">
                            <div className="flex-1">
                              <Label>Trigger</Label>
                              <Input
                                placeholder="ping"
                                value={command.trigger}
                                onChange={(e) => updateCustomCommand(index, "trigger", e.target.value)}
                              />
                            </div>
                            <div className="flex-1">
                              <Label>Antwort</Label>
                              <Input
                                placeholder="Pong!"
                                value={command.response}
                                onChange={(e) => updateCustomCommand(index, "response", e.target.value)}
                              />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => removeCustomCommand(index)}>
                              Löschen
                            </Button>
                          </div>
                        ))}

                        {selectedBot.customCommands.length === 0 && (
                          <p className="text-gray-500 text-center py-8">Noch keine Custom Commands erstellt</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Users className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Server</p>
                            <p className="text-2xl font-bold">12</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <MessageSquare className="h-8 w-8 text-green-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Commands heute</p>
                            <p className="text-2xl font-bold">247</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Activity className="h-8 w-8 text-yellow-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Uptime</p>
                            <p className="text-2xl font-bold">99.9%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Users className="h-8 w-8 text-purple-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Nutzer erreicht</p>
                            <p className="text-2xl font-bold">1.2k</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Bot Aktivität</CardTitle>
                      <CardDescription>Übersicht der Bot-Aktivitäten der letzten 7 Tage</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-gray-500">
                        Aktivitäts-Chart würde hier angezeigt werden
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Kein Bot ausgewählt</h3>
              <p className="text-gray-600">Wähle einen Bot aus der Seitenleiste aus oder erstelle einen neuen Bot.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
