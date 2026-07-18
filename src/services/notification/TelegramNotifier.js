export async function sendTelegramNotification(eventType, message, errorLog = '') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram credentials not configured. Skipping notification.');
    return;
  }

  const text = `🚨 *ARproject Content Factory Alert* 🚨\n\n*Event:* ${eventType}\n*Message:* ${message}\n*Error Details:* ${errorLog}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram notification', await response.text());
    }
  } catch (error) {
    console.error('Telegram API error:', error);
  }
}
