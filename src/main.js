import './style.css'

class ChatApp {
  constructor() {
    this.message = '';
    this.chatHistory = [];
    this.isLoading = false;
    
    this.initializeElements();
    this.attachEventListeners();
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
          />
          <button type="submit">Send</button>
        </form>
      </div>
    `;

    this.chatContainer = document.getElementById('chatContainer');
    this.messagesContainer = document.getElementById('messages');
    this.chatForm = document.getElementById('chatForm');
    this.messageInput = document.getElementById('messageInput');
  }

  attachEventListeners() {
    this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.messageInput.addEventListener('input', (e) => this.message = e.target.value);
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.message.trim()) return;

    const userMessage = this.message.trim();
    this.messageInput.value = '';
    this.message = '';
    this.isLoading = true;
    this.updateUI();

    // Add user message to chat
    this.chatHistory.push({ type: 'user', content: userMessage });
    this.updateUI();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Add AI response to chat
      this.chatHistory.push({ type: 'bot', content: data.response });
    } catch (error) {
      console.error('Error:', error);
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
    // Clear messages container
    this.messagesContainer.innerHTML = '';

    // Add all messages
    this.chatHistory.forEach(chat => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${chat.type === 'user' ? 'user-message' : 'bot-message'}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = chat.content;
      
      messageDiv.appendChild(contentDiv);
      this.messagesContainer.appendChild(messageDiv);
    });

    // Add loading indicator if needed
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

    // Scroll to bottom
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;

    // Update input state
    this.messageInput.disabled = this.isLoading;
    const submitButton = this.chatForm.querySelector('button');
    submitButton.disabled = this.isLoading || !this.message.trim();
  }
}

// Initialize the app
new ChatApp();
