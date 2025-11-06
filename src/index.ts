import ZNotify from "./logifly";
import { DiscordClient } from "./clients/Discord";
import * as errors from "./utils/errors";

const znotify = new ZNotify();

export default znotify;
export { ZNotify, DiscordClient, errors as Errors };
export type { DiscordClientConfig } from "./types/discord";
