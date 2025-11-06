# Notifly

Send notifications to multiple messaging platforms (Discord, Slack, Teams, etc.) with just 2 lines of code.

## Installation

`npm install Notifly`

## Quick Start

### 1. Get a Discord Webhook URL

1. Go to your Discord server
2. Right-click on a channel → Edit Channel
3. Go to Integrations → Webhooks
4. Click New Webhook → Copy the webhook URL

### 2. Send Your First Message

```javascript
const Notifly = require('Notifly');

// Create a client
const discord = Notifly.newDiscordClient({
  webhookUrl: 'YOUR_DISCORD_WEBHOOK_URL'
});

// Send a message
await discord.send('Hello World! 🚀');
```

That's it! ✨

## Examples

### Simple Text Message
```javascript
await discord.send('Server is running!');
```

Status Messages (Colored)
```javascript
// Green success message
await discord.sendSuccess('Deployment Complete', 'Version 2.0 is live!');

// Red error message
await discord.sendError('Build Failed', 'Tests failed on line 42');

// Yellow warning message
await discord.sendWarning('High Memory', 'Memory usage at 85%');

// Blue info message
await discord.sendInfo('Maintenance', 'Scheduled maintenance in 1 hour');
```

### Rich Embed with Details
```javascript
await discord.sendEmbed({
  title: '📊 Daily Report',
  description: 'System status for today',
  color: 0x00ff00,
  fields: [
    { name: 'Uptime', value: '99.9%', inline: true },
    { name: 'Requests', value: '1.2M', inline: true },
    { name: 'Errors', value: '23', inline: true }
  ]
});
```

### Broadcast to Multiple Channels
```javascript
// Create clients for different channels
const alerts = Notifly.newDiscordClient({ 
  webhookUrl: 'ALERTS_WEBHOOK' 
});
const logs = Notifly.newDiscordClient({ 
  webhookUrl: 'LOGS_WEBHOOK' 
});
const team = Notifly.newDiscordClient({ 
  webhookUrl: 'TEAM_WEBHOOK' 
});

// Group them together
const group = Notifly.createGroup('critical', [alerts, logs, team]);

// Send to all channels at once!
await group.broadcast('🚨 Critical alert: Server down!');
await group.broadcastError('Database Error', 'Connection timeout');
```

### Send Messages

| Method | Description | Example |
|--------|-------------|---------|
| `send(message)` | Send simple text | `await client.send('Hello')` |
| `sendSuccess(title, desc)` | Green success message | `await client.sendSuccess('Done', 'Success!')` |
| `sendError(title, desc)` | Red error message | `await client.sendError('Failed', 'Error!')` |
| `sendWarning(title, desc)` | Yellow warning | `await client.sendWarning('Warning', 'Be careful')` |
| `sendInfo(title, desc)` | Blue info message | `await client.sendInfo('Info', 'FYI')` |
| `sendEmbed(options)` | Rich formatted message | `await client.sendEmbed({...})` |

## Testing

### Run tests
`npm test`

## Coming Soon

✅ Discord (Available now!)

🔜 Slack

🔜 Microsoft Teams

🔜 Telegram

🔜 Email

🔜 SMS (Twilio)
