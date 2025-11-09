import { ConfigurationError, MessageSendError } from "../utils/errors.js";
import { validateRequired, IsValidWebhookUrl } from "../utils/validators.js";
import {
    SlackClientConfig,
    SlackAttachment,
    SlackMessageOptions,
    SlackField
} from "../types/slack.js";

/**
 * A high-level Slack client for sending messages, attachments, and embeds
 * through Incoming Webhooks.
 *
 * Provides convenient helper methods for common message types
 * (success, error, warning, info) and includes automatic configuration validation,
 * default styling, and error handling.
 *
 * @example
 * ```ts
 * const client = new SlackClient({
 *   webhookUrl: process.env.SLACK_WEBHOOK_URL!,
 *   username: "ZNotify Bot",
 *   iconEmoji: ":robot_face:",
 * });
 *
 * await client.send("Deployment completed successfully!");
 * await client.sendSuccess("Build", "✅ Build completed without issues.");
 * ```
 */
export class SlackClient {
    private config: Required<SlackClientConfig>;

    /**
     * Creates a new SlackClient instance.
     * 
     * @param config - Configuration object containing the webhook URL and optional defaults.
     * @throws {ConfigurationError} If the webhook URL is invalid or missing.
     */
    constructor(config: SlackClientConfig) {
        this.config = {
            webhookUrl: config.webhookUrl || "",
            username: config.username || "ZNotify Bot",
            iconEmoji: config.iconEmoji || ":robot_face:",
            iconUrl: config.iconUrl || "",
            channel: config.channel || "",
            defaultColor: config.defaultColor || "#3498db",
            timeout: config.timeout || 5000,
        };

        this._validateConfig();
    }

    /**
     * Validates the Slack client configuration.
     * Ensures that a valid webhook URL is provided.
     *
     * @private
     * @throws {ConfigurationError} If the provided webhook URL format is invalid.
     */
    private _validateConfig(): void {
        validateRequired(this.config, ["webhookUrl"], "Slack");

        if (!IsValidWebhookUrl(this.config.webhookUrl, "slack")) {
            throw new ConfigurationError(
                "Invalid Slack webhook URL format. Expected: https://hooks.slack.com/services/..."
            );
        }
    }

