/**
 * Environment Configuration for Amie Chatbot Frontend
 * All environment variables must be prefixed with VITE_ to be exposed to the client
 */

const requiredEnvVars = [
  'VITE_OPENAI_API_KEY',
  'VITE_BACKEND_URL'
];

// Check for required environment variables
requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
});

export const config = {
  // OpenAI Configuration
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ?? '',
  OPENAI_API_ENDPOINT: import.meta.env.VITE_OPENAI_API_ENDPOINT ?? 'https://api.openai.com/v1',
  
  // ElevenLabs Configuration
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY ?? '',
  ELEVENLABS_VOICE_ID: import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? '',
  ELEVENLABS_API_ENDPOINT: import.meta.env.VITE_ELEVENLABS_API_ENDPOINT ?? 'https://api.elevenlabs.io/v1',
  
  // Whisper Configuration
  WHISPER_API_ENDPOINT: import.meta.env.VITE_WHISPER_API_ENDPOINT ?? '/api/whisper',
  
  // Backend Configuration
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000',
  
  // Helper method to validate configuration
  isConfigValid() {
    return Boolean(
      this.OPENAI_API_KEY &&
      this.BACKEND_URL
    );
  }
} as const;

// Type definitions for TypeScript support
export type Config = typeof config;

// Freeze the configuration object to prevent modifications
Object.freeze(config);
