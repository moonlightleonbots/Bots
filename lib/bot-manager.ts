"use client"

export interface BotInstance {
  id: string
  name: string
  token: string
  status: "starting" | "online" | "offline" | "error"
  error?: string
  client?: any
  startedAt?: Date
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

  async startBot(botConfig: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Prüfe ob Bot bereits läuft
      const existingBot = this.bots.get(botConfig.id)
      if (existingBot && existingBot.status === "online") {
        return { success: false, error: "Bot läuft bereits" }
      }

      // Stoppe existierenden Worker falls vorhanden
      await this.stopBot(botConfig.id)

      // Bot-Status auf "starting" setzen
      const botInstance: BotInstance = {
        id: botConfig.id,
        name: botConfig.name,
        token: botConfig.token,
        status: "starting",
        startedAt: new Date(),
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
              let botId = null;
              
              self.onmessage = async function(e) {
                const { type, config } = e.data;
                
                if (type === 'START_BOT') {
                  botId = config.id;
                  try {
                    // Simuliere Bot-Start (in echter Implementierung würde hier Discord.js laufen)
                    self.postMessage({
                      type: 'BOT_STATUS',
                      botId: botId,
                      status: 'starting',
                      message: 'Bot wird gestartet...'
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Simuliere erfolgreichen Bot-Start
                    self.postMessage({
                      type: 'BOT_READY',
                      botId: botId,
                      data: {
                        username: config.name,
                        guilds: Math.floor(Math.random() * 10) + 1,
                        users: Math.floor(Math.random() * 1000) + 100
                      }
                    });
                    
                  } catch (error) {
                    self.postMessage({
                      type: 'BOT_ERROR',
                      botId: botId,
                      error: error.message
                    });
                  }
                }
                
                if (type === 'STOP_BOT') {
                  self.postMessage({
                    type: 'BOT_STOPPED',
                    botId: botId || config.id
                  });
                  
                  // Worker beenden
                  setTimeout(() => {
                    self.close();
                  }, 100);
                }
                
                if (type === 'PING') {
                  self.postMessage({
                    type: 'PONG',
                    botId: botId || config.id
                  });
                }
              };
              
              // Fehlerbehandlung
              self.onerror = function(error) {
                self.postMessage({
                  type: 'BOT_ERROR',
                  botId: botId,
                  error: 'Worker Error: ' + error.message
                });
              };
            `,
            ],
            { type: "application/javascript" },
          ),
        ),
      )

      // Worker Event Listener
      worker.onmessage = (e) => {
        const { type, botId, data, error, status, message } = e.data

        const bot = this.bots.get(botId)
        if (!bot) return

        switch (type) {
          case "BOT_STATUS":
            bot.status = status
            if (message) {
              console.log(`Bot ${botId}: ${message}`)
            }
            this.bots.set(botId, bot)
            break

          case "BOT_READY":
            bot.status = "online"
            bot.error = undefined
            this.bots.set(botId, bot)
            console.log(`Bot ${bot.name} ist online!`, data)
            break

          case "BOT_ERROR":
            bot.status = "error"
            bot.error = error
            this.bots.set(botId, bot)
            console.error(`Bot ${bot.name} Fehler:`, error)
            break

          case "BOT_STOPPED":
            bot.status = "offline"
            bot.error = undefined
            this.bots.set(botId, bot)
            console.log(`Bot ${bot.name} gestoppt`)
            break

          case "PONG":
            console.log(`Bot ${botId} antwortet auf Ping`)
            break
        }
      }

      // Worker Error Handler
      worker.onerror = (error) => {
        console.error(`Worker Error für Bot ${botConfig.id}:`, error)
        const bot = this.bots.get(botConfig.id)
        if (bot) {
          bot.status = "error"
          bot.error = `Worker Fehler: ${error.message}`
          this.bots.set(botConfig.id, bot)
        }
      }

      // Worker beendet Handler
      worker.onmessageerror = (error) => {
        console.error(`Worker Message Error für Bot ${botConfig.id}:`, error)
      }

      this.workers.set(botConfig.id, worker)

      // Bot starten
      worker.postMessage({
        type: "START_BOT",
        config: botConfig,
      })

      return { success: true }
    } catch (error) {
      console.error("Fehler beim Bot-Start:", error)
      return { success: false, error: `Bot-Start fehlgeschlagen: ${error}` }
    }
  }

  async stopBot(botId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const bot = this.bots.get(botId)
      const worker = this.workers.get(botId)

      // Wenn kein Worker vorhanden, aber Bot existiert, setze Status auf offline
      if (!worker && bot) {
        bot.status = "offline"
        bot.error = undefined
        this.bots.set(botId, bot)
        return { success: true }
      }

      // Wenn weder Worker noch Bot vorhanden
      if (!worker && !bot) {
        return { success: false, error: "Bot nicht gefunden" }
      }

      // Worker stoppen
      if (worker) {
        try {
          // Versuche graceful shutdown
          worker.postMessage({ type: "STOP_BOT", config: { id: botId } })

          // Fallback: Worker nach Timeout beenden
          setTimeout(() => {
            try {
              worker.terminate()
            } catch (e) {
              console.warn("Worker bereits beendet:", e)
            }
            this.workers.delete(botId)
          }, 2000)
        } catch (error) {
          console.warn("Fehler beim Worker-Stop:", error)
          // Trotzdem Worker aus Map entfernen
          worker.terminate()
          this.workers.delete(botId)
        }
      }

      // Bot-Status aktualisieren
      if (bot) {
        bot.status = "offline"
        bot.error = undefined
        this.bots.set(botId, bot)
      }

      return { success: true }
    } catch (error) {
      console.error("Fehler beim Bot-Stop:", error)
      return { success: false, error: `Bot-Stop fehlgeschlagen: ${error}` }
    }
  }

  getBotStatus(botId: string): BotInstance | undefined {
    return this.bots.get(botId)
  }

  getAllBots(): BotInstance[] {
    return Array.from(this.bots.values())
  }

  // Neue Methoden für bessere Verwaltung
  isWorkerRunning(botId: string): boolean {
    return this.workers.has(botId)
  }

  async pingBot(botId: string): Promise<boolean> {
    const worker = this.workers.get(botId)
    if (!worker) return false

    try {
      worker.postMessage({ type: "PING", config: { id: botId } })
      return true
    } catch {
      return false
    }
  }

  stopAllBots(): Promise<void> {
    const stopPromises = Array.from(this.bots.keys()).map((botId) => this.stopBot(botId))
    return Promise.all(stopPromises).then(() => {})
  }

  // Debug-Informationen
  getDebugInfo(): {
    bots: number
    workers: number
    botIds: string[]
    workerIds: string[]
  } {
    return {
      bots: this.bots.size,
      workers: this.workers.size,
      botIds: Array.from(this.bots.keys()),
      workerIds: Array.from(this.workers.keys()),
    }
  }
}
