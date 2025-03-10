/************************************************************
 * script.js - Consolidated functionality for:
 *   1) Login & Signup
 *   2) Mood selection (Amie-Skills)
 *   3) AI Assistant chat (full-page chat)
 ************************************************************/

// Adjust if your backend URL differs
const API_BASE_URL = 'https://nodejs-amiemongodb.replit.app';

// Key for storing mood data in localStorage (Amie-Skills)
const SHARED_MOOD_KEY = 'sharedMoodData';

document.addEventListener('DOMContentLoaded', function () {
  /************************************************************
   * 1) LOGIN & SIGNUP FUNCTIONALITY
   *    (Used on Login/Signup pages)
   ************************************************************/
  const loginForm = document.getElementById('loginForm');
  const signUpForm = document.getElementById('signUpForm');
  const signUpModal = document.getElementById('signUpModal');
  const openSignUpModalBtn = document.getElementById('openSignUpModal');
  const closeSignUpModalBtn = document.getElementById('closeSignUpModal');
  const errorMessageElement = document.getElementById('errorMessage');
  const successMessageElement = document.getElementById('successMessage');

  // Reusable error/success message functions
  const showError = (message) => {
    if (errorMessageElement) {
      errorMessageElement.textContent = message;
      errorMessageElement.style.display = 'block';
      setTimeout(() => {
        errorMessageElement.style.display = 'none';
      }, 5000);
    } else {
      alert(message);
    }
  };

  const showSuccess = (message) => {
    if (successMessageElement) {
      successMessageElement.textContent = message;
      successMessageElement.style.display = 'block';
      setTimeout(() => {
        successMessageElement.style.display = 'none';
      }, 5000);
    } else {
      alert(message);
    }
  };

  // Simple validators
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  // --- Modal Handling for Sign Up (if present) ---
  if (openSignUpModalBtn && signUpModal) {
    openSignUpModalBtn.addEventListener('click', () => {
      signUpModal.style.display = 'block';
    });
  }
  if (closeSignUpModalBtn && signUpModal) {
    closeSignUpModalBtn.addEventListener('click', () => {
      signUpModal.style.display = 'none';
    });
  }
  window.addEventListener('click', (event) => {
    if (signUpModal && event.target === signUpModal) {
      signUpModal.style.display = 'none';
    }
  });

  // --- SIGNUP FORM SUBMIT ---
  if (signUpForm) {
    signUpForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const username = document.getElementById('signUpUsername').value.trim();
      const email = document.getElementById('signUpEmail').value.trim();
      const password = document.getElementById('signUpPassword').value;

      if (!username || !email || !password) {
        showError('All fields are required');
        return;
      }
      if (!validatePassword(password)) {
        showError('Password must be at least 6 characters long');
        return;
      }
      if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        // Save user info in localStorage
        localStorage.setItem('currentUser', data.username);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('token', data.token);

        showSuccess('Profile created successfully!');
        if (signUpModal) {
          signUpModal.style.display = 'none';
        }
        signUpForm.reset();

        // Redirect to the Skills page (or wherever you prefer)
        setTimeout(() => {
          window.location.href = 'https://cordz-del.github.io/Amie-Skills/';
        }, 1500);
      } catch (error) {
        console.error('Sign-up error:', error);
        showError(error.message || 'Failed to create account. Please try again.');
      }
    });
  }

  // --- LOGIN FORM SUBMIT ---
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showError('Email and password are required');
        return;
      }
      if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        // Save user info in localStorage
        localStorage.setItem('currentUser', data.username);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('token', data.token);

        showSuccess('Login successful!');
        setTimeout(() => {
          window.location.href = 'https://cordz-del.github.io/Amie-Skills/';
        }, 1500);
      } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Invalid email or password.');
      }
    });
  }

  // --- LOGOUT FUNCTION ---
  async function logout() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }
      localStorage.clear();
      window.location.href = 'https://cordz-del.github.io/Log-in-Amie/';
    } catch (error) {
      console.error('Logout error:', error);
      showError('Error logging out. Please try again.');
    }
  }

  // If there's a logout button somewhere, attach it
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  // --- AUTH CHECK FUNCTION ---
  function checkAuth() {
    const token = localStorage.getItem('token');
    const currentURL = window.location.href;

    // If token exists but user is on login page, redirect to skills page
    if (token && currentURL.includes('/Log-in-Amie')) {
      window.location.href = 'https://cordz-del.github.io/Amie-Skills/';
    }
    // If no token and user is not on login page, redirect to login
    else if (!token && !currentURL.includes('/Log-in-Amie')) {
      window.location.href = 'https://cordz-del.github.io/Log-in-Amie/';
    }
  }

  // Uncomment if you want auto-redirect based on auth:
  // checkAuth();

  /************************************************************
   * 2) MOOD SELECTION (Amie-Skills)
   ************************************************************/
  const emotionBoxes = document.querySelectorAll('.emotion-box');
  const actionModal = document.getElementById('actionModal');

  if (emotionBoxes && emotionBoxes.length > 0) {
    let moodSelected = false;

    // Called when user clicks an emotion box
    window.handleMoodClick = function (elem) {
      if (moodSelected) return;
      moodSelected = true;

      // Disable all other emotion boxes
      emotionBoxes.forEach((box) => {
        if (box !== elem) {
          box.classList.add('disabled');
          box.style.pointerEvents = 'none';
        }
      });

      // Apply spin animation (class .spin-animation in your CSS)
      elem.classList.add('spin-animation');

      // After spin animation completes (1s)
      setTimeout(() => {
        // Identify the mood from the second class (e.g., "stressed", "sad", etc.)
        const moodName = elem.classList[1];

        // Save this mood to localStorage so that Mood-Record-Page can read it
        const newMoodEntry = {
          timestamp: new Date().toISOString(),
          mood: moodName,
          notes: 'Logged from Amie-Skills',
        };
        let sharedData = JSON.parse(localStorage.getItem(SHARED_MOOD_KEY) || '[]');
        sharedData.push(newMoodEntry);
        localStorage.setItem(SHARED_MOOD_KEY, JSON.stringify(sharedData));

        // Replace box content with a check mark
        elem.innerHTML = `
          <div class="check-mark">&#10003;</div>
          <p>Your feeling has been logged.</p>
        `;

        // After a short delay, open the modal (if it exists)
        setTimeout(() => {
          if (actionModal) {
            actionModal.style.display = 'block';
          }
        }, 500);
      }, 1000);
    };

    // If the modal is present, handle Vent or Exercise
    window.chooseAction = function (action) {
      console.log(`User chose to ${action}`);
      if (actionModal) {
        actionModal.style.display = 'none';
      }
      // Additional logic for venting or exercises can go here
    };
  }

  /************************************************************
   * 3) AI ASSISTANT CHAT
   *    (Used on the full-page chat with #chatWindow)
   ************************************************************/
  const chatWindow = document.getElementById('chatWindow');
  const userInput = document.getElementById('userInput');

  // If chatWindow exists, we’re on the AI Assistant page
  if (chatWindow) {
    window.startConversation = function () {
      // TODO: Add logic to initialize or connect to your conversation service
      alert('Starting conversation...');
    };

    window.stopConversation = function () {
      // TODO: Add logic to gracefully end the chat session
      alert('Stopping conversation...');
    };

    window.resetConversation = function () {
      // TODO: Clear chat history or reset the interface
      chatWindow.innerHTML = '';
      alert('Conversation reset.');
    };

    window.sendMessage = function () {
      // Simple example of appending user message to chat window
      const message = userInput.value.trim();
      if (message) {
        const userMsg = document.createElement('div');
        userMsg.classList.add('chat-message', 'user');
        userMsg.textContent = message;
        chatWindow.appendChild(userMsg);

        userInput.value = '';
        // Scroll to bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // TODO: Add logic to send the message to your AI backend and display AI response
      }
    };
  }
});
