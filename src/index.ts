import notifly from "./notifly";
import { DiscordClient } from "./clients/Discord";
import * as errors from "./utils/errors";

const lgfy = new notifly();

export default lgfy;
export { notifly, DiscordClient, errors as Errors };
export type { DiscordClientConfig } from "./types/discord";
