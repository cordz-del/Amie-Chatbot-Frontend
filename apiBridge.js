import axios from 'axios';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-3.5-turbo';

class ApiBridge {
  constructor() {
    this.axios = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      }
    });
  }

  // Main chat completion method
  async getChatCompletion(messages) {
    try {
      const response = await this.axios.post('', {
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return {
        success: true,
        data: response.data.choices[0].message,
        error: null
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        data: null,
        error: this.handleError(error)
      };
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      switch (error.response.status) {
        case 401:
          return 'Authentication error. Please check your API key.';
        case 429:
          return 'Rate limit exceeded. Please try again later.';
        case 500:
          return 'OpenAI server error. Please try again later.';
        default:
          return `Error: ${error.response.data.error?.message || 'Unknown error occurred'}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      return 'No response from server. Please check your internet connection.';
    } else {
      // Something happened in setting up the request
      return 'Error setting up the request. Please try again.';
    }
  }

  // Method to validate API key
  async validateApiKey() {
    try {
      const response = await this.getChatCompletion([
        { role: 'user', content: 'Test' }
      ]);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Method to get system status
  async getSystemStatus() {
    try {
      const response = await this.axios.get('https://api.openai.com/v1/models');
      return {
        success: true,
        available: true
      };
    } catch (error) {
      return {
        success: false,
        available: false
      };
    }
  }
}

// Create and export a single instance
const apiBridge = new ApiBridge();
export default apiBridge;
