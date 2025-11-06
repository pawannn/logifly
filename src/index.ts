import logifly from "./logifly";
import { DiscordClient } from "./clients/Discord";
import * as errors from "./utils/errors";

const lgfy = new logifly();

export default lgfy;
export { logifly, DiscordClient, errors as Errors };
export type { DiscordClientConfig } from "./types/discord";
