// API Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    ENDPOINTS: {
        CHAT: '/chat',
        HEALTH: '/health'
    },
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
};

// WebSocket Configuration (if needed)
export const WS_CONFIG = {
    WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',
    RECONNECT_INTERVAL: 2000,
    MAX_RECONNECT_ATTEMPTS: 5
};

// Rate Limiting Configuration
export const RATE_LIMIT = {
    MAX_REQUESTS_PER_MINUTE: 60,
    THROTTLE_INTERVAL: 1000 // 1 second
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment.'
};
