"use client"

export interface BotInstance {
  id: string
  name: string
  token: string
  status: "starting" | "online" | "offline" | "error"
  error?: string
  client?: any
}

export class BotManager {
  private static instance: BotManager
  private bots: Map<string, BotInstance> = new Map()
  private workers: Map<string, Worker> = new Map()

  static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager()
    }
    return BotManager.instance
  }

  async validateToken(token: string): Promise<{ valid: boolean; error?: string; botInfo?: any }> {
    try {
      // Basis-Token-Format-Check
      if (!token || typeof token !== "string") {
        return { valid: false, error: "Token ist leer oder ungültig" }
      }

      // Discord Token Format Check
      const tokenParts = token.split(".")
      if (tokenParts.length !== 3) {
        return { valid: false, error: "Token hat falsches Format (muss 3 Teile haben)" }
      }

      // Bot ID aus Token extrahieren
      try {
        const botId = atob(tokenParts[0])
        if (!botId || isNaN(Number(botId))) {
          return { valid: false, error: "Bot ID im Token ist ungültig" }
        }
      } catch {
        return { valid: false, error: "Token ist nicht Base64-kodiert" }
      }

      // Simuliere Discord API-Aufruf zur Token-Validierung
      const response = await this.testTokenWithDiscord(token)
      return response
    } catch (error) {
      return { valid: false, error: `Token-Validierung fehlgeschlagen: ${error}` }
    }
  }

  private async testTokenWithDiscord(token: string): Promise<{ valid: boolean; error?: string; botInfo?: any }> {
    try {
      // Simuliere Discord API /users/@me Aufruf
      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `Bot ${token}`,
        },
      })

      if (!response.ok) {
        switch (response.status) {
          case 401:
            return { valid: false, error: "Token ist ungültig oder abgelaufen" }
          case 403:
            return { valid: false, error: "Token hat keine ausreichenden Berechtigungen" }
          case 429:
            return { valid: false, error: "Rate Limit erreicht, versuche es später erneut" }
          default:
            return { valid: false, error: `Discord API Fehler: ${response.status}` }
        }
      }

      const botInfo = await response.json()

      if (!botInfo.bot) {
        return { valid: false, error: "Token gehört zu einem User-Account, nicht zu einem Bot" }
      }

      return {
        valid: true,
        botInfo: {
          id: botInfo.id,
          username: botInfo.username,
          discriminator: botInfo.discriminator,
          avatar: botInfo.avatar,
        },
      }
    } catch (error) {
      return { valid: false, error: "Netzwerkfehler bei Token-Validierung" }
    }
  }

  async startBot(botConfig: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Token validieren
      const tokenValidation = await this.validateToken(botConfig.token)
      if (!tokenValidation.valid) {
        return { success: false, error: tokenValidation.error }
      }

      // Bot-Status auf "starting" setzen
      const botInstance: BotInstance = {
        id: botConfig.id,
        name: botConfig.name,
        token: botConfig.token,
        status: "starting",
      }

      this.bots.set(botConfig.id, botInstance)

      // Web Worker für Bot erstellen
      const worker = new Worker(
        URL.createObjectURL(
          new Blob(
            [
              `
              // Discord Bot Worker
              let client = null;
              
              self.onmessage = async function(e) {
                const { type, config } = e.data;
                
                if (type === 'START_BOT') {
                  try {
                    // Simuliere Bot-Start (in echter Implementierung würde hier Discord.js laufen)
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Simuliere erfolgreichen Bot-Start
                    self.postMessage({
                      type: 'BOT_READY',
                      botId: config.id,
                      data: {
                        username: 'TestBot',
                        guilds: 5,
                        users: 1250
                      }
                    });
                    
                  } catch (error) {
                    self.postMessage({
                      type: 'BOT_ERROR',
                      botId: config.id,
                      error: error.message
                    });
                  }
                }
                
                if (type === 'STOP_BOT') {
                  self.postMessage({
                    type: 'BOT_STOPPED',
                    botId: config.id
                  });
                }
              };
            `,
            ],
            { type: "application/javascript" },
          ),
        ),
      )

      // Worker Event Listener
      worker.onmessage = (e) => {
        const { type, botId, data, error } = e.data

        const bot = this.bots.get(botId)
        if (!bot) return

        switch (type) {
          case "BOT_READY":
            bot.status = "online"
            bot.error = undefined
            this.bots.set(botId, bot)
            break

          case "BOT_ERROR":
            bot.status = "error"
            bot.error = error
            this.bots.set(botId, bot)
            break

          case "BOT_STOPPED":
            bot.status = "offline"
            bot.error = undefined
            this.bots.set(botId, bot)
            break
        }
      }

      this.workers.set(botConfig.id, worker)

      // Bot starten
      worker.postMessage({
        type: "START_BOT",
        config: botConfig,
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: `Bot-Start fehlgeschlagen: ${error}` }
    }
  }

  async stopBot(botId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const worker = this.workers.get(botId)
      if (!worker) {
        return { success: false, error: "Bot-Worker nicht gefunden" }
      }

      worker.postMessage({ type: "STOP_BOT" })

      // Worker nach kurzer Zeit beenden
      setTimeout(() => {
        worker.terminate()
        this.workers.delete(botId)
      }, 1000)

      return { success: true }
    } catch (error) {
      return { success: false, error: `Bot-Stop fehlgeschlagen: ${error}` }
    }
  }

  getBotStatus(botId: string): BotInstance | undefined {
    return this.bots.get(botId)
  }

  getAllBots(): BotInstance[] {
    return Array.from(this.bots.values())
  }
}
