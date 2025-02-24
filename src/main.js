import './style.css';
import { validateEnvironmentVariables } from './utils/validateEnv';
import { config } from './config/env';

class ChatApp {
  constructor() {
    this.message = '';
    this.chatHistory = [];
    this.isLoading = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      validateEnvironmentVariables();
      this.initializeElements();
      this.attachEventListeners();
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
          />
          <button type="submit" disabled>Send</button>
        </form>
      </div>
    `;

    this.chatContainer = document.getElementById('chatContainer');
    this.messagesContainer = document.getElementById('messages');
    this.chatForm = document.getElementById('chatForm');
    this.messageInput = document.getElementById('messageInput');
    this.submitButton = this.chatForm.querySelector('button');
  }

  attachEventListeners() {
    this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.messageInput.addEventListener('input', (e) => {
      this.message = e.target.value;
      this.submitButton.disabled = !this.message.trim();
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.message.trim() || this.isLoading) return;

    const userMessage = this.message.trim();
    this.messageInput.value = '';
    this.message = '';
    this.isLoading = true;
    this.updateUI();

    this.chatHistory.push({ type: 'user', content: userMessage });
    this.updateUI();

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      this.chatHistory.push({ type: 'bot', content: data.response });
    } catch (error) {
      console.error('Chat error:', error);
      this.chatHistory.push({ 
        type: 'error', 
        content: 'Sorry, I encountered an error. Please try again.' 
      });
    } finally {
      this.isLoading = false;
      this.updateUI();
    }
  }

  updateUI() {
    this.messagesContainer.innerHTML = '';

    this.chatHistory.forEach(chat => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${chat.type}-message`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = chat.content;
      
      messageDiv.appendChild(contentDiv);
      this.messagesContainer.appendChild(messageDiv);
    });

    if (this.isLoading) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'message bot-message';
      loadingDiv.innerHTML = `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
      this.messagesContainer.appendChild(loadingDiv);
    }

    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    this.messageInput.disabled = this.isLoading;
    this.submitButton.disabled = this.isLoading || !this.message.trim();
  }

  displayErrorState(errorMessage) {
    this.app.innerHTML = `
      <div class="error-container">
        <h2>⚠️ Initialization Error</h2>
        <p>${errorMessage}</p>
        <p>Please check your environment configuration and reload the page.</p>
      </div>
    `;
  }
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});
