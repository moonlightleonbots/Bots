import { createClient } from "@/lib/supabase"

export interface BotConfig {
  id: string
  user_id: string
  name: string
  token: string
  status: "online" | "offline"
  prefix: string
  welcome_message: string
  moderation_enabled: boolean
  auto_role_enabled: boolean
  created_at: string
  updated_at: string
}

export interface CustomCommand {
  id: string
  bot_id: string
  trigger: string
  response: string
  created_at: string
}

export class DatabaseService {
  private supabase = createClient()

  async getBots(userId: string): Promise<BotConfig[]> {
    const { data, error } = await this.supabase
      .from("bots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bots:", error)
      return []
    }

    return data || []
  }

  async createBot(bot: Omit<BotConfig, "id" | "created_at" | "updated_at">): Promise<BotConfig | null> {
    const { data, error } = await this.supabase.from("bots").insert([bot]).select().single()

    if (error) {
      console.error("Error creating bot:", error)
      return null
    }

    return data
  }

  async updateBot(botId: string, updates: Partial<BotConfig>): Promise<BotConfig | null> {
    const { data, error } = await this.supabase
      .from("bots")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", botId)
      .select()
      .single()

    if (error) {
      console.error("Error updating bot:", error)
      return null
    }

    return data
  }

  async deleteBot(botId: string): Promise<boolean> {
    const { error } = await this.supabase.from("bots").delete().eq("id", botId)

    if (error) {
      console.error("Error deleting bot:", error)
      return false
    }

    return true
  }

  async getCustomCommands(botId: string): Promise<CustomCommand[]> {
    const { data, error } = await this.supabase
      .from("custom_commands")
      .select("*")
      .eq("bot_id", botId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching custom commands:", error)
      return []
    }

    return data || []
  }

  async createCustomCommand(command: Omit<CustomCommand, "id" | "created_at">): Promise<CustomCommand | null> {
    const { data, error } = await this.supabase.from("custom_commands").insert([command]).select().single()

    if (error) {
      console.error("Error creating custom command:", error)
      return null
    }

    return data
  }

  async updateCustomCommand(commandId: string, updates: Partial<CustomCommand>): Promise<CustomCommand | null> {
    const { data, error } = await this.supabase
      .from("custom_commands")
      .update(updates)
      .eq("id", commandId)
      .select()
      .single()

    if (error) {
      console.error("Error updating custom command:", error)
      return null
    }

    return data
  }

  async deleteCustomCommand(commandId: string): Promise<boolean> {
    const { error } = await this.supabase.from("custom_commands").delete().eq("id", commandId)

    if (error) {
      console.error("Error deleting custom command:", error)
      return false
    }

    return true
  }

  async saveCustomCommands(botId: string, commands: Array<{ trigger: string; response: string }>): Promise<boolean> {
    try {
      // Lösche bestehende Commands
      await this.supabase.from("custom_commands").delete().eq("bot_id", botId)

      // Füge neue Commands hinzu
      if (commands.length > 0) {
        const { error } = await this.supabase.from("custom_commands").insert(
          commands.map((cmd) => ({
            bot_id: botId,
            trigger: cmd.trigger,
            response: cmd.response,
          })),
        )

        if (error) {
          console.error("Error saving custom commands:", error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Error in saveCustomCommands:", error)
      return false
    }
  }

  async resetDatabase(): Promise<boolean> {
    try {
      // Lösche alle Daten des aktuellen Users
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) return false

      // Lösche Custom Commands (werden automatisch durch CASCADE gelöscht)
      // Lösche Bots
      const { error } = await this.supabase.from("bots").delete().eq("user_id", user.id)

      return !error
    } catch (error) {
      console.error("Error resetting database:", error)
      return false
    }
  }
}
