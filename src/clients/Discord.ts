import axios, { AxiosError } from "axios";
import { ConfigurationError, MessageSendError } from "../utils/errors";
import { IsValidWebhookUrl, validateRequired } from "../utils/validators";
import { DiscordClientConfig, DiscordEmbed, SendOptions } from "../types/discord";

/**
 * Represents a Discord webhook client.
 * Handles sending plain messages, embeds, and status notifications to a Discord channel.
 */
export class DiscordClient {
    /**
     * Configuration details for the Discord webhook client.
     * @type {Required<DiscordClientConfig>}
     */
    config: Required<DiscordClientConfig>;

    /**
     * Creates a new instance of DiscordClient.
     * @param {DiscordClientConfig} config - The configuration object for the client.
     * @throws {ConfigurationError} If the provided webhook URL is invalid.
     */
    constructor(config: DiscordClientConfig) {
        this.config = {
            webhookUrl: config.webhookUrl ?? "",
            username: config.username ?? "notifly Bot",
            avatarUrl: config.avatarUrl ?? "",
            defaultColor: config.defaultColor ?? 0x3498db,
            timeout: config.timeout ?? 5000,
        };

        this._validateConfig();
    }

    /**
     * Validates the provided client configuration.
     * Ensures that the webhook URL is present and correctly formatted.
     * @private
     * @throws {ConfigurationError} If the webhook URL is invalid.
     */
    private _validateConfig(): void {
        validateRequired(this.config, ["webhookUrl"], "Discord");

        if (!IsValidWebhookUrl(this.config.webhookUrl, "discord")) {
            throw new ConfigurationError(
                "Invalid Discord webhook URL format. Expected: https://discord.com/api/webhooks/..."
            );
        }
    }

    /**
     * Sends a plain text or structured message to Discord using the webhook.
     * @param {string | Record<string, unknown>} message - The message content or structured payload.
     * @param {SendOptions} [options={}] - Optional message overrides like username and avatar.
     * @returns {Promise<{ success: boolean; platform: string; timestamp: string }>} A result object with status details.
     * @throws {MessageSendError} If the request to Discord fails.
     */
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

    /**
     * Sends a Discord embed message with detailed content like title, description, and color.
     * @param {DiscordEmbed} embedOptions - The embed configuration.
     * @returns {Promise<object>} The Discord API response.
     */
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

    /**
     * Sends a green success embed message with a ✅ emoji.
     * @param {string} title - The title of the message.
     * @param {string} description - The detailed description.
     * @returns {Promise<object>} The Discord API response.
     */
    async success(title: string, description: string): Promise<object> {
        return this.sendEmbed({
            title: `✅ ${title}`,
            description,
            color: 0x00ff00,
        });
    }

    /**
     * Sends a red error embed message with a ❌ emoji.
     * @param {string} title - The title of the message.
     * @param {string} description - The detailed description.
     * @returns {Promise<object>} The Discord API response.
     */
    async error(title: string, description: string): Promise<object> {
        return this.sendEmbed({
            title: `❌ ${title}`,
            description,
            color: 0xff0000,
        });
    }

    /**
     * Sends a yellow warning embed message with a ⚠️ emoji.
     * @param {string} title - The title of the message.
     * @param {string} description - The detailed description.
     * @returns {Promise<object>} The Discord API response.
     */
    async warn(title: string, description: string): Promise<object> {
        return this.sendEmbed({
            title: `⚠️ ${title}`,
            description,
            color: 0xffff00,
        });
    }

    /**
     * Sends a blue informational embed message with a ℹ️ emoji.
     * @param {string} title - The title of the message.
     * @param {string} description - The detailed description.
     * @returns {Promise<object>} The Discord API response.
     */
    async info(title: string, description: string): Promise<object> {
        return this.sendEmbed({
            title: `ℹ️ ${title}`,
            description,
            color: 0x3498db,
        });
    }

    /**
     * Tests the connection to the Discord webhook by sending a sample message.
     * @returns {Promise<boolean>} True if the test succeeded, otherwise false.
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.send("notifly connection test successful! 🚀");
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Builds a formatted payload for the Discord API request.
     * @private
     * @param {string | Record<string, unknown>} message - The message to send.
     * @param {SendOptions} options - Optional overrides for username or avatar.
     * @returns {Record<string, unknown>} The structured Discord message payload.
     */
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
