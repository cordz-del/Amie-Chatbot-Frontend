export const API_CONFIG = {
  OPENAI_API_ENDPOINT: import.meta.env.VITE_OPENAI_API_ENDPOINT,
  WHISPER_API_ENDPOINT: import.meta.env.VITE_WHISPER_API_ENDPOINT,
  ELEVENLABS_API_ENDPOINT: import.meta.env.VITE_ELEVENLABS_API_ENDPOINT,
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
  }
};

export const makeApiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};
