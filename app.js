// Define constants for API URL and select DOM elements
const BACKEND_URL = "https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev";

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatHistory = document.getElementById("chat-history");
const startRecordBtn = document.getElementById("start-record-btn");
const stopRecordBtn = document.getElementById("stop-record-btn");
const status = document.getElementById("status");
const ageInput = document.getElementById("age-input");

// Initialize conversation log
let conversationLog = [];

// Check for browser support for Speech Recognition
let recognition;
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
} else if ("SpeechRecognition" in window) {
  recognition = new SpeechRecognition();
} else {
  alert("Your browser does not support speech recognition.");
}

// Configure Speech Recognition if supported
if (recognition) {
  recognition.continuous = false; // Stop after each utterance
  recognition.interimResults = false; // Don't show interim results
  recognition.lang = "en-US"; // Set language to English

  recognition.onstart = () => {
    status.textContent = "Listening...";
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript.trim();
    status.textContent = `You said: ${transcript}`;
    if (transcript) {
      await sendMessage(transcript, parseInt(ageInput.value, 10) || 10);
    } else {
      chatHistory.innerHTML += `<p><strong>Bot:</strong> No input detected. Please try again.</p>`;
    }
  };

  recognition.onerror = (event) => {
    status.textContent = `Error occurred: ${event.error}`;
  };

  recognition.onend = () => {
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
  };

  startRecordBtn.addEventListener("click", () => {
    recognition.start();
  });

  stopRecordBtn.addEventListener("click", () => {
    recognition.stop();
  });
}

// Handle form submission for text-based chat
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent form from reloading the page
  const message = chatInput.value.trim();
  const age = parseInt(ageInput.value, 10) || 10; // Default age to 10 if not provided
  if (message) {
    await sendMessage(message, age);
    chatInput.value = ""; // Clear input field after sending
  } else {
    chatHistory.innerHTML += `<p><strong>Bot:</strong> Please enter a message.</p>`;
  }
});

// Function to send a message to the chatbot API
async function sendMessage(message, age) {
  // Add the user's message to the chat history
  chatHistory.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
  conversationLog.push({ role: "user", content: message }); // Add to log

  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, age, conversation_log: conversationLog }), // Include conversation log
    });

    const data = await response.json();
    if (data.response) {
      chatHistory.innerHTML += `<p><strong>Bot:</strong> ${data.response}</p>`;
      conversationLog.push({ role: "assistant", content: data.response }); // Add bot's response to log

      if (data.audio) {
        playAudio(data.audio); // Play audio response if available
      }
    } else if (data.error) {
      chatHistory.innerHTML += `<p><strong>Bot:</strong> Error: ${data.error}</p>`;
    } else {
      chatHistory.innerHTML += `<p><strong>Bot:</strong> Error: No response received.</p>`;
    }
  } catch (error) {
    chatHistory.innerHTML += `<p><strong>Bot:</strong> Error: ${error.message}</p>`;
    console.error("Error in sendMessage:", error);
  }

  // Scroll to the bottom of the chat history
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Function to play audio from base64-encoded data
function playAudio(base64Audio) {
  const audioData = Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0));
  const audioBlob = new Blob([audioData], { type: "audio/wav" });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play().catch((error) => {
    console.error("Error playing audio:", error);
  });
}

// Debugging helper: Log when the frontend loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Frontend loaded successfully.");
});
