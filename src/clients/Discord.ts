import axios, { AxiosError } from "axios";
import { ConfigurationError, MessageSendError } from "../utils/errors";
import { IsValidWebhookUrl, validateRequired } from "../utils/validators";
import { DiscordClientConfig, DiscordEmbed, SendOptions } from "../types/discord";

export class DiscordClient {
    config: Required<DiscordClientConfig>;

    constructor(config: DiscordClientConfig) {
        this.config = {
            webhookUrl: config.webhookUrl ?? "",
            username: config.username ?? "logify Bot",
            avatarUrl: config.avatarUrl ?? "",
            defaultColor: config.defaultColor ?? 0x3498db,
            timeout: config.timeout ?? 5000,
        };

        this._validateConfig();
    }

    private _validateConfig(): void {
        validateRequired(this.config, ["webhookUrl"], "Discord");

        if (!IsValidWebhookUrl(this.config.webhookUrl, "discord")) {
            throw new ConfigurationError(
                "Invalid Discord webhook URL format. Expected: https://discord.com/api/webhooks/..."
            );
        }
    }

    async send(
        message: string | Record<string, unknown>,
        options: SendOptions = {}
    ): Promise<{ success: boolean; platform: string; timestamp: string }> {
        try {
            const payload = this._buildPayload(message, options);

            const response = await axios.post(this.config.webhookUrl, payload, {
                headers: { "Content-Type": "application/json" },
                timeout: this.config.timeout,
            });

            if (response.status < 200 || response.status >= 300) {
                throw new Error(`Discord API Error: ${response.status} - ${response.statusText}`);
            }

            return {
                success: true,
                platform: "discord",
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status ?? "Unknown";
                const data = axiosError.response?.data ?? axiosError.message;
                throw new MessageSendError(
                    "Discord",
                    new Error(`Discord API Error: ${status} - ${JSON.stringify(data)}`)
                );
            }
            throw new MessageSendError("Discord", error as Error);
        }
    }

    async sendEmbed(embedOptions: DiscordEmbed): Promise<object> {
        const embed: DiscordEmbed = {
            title: embedOptions.title,
            description: embedOptions.description,
            color: embedOptions.color ?? this.config.defaultColor,
            fields: embedOptions.fields ?? [],
            timestamp: embedOptions.timestamp ?? new Date().toISOString(),
            footer: embedOptions.footer,
            author: embedOptions.author,
            thumbnail: embedOptions.thumbnail,
            image: embedOptions.image,
            url: embedOptions.url,
        };

        Object.keys(embed).forEach((key) => {
            if ((embed as any)[key] === undefined) delete (embed as any)[key];
        });

        return this.send({ embeds: [embed] });
    }

    async sendSuccess(title: string, description: string): Promise<object> {
        return this.sendEmbed({
            title: `✅ ${title}`,
            description,
            color: 0x00ff00,
        });
    }

    async sendError(title: string, description: string): Promise<object> {
        return this.sendEmbed({
            title: `❌ ${title}`,
            description,
            color: 0xff0000,
        });
    }

    async sendWarning(title: string, description: string): Promise<object> {
        return this.sendEmbed({
            title: `⚠️ ${title}`,
            description,
            color: 0xffff00,
        });
    }

    async sendInfo(title: string, description: string): Promise<object> {
        return this.sendEmbed({
            title: `ℹ️ ${title}`,
            description,
            color: 0x3498db,
        });
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.send("logify connection test successful! 🚀");
            return true;
        } catch {
            return false;
        }
    }

    private _buildPayload(
        message: string | Record<string, unknown>,
        options: SendOptions
    ): Record<string, unknown> {
        const payload: Record<string, unknown> = {
            username: options.username ?? this.config.username,
            avatar_url: options.avatarUrl ?? this.config.avatarUrl,
        };

        if (typeof message === "string") {
            payload.content = message;
        } else if (typeof message === "object") {
            Object.assign(payload, message);
        }

        return payload;
    }
}