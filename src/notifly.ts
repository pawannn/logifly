import { DiscordClient } from "./clients/Discord";
import { DiscordClientConfig } from "./types/discord";
import { BroadcastGroup } from "./broadcast";
import { PlatformClient } from "./types/broadcast";

/**
 * Main notifly SDK class.
 * 
 * notifly helps you send logs, alerts, or any message to multiple platforms such as
 * **Discord**, **Slack**, **Email**, and others via a unified broadcast interface.
 * 
 * It allows you to:
 * - Create and manage broadcast groups of platform clients.
 * - Instantiate platform-specific clients (like Discord).
 * - Broadcast messages to all clients in a group.
 * 
 * @example
 * ```ts
 * import notifly from 'notifly';
 * 
 * const log = new notifly();
 * const discord = log.newDiscordClient({
 *   webhookUrl: 'https://discord.com/api/webhooks/XXXX',
 *   username: 'AlertBot'
 * });
 * 
 * const group = log.createGroup('alerts', [discord]);
 * await group.broadcast('Server is down!');
 * ```
 */
export class notifly {
    /** Current SDK version */
    private readonly version: string;

    /** Internal store of all broadcast groups */
    private groups: Map<string, BroadcastGroup>;

    /**
     * Initializes a new notifly instance.
     */
    constructor() {
        this.version = "1.0.0";
        this.groups = new Map();
    }

    /**
     * Creates a new Discord client instance.
     *
     * @param {DiscordClientConfig} config - Configuration options for the Discord client.
     * @returns {DiscordClient} A configured Discord client ready to send messages.
     *
     * @example
     * ```ts
     * const discord = log.newDiscordClient({
     *   webhookUrl: 'https://discord.com/api/webhooks/XXXX',
     *   username: 'LogBot'
     * });
     * ```
     */
    newDiscordClient(config: DiscordClientConfig): DiscordClient {
        return new DiscordClient(config);
    }

    /**
     * Creates a new broadcast group of platform clients.
     * 
     * A broadcast group allows sending messages to multiple clients at once
     * (e.g., Discord, Slack, Email, etc.).
     *
     * @param {string} name - A unique name for the broadcast group.
     * @param {PlatformClient[]} [clients=[]] - Optional array of clients to include in the group.
     * @returns {BroadcastGroup} The newly created broadcast group.
     *
     * @example
     * ```ts
     * const group = log.createGroup('notifications', [discordClient]);
     * ```
     */
    createGroup(name: string, clients: PlatformClient[] = []): BroadcastGroup {
        const group = new BroadcastGroup(name, clients);
        this.groups.set(name, group);
        return group;
    }

    /**
     * Retrieves an existing broadcast group by name.
     *
     * @param {string} name - The name of the group to retrieve.
     * @returns {BroadcastGroup} The existing broadcast group.
     * @throws {Error} If the specified group does not exist.
     *
     * @example
     * ```ts
     * const alerts = log.getGroup('alerts');
     * ```
     */
    getGroup(name: string): BroadcastGroup {
        const group = this.groups.get(name);
        if (!group) {
            const available = Array.from(this.groups.keys()).join(', ') || 'none';
            throw new Error(`Group '${name}' not found. Available groups: ${available}`);
        }
        return group;
    }

    /**
     * Lists all existing broadcast group names.
     *
     * @returns {string[]} An array containing all group names.
     *
     * @example
     * ```ts
     * console.log(log.listGroups());
     * // ['alerts', 'notifications']
     * ```
     */
    listGroups(): string[] {
        return Array.from(this.groups.keys());
    }

    /**
     * Checks if a group with the given name exists.
     *
     * @param {string} name - The name of the group.
     * @returns {boolean} `true` if the group exists, otherwise `false`.
     *
     * @example
     * ```ts
     * if (log.hasGroup('alerts')) {
     *   console.log('Alerts group exists!');
     * }
     * ```
     */
    hasGroup(name: string): boolean {
        return this.groups.has(name);
    }

    /**
     * Deletes a broadcast group by name.
     *
     * @param {string} name - The name of the group to delete.
     * @returns {boolean} `true` if the group was deleted successfully, otherwise `false`.
     *
     * @example
     * ```ts
     * log.deleteGroup('notifications');
     * ```
     */
    deleteGroup(name: string): boolean {
        return this.groups.delete(name);
    }

    /**
     * Returns the SDK version currently in use.
     *
     * @returns {string} The current version string.
     *
     * @example
     * ```ts
     * console.log(log.getVersion()); // "1.0.0"
     * ```
     */
    getVersion(): string {
        return this.version;
    }
}

export default notifly;