    /**
     * Sends a message to Slack.
     *
     * @param message - Either a plain string or an object representing the full message payload.
     * @param options - Optional parameters such as username, channel, or attachments.
     * @returns An object containing the success status, platform name, and timestamp.
     * @throws {MessageSendError} If the Slack API request fails.
     */
    async send(
        message: string | object,
        options: SlackMessageOptions = {}
    ): Promise<{ success: boolean; platform: string; timestamp: string }> {
        try {
            const payload = this._buildPayload(message, options);

            const response = await fetch(this.config.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Slack API Error: ${response.status} - ${errorText}`);
            }

            return {
                success: true,
                platform: "slack",
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            throw new MessageSendError("Slack", error);
        }
    }

    /**
     * Sends a message containing a Slack attachment (similar to a Discord embed).
     *
     * @param attachment - The attachment object to include in the message.
     * @returns The API response from Slack.
     */
    async sendAttachment(attachment: SlackAttachment): Promise<any> {
        const attachmentWithDefaults = {
            color: attachment.color || this.config.defaultColor,
            ts: attachment.ts || Math.floor(Date.now() / 1000),
            ...attachment,
        };

        return this.send({ attachments: [attachmentWithDefaults] });
    }

    /**
     * Sends a rich embed-style message (Discord-style) to Slack.
     *
     * @param embedOptions - Configuration object describing the embed contents.
     * @param embedOptions.title - Embed title text.
     * @param embedOptions.description - Description or body text.
     * @param embedOptions.color - RGB integer (e.g., `0x36a64f`) converted to hex color.
     * @param embedOptions.fields - List of name/value pairs displayed as fields.
     * @param embedOptions.footer - Footer text and optional icon.
     * @param embedOptions.author - Author name, link, and icon.
     * @param embedOptions.thumbnail - Thumbnail image URL.
     * @param embedOptions.image - Main image URL.
     * @param embedOptions.url - URL attached to the title link.
     * @returns The API response from Slack.
     */
    async sendEmbed(embedOptions: {
        title?: string;
        description?: string;
        color?: number;
        fields?: Array<{ name: string; value: string; inline?: boolean }>;
        footer?: { text: string; icon_url?: string };
        author?: { name: string; url?: string; icon_url?: string };
        thumbnail?: { url: string };
        image?: { url: string };
        url?: string;
    }): Promise<any> {
        const colorHex = embedOptions.color
            ? `#${embedOptions.color.toString(16).padStart(6, "0")}`
            : this.config.defaultColor;

        const fields: SlackField[] = embedOptions.fields
            ? embedOptions.fields.map((f) => ({
                title: f.name,
                value: f.value,
                short: f.inline || false,
            }))
            : [];

        const attachment: SlackAttachment = {
            color: colorHex,
            title: embedOptions.title,
            title_link: embedOptions.url,
            text: embedOptions.description,
            fields: fields.length > 0 ? fields : undefined,
            footer: embedOptions.footer?.text,
            footer_icon: embedOptions.footer?.icon_url,
            author_name: embedOptions.author?.name,
            author_link: embedOptions.author?.url,
            author_icon: embedOptions.author?.icon_url,
            thumb_url: embedOptions.thumbnail?.url,
            image_url: embedOptions.image?.url,
            ts: Math.floor(Date.now() / 1000),
        };

        // Remove undefined keys
        Object.keys(attachment).forEach((key) => {
            if (attachment[key as keyof SlackAttachment] === undefined) {
                delete attachment[key as keyof SlackAttachment];
            }
        });

        return this.sendAttachment(attachment);
    }

    /**
     * Sends a green-colored "success" message to Slack.
     *
     * @param title - Title text with an emoji prefix (e.g. "✅ Operation Successful").
     * @param description - Message body text.
     */
    async sendSuccess(title: string, description: string): Promise<any> {
        return this.sendAttachment({
            color: "good",
            title: `✅ ${title}`,
            text: description,
        });
    }

    /**
     * Sends a red-colored "error" message to Slack.
     *
     * @param title - Title text with an emoji prefix (e.g. "❌ Error Occurred").
     * @param description - Error details.
     */
    async sendError(title: string, description: string): Promise<any> {
        return this.sendAttachment({
            color: "danger",
            title: `❌ ${title}`,
            text: description,
        });
    }

    /**
     * Sends a yellow/orange "warning" message to Slack.
     *
     * @param title - Title text with a warning emoji.
     * @param description - Warning details.
     */
    async sendWarning(title: string, description: string): Promise<any> {
        return this.sendAttachment({
            color: "warning",
            title: `⚠️ ${title}`,
            text: description,
        });
    }

    /**
     * Sends an informational (blue) message to Slack.
     *
     * @param title - Title text with info emoji.
     * @param description - Informational message details.
     */
    async sendInfo(title: string, description: string): Promise<any> {
        return this.sendAttachment({
            color: "#3498db",
            title: `ℹ️ ${title}`,
            text: description,
        });
    }

    /**
     * Tests the Slack webhook connection by sending a small test message.
     *
     * @returns `true` if the connection is successful, `false` otherwise.
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.send("ZNotify connection test successful! 🚀");
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Builds the complete Slack webhook payload by combining configuration,
     * message content, and optional overrides.
     *
     * @private
     * @param message - Message text or payload object.
     * @param options - Optional overrides for username, icon, and channel.
     * @returns The final JSON-ready payload object.
     */
    private _buildPayload(
        message: string | object,
        options: SlackMessageOptions
    ): any {
        const payload: any = {
            username: options.username || this.config.username,
            icon_emoji: options.icon_emoji || this.config.iconEmoji,
        };

        // Use icon_url if provided (overrides emoji)
        if (options.icon_url || this.config.iconUrl) {
            payload.icon_url = options.icon_url || this.config.iconUrl;
            delete payload.icon_emoji;
        }

        if (options.channel || this.config.channel) {
            payload.channel = options.channel || this.config.channel;
        }

        if (typeof message === "string") {
            payload.text = message;
        } else if (typeof message === "object") {
            Object.assign(payload, message);
        }

        return payload;
    }
}
