export interface SlackClientConfig {
    webhookUrl: string;
    username?: string;
    iconEmoji?: string;
    iconUrl?: string;
    channel?: string;
    defaultColor?: string;
    timeout?: number;
}

export interface SlackAttachment {
    fallback?: string | undefined;
    color?: string | undefined;
    pretext?: string | undefined;
    author_name?: string | undefined;
    author_link?: string | undefined;
    author_icon?: string | undefined;
    title?: string | undefined;
    title_link?: string | undefined;
    text?: string | undefined;
    fields?: SlackField[] | undefined;
    image_url?: string | undefined;
    thumb_url?: string | undefined;
    footer?: string | undefined;
    footer_icon?: string | undefined;
    ts?: number | undefined;
}

export interface SlackField {
    title: string;
    value: string;
    short?: boolean;
}

export interface SlackBlock {
    type: string;
    text?: {
        type: string;
        text: string;
    };
    [key: string]: any;
}

export interface SlackMessageOptions {
    username?: string;
    icon_emoji?: string;
    icon_url?: string;
    channel?: string;
    attachments?: SlackAttachment[];
    blocks?: SlackBlock[];
}