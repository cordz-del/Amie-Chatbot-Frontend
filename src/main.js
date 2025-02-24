import './style.css';
import { validateEnvironmentVariables } from './utils/validateEnv';
import { config } from './config/env';

class ChatApp {
  constructor() {
    this.message = '';
    this.chatHistory = [];
    this.isLoading = false;
    this.typingTimeout = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.debounceTimeout = null;
    
    this.initialize();
  }

  async initialize() {
    try {
      validateEnvironmentVariables();
      await this.loadChatHistory();
      this.initializeElements();
      this.attachEventListeners();
      this.setupAutoSave();
    } catch (error) {
      console.error('Initialization failed:', error.message);
      this.displayErrorState(error.message);
    }
  }

  initializeElements() {
    this.app = document.querySelector('#app');
    this.app.innerHTML = `
      <div class="app-container">
        <header class="app-header">
          <h1>Chat with Amie</h1>
          <div class="header-controls">
            <button id="clearChat" class="icon-button" title="Clear Chat">🗑️</button>
            <button id="toggleTheme" class="icon-button" title="Toggle Theme">🌓</button>
          </div>
        </header>

        <main class="chat-container" id="chatContainer">
          <div class="welcome-message">
            <h2>👋 Hello! I'm Amie</h2>
            <p>How can I help you today?</p>
          </div>
          <div class="messages" id="messages"></div>
        </main>

        <form class="input-form" id="chatForm">
          <input
            type="text"
            id="messageInput"
            placeholder="Type your message..."
            autocomplete="off"
            maxlength="${config.MAX_MESSAGE_LENGTH || 1000}"
          />
          <div class="input-controls">
            <button type="button" id="voiceInput" class="icon-button" title="Voice Input">🎤</button>
            <button type="submit" disabled>Send</button>
          </div>
        </form>
      </div>
    `;

    this.initializeUIElements();
  }

  initializeUIElements() {
    this.chatContainer = document.getElementById('chatContainer');
    this.messagesContainer = document.getElementById('messages');
    this.chatForm = document.getElementById('chatForm');
    this.messageInput = document.getElementById('messageInput');
    this.submitButton = this.chatForm.querySelector('button[type="submit"]');
    this.clearButton = document.getElementById('clearChat');
    this.themeButton = document.getElementById('toggleTheme');
    this.voiceButton = document.getElementById('voiceInput');
  }

  attachEventListeners() {
    this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.messageInput.addEventListener('input', (e) => this.handleInput(e));
    this.clearButton.addEventListener('click', () => this.handleClearChat());
    this.themeButton.addEventListener('click', () => this.toggleTheme());
    this.voiceButton.addEventListener('click', () => this.handleVoiceInput());
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.handleSubmit(e);
      }
    });
  }

  handleInput(e) {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.message = e.target.value;
      this.submitButton.disabled = !this.message.trim();
      this.saveDraft();
    }, 300);
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.message.trim() || this.isLoading) return;

    const userMessage = this.message.trim();
    this.messageInput.value = '';
    this.message = '';
    this.isLoading = true;
    this.updateUI();

    this.addMessage('user', userMessage);

    try {
      const response = await this.sendMessageWithRetry(userMessage);
      this.addMessage('bot', response.response);
      this.retryCount = 0;
    } catch (error) {
      console.error('Chat error:', error);
      this.addMessage('error', 'Sorry, I encountered an error. Please try again.');
    } finally {
      this.isLoading = false;
      this.updateUI();
      this.saveToLocalStorage();
    }
  }

  async sendMessageWithRetry(message, attempt = 0) {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(config.API_TIMEOUT || 30000)
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        return this.sendMessageWithRetry(message, attempt + 1);
      }
      throw error;
    }
  }

  addMessage(type, content) {
    this.chatHistory.push({ type, content, timestamp: new Date().toISOString() });
    this.updateUI();
  }

  updateUI() {
    this.messagesContainer.innerHTML = '';
    
    this.chatHistory.forEach(chat => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${chat.type}-message`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = chat.content;
      
      const timestampDiv = document.createElement('div');
      timestampDiv.className = 'message-timestamp';
      timestampDiv.textContent = new Date(chat.timestamp).toLocaleTimeString();
      
      messageDiv.appendChild(contentDiv);
      messageDiv.appendChild(timestampDiv);
      this.messagesContainer.appendChild(messageDiv);
    });

    if (this.isLoading) {
      this.showTypingIndicator();
    }

    this.scrollToBottom();
    this.updateInputState();
  }

  showTypingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.innerHTML = `
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
    this.messagesContainer.appendChild(loadingDiv);
  }

  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  updateInputState() {
    this.messageInput.disabled = this.isLoading;
    this.submitButton.disabled = this.isLoading || !this.message.trim();
  }

  async handleVoiceInput() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Voice input is not supported in your browser');
      return;
    }
    // Voice input implementation here
  }

  handleClearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      this.chatHistory = [];
      localStorage.removeItem('chatHistory');
      this.updateUI();
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  }

  saveDraft() {
    localStorage.setItem('messageDraft', this.message);
  }

  setupAutoSave() {
    setInterval(() => {
      this.saveToLocalStorage();
    }, 30000);
  }

  saveToLocalStorage() {
    localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
  }

  async loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    const savedDraft = localStorage.getItem('messageDraft');
    
    if (savedHistory) {
      this.chatHistory = JSON.parse(savedHistory);
    }
    if (savedDraft) {
      this.message = savedDraft;
    }
  }

  displayErrorState(errorMessage) {
    this.app.innerHTML = `
      <div class="error-container">
        <h2>⚠️ Initialization Error</h2>
        <p>${errorMessage}</p>
        <p>Please check your environment configuration and reload the page.</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});

// Handle service worker if needed
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
