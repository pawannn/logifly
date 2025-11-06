import { DiscordClient } from "./clients/Discord";
import { DiscordClientConfig } from "./types/discord";
import { BroadcastGroup } from "./broadcast";
import { PlatformClient } from "./types/broadcast";

export class logify {
    private readonly version: string;
    private groups: Map<string, BroadcastGroup>;

    constructor() {
        this.version = "1.0.0";
        this.groups = new Map();
    }

    newDiscordClient(config: DiscordClientConfig): DiscordClient {
        return new DiscordClient(config);
    }

    /**
     * Create a broadcast group of clients
     */
    createGroup(name: string, clients: PlatformClient[] = []): BroadcastGroup {
        const group = new BroadcastGroup(name, clients);
        this.groups.set(name, group);
        return group;
    }

    /**
     * Get an existing group
     */
    getGroup(name: string): BroadcastGroup {
        const group = this.groups.get(name);
        if (!group) {
            const available = Array.from(this.groups.keys()).join(', ') || 'none';
            throw new Error(
                `Group '${name}' not found. Available groups: ${available}`
            );
        }
        return group;
    }

    /**
     * List all groups
     */
    listGroups(): string[] {
        return Array.from(this.groups.keys());
    }

    /**
     * Check if a group exists
     */
    hasGroup(name: string): boolean {
        return this.groups.has(name);
    }

    /**
     * Delete a group
     */
    deleteGroup(name: string): boolean {
        return this.groups.delete(name);
    }

    getVersion(): string {
        return this.version;
    }
}

export default logify;