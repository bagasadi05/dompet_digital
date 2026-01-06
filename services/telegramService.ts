/**
 * Telegram Service
 * Handles interaction with Telegram Bot API for sending notifications
 */

// Base URL for Telegram Bot API
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export interface TelegramConfig {
    botToken: string;
    chatId: string;
    enabled: boolean;
}

// Default configuration key for localStorage
const TELEGRAM_CONFIG_KEY = 'telegram_config';

// Get Telegram configuration from localStorage
export const getTelegramConfig = (): TelegramConfig => {
    try {
        const stored = localStorage.getItem(TELEGRAM_CONFIG_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('[TelegramService] Error reading config:', error);
    }
    return {
        botToken: '',
        chatId: '',
        enabled: false
    };
};

// Save Telegram configuration
export const saveTelegramConfig = (config: TelegramConfig): void => {
    try {
        localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error('[TelegramService] Error saving config:', error);
    }
};

// Send a message via Telegram
export const sendTelegramMessage = async (text: string): Promise<boolean> => {
    const config = getTelegramConfig();

    if (!config.enabled || !config.botToken || !config.chatId) {
        console.warn('[TelegramService] Telegram integration disabled or missing config');
        return false;
    }

    const cleanToken = config.botToken.trim();
    const cleanChatId = config.chatId.trim();

    try {
        const response = await fetch(`${TELEGRAM_API_BASE}${cleanToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: cleanChatId,
                text: text,
                parse_mode: 'Markdown', // Supports basic formatting
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('[TelegramService] API Error:', data);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[TelegramService] Network Error:', error);
        return false;
    }
};

// Verify Bot Token (Simple check by calling getMe)
export const verifyBotToken = async (token: string): Promise<boolean> => {
    try {
        const response = await fetch(`${TELEGRAM_API_BASE}${token}/getMe`);
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('[TelegramService] Token verification error:', error);
        return false;
    }
};

// Test message function
export const sendTestMessage = async (token: string, chatId: string): Promise<{ success: boolean; message: string }> => {
    try {
        const cleanToken = token.trim();
        const cleanChatId = chatId.trim();

        console.log(`[TelegramService] Testing connection to Chat ID: ${cleanChatId}`);

        const response = await fetch(`${TELEGRAM_API_BASE}${cleanToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: cleanChatId,
                text: '🔔 *Tes Dompet Digital*\n\nHalo! Jika Anda menerima pesan ini, integrasi Telegram Anda berhasil.',
                parse_mode: 'Markdown',
            }),
        });

        const data = await response.json();

        if (data.ok) {
            return { success: true, message: 'Pesan berhasil dikirim!' };
        } else {
            console.error('[TelegramService] API Error Response:', data);
            return { success: false, message: `Gagal: ${data.description || 'Unknown error'} (Error ${data.error_code})` };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[TelegramService] Network/Script Error:', error);
        return { success: false, message: `Error: ${errorMessage}` };
    }
};
