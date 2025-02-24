import { config } from '../config/env';

export const initializeAPI = () => {
  if (!config.isConfigValid()) {
    throw new Error('Invalid configuration. Please check your environment variables.');
  }

  return {
    openai: {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1'
    },
    elevenLabs: {
      apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
      voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID,
      baseURL: 'https://api.elevenlabs.io/v1'
    },
    backend: {
      baseURL: import.meta.env.VITE_BACKEND_URL
    }
  };
};

export const createAPIClient = (config) => {
  // Initialize API clients here
  return {
    chat: async (message) => {
      // Implement chat functionality
    },
    textToSpeech: async (text) => {
      // Implement text-to-speech functionality
    }
  };
};
