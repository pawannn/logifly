import { PlatformClient } from "./types/broadcast";
import {
    BroadcastResult,
    BroadcastSummary,
    EmbedOptions,
    TestConnectionResult,
} from "./types/broadcast";

/**
 * @internal
 * Represents an entry within a broadcast group — 
 * containing the client instance, its alias, and platform identifier.
 */
interface ClientEntry {
    client: PlatformClient;
    alias: string;
    platform: string;
}

/**
 * `BroadcastGroup` orchestrates message broadcasting across multiple platform clients
 * such as Discord, Slack, Email, or others.
 *
 * It provides unified APIs to send messages, embeds, or test connections simultaneously.
 *
 * @example
 * ```ts
 * const group = new BroadcastGroup("alerts", [discordClient, slackClient]);
 * await group.broadcast("Server online ✅");
 * ```
 */
export class BroadcastGroup {
    /** Name assigned to this broadcast group */
    private name: string;

    /** Registered platform clients */
    private clients: ClientEntry[] = [];

    /**
     * Creates a new broadcast group.
     * @param name - Unique name for this group.
     * @param clients - Optional initial list of clients.
     */
    constructor(name: string, clients: PlatformClient[] = []) {
        this.name = name;
        clients.forEach((c) => this.addClient(c));
    }

    /**
     * Registers a new client within the group.
     * @param client - The client instance (must implement `send()`).
     * @param alias - Optional alias for identification.
     * @returns The same instance for chaining.
     * @throws If client is invalid or lacks a `send()` method.
     */
    addClient(client: PlatformClient, alias?: string): this {
        if (!client || typeof client.send !== "function") {
            throw new Error("Invalid client: must implement send()");
        }

        this.clients.push({
            client,
            alias: alias || `client_${this.clients.length + 1}`,
            platform: client.constructor.name.replace("Client", "").toLowerCase(),
        });
        return this;
    }

    /**
     * Removes a registered client by alias.
     * @param alias - Alias to remove.
     * @returns `true` if removed, otherwise `false`.
     */
    removeClient(alias: string): boolean {
        const index = this.clients.findIndex((c) => c.alias === alias);
        if (index >= 0) {
            this.clients.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Broadcasts a text message or object to all clients.
     * @param message - Message text or payload.
     * @param options - Additional send options.
     * @returns Summary of broadcast results.
     */
    async broadcast(
        message: string | object,
        options: Record<string, any> = {}
    ): Promise<BroadcastSummary> {
        const results: Record<string, BroadcastResult> = {};

        await Promise.allSettled(
            this.clients.map(async ({ client, alias, platform }) => {
                try {
                    const result = await client.send(message, options);
                    results[alias] = { success: true, platform, result };
                } catch (err: any) {
                    results[alias] = { success: false, platform, error: err.message };
                }
            })
        );

        return {
            groupName: this.name,
            totalClients: this.clients.length,
            results,
        };
    }

    /**
     * Broadcasts an embed (rich message) to all clients.
     * Falls back to text if the client lacks embed support.
     * @param embed - Embed configuration.
     */
    async broadcastEmbed(embed: EmbedOptions): Promise<BroadcastSummary> {
        const results: Record<string, BroadcastResult> = {};

        await Promise.allSettled(
            this.clients.map(async ({ client, alias, platform }) => {
                try {
                    if (typeof client.sendEmbed === "function") {
                        const result = await client.sendEmbed(embed);
                        results[alias] = { success: true, platform, result };
                    } else {
                        const msg = `**${embed.title}**\n${embed.description}`;
                        const result = await client.send(msg);
                        results[alias] = {
                            success: true,
                            platform,
                            result,
                            note: "Embed not supported; sent as plain text.",
                        };
                    }
                } catch (err: any) {
                    results[alias] = { success: false, platform, error: err.message };
                }
            })
        );

        return {
            groupName: this.name,
            totalClients: this.clients.length,
            results,
        };
    }

    /** Shortcut: broadcasts a green success embed. */
    async broadcastSuccess(title: string, description: string) {
        return this.broadcastEmbed({
            title: `✅ ${title}`,
            description,
            color: 0x00ff00,
        });
    }

    /** Shortcut: broadcasts a red error embed. */
    async broadcastError(title: string, description: string) {
        return this.broadcastEmbed({
            title: `❌ ${title}`,
            description,
            color: 0xff0000,
        });
    }

    /** Shortcut: broadcasts a yellow warning embed. */
    async broadcastWarning(title: string, description: string) {
        return this.broadcastEmbed({
            title: `⚠️ ${title}`,
            description,
            color: 0xffff00,
        });
    }

    /** Shortcut: broadcasts a blue info embed. */
    async broadcastInfo(title: string, description: string) {
        return this.broadcastEmbed({
            title: `ℹ️ ${title}`,
            description,
            color: 0x3498db,
        });
    }

    /**
     * Lists all registered clients (alias + platform).
     * @returns Array of client descriptors.
     */
    listClients() {
        return this.clients.map(({ alias, platform }) => ({ alias, platform }));
    }

    /**
     * Returns total number of registered clients.
     */
    size(): number {
        return this.clients.length;
    }

    /**
     * Tests connection health for all clients.
     * Uses `testConnection()` if available, otherwise performs a simple `send("Test")`.
     * @returns Connection status results.
     */
    async testConnections(): Promise<Record<string, TestConnectionResult>> {
        const results: Record<string, TestConnectionResult> = {};

        await Promise.allSettled(
            this.clients.map(async ({ client, alias, platform }) => {
                try {
                    const connected =
                        typeof client.testConnection === "function"
                            ? await client.testConnection()
                            : await client.send("Test").then(() => true).catch(() => false);

                    results[alias] = { platform, connected };
                } catch (err: any) {
                    results[alias] = { platform, connected: false, error: err.message };
                }
            })
        );

        return results;
    }
}
