document.addEventListener("DOMContentLoaded", () => {
    // Select DOM elements
    const chatInput = document.getElementById("chat-input");
    const chatHistory = document.getElementById("chat-history");
    const chatForm = document.getElementById("chat-form");
    const resetChatBtn = document.getElementById("reset-chat-btn");

    // Initialize Bot Libre SDK
    const SDK = new SDKConnection();
    SDK.applicationId = "5657790313173565017"; // Replace with your Bot Libre Application ID

    const webChat = new WebChatbotListener();
    webChat.connection = SDK;
    webChat.instance = "55654109"; // Replace with your Bot Libre Bot ID
    webChat.instanceName = "Amie";

    // Handle chat form submission
    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // Append user's message to chat history
        appendMessage("You", userMessage);

        // Clear chat input
        chatInput.value = "";

        // Send message to Bot Libre
        webChat.connection.sendMessage(userMessage);
    });

    // Handle reset chat button
    resetChatBtn.addEventListener("click", () => {
        chatHistory.innerHTML = "";
        appendMessage("Amie", "Chat reset. How can I help you today?");
    });

    // Listen for Bot Libre responses
    webChat.onMessage = (message) => {
        appendMessage("Amie", message.message);
    };

    webChat.onError = (error) => {
        console.error("Bot Libre Error:", error);
        appendMessage("Error", "Unable to connect to Bot Libre. Please try again.");
    };

    // Helper function to append messages to chat history
    function appendMessage(sender, message) {
        const messageDiv = document.createElement("div");
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to the latest message
    }

    console.log("Bot Libre integration loaded successfully.");
});
