document.getElementById('chat-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const input = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const message = input.value.trim();
    if (!message) return;

    // Display the user's message in the chat history
    chatHistory.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
    input.value = '';

    // Send the message to the Replit backend
    try {
        const response = await fetch('https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        if (data.response) {
            chatHistory.innerHTML += `<p><strong>Bot:</strong> ${data.response}</p>`;
        } else {
            chatHistory.innerHTML += `<p><strong>Bot:</strong> Error: No response received.</p>`;
        }
    } catch (error) {
        chatHistory.innerHTML += `<p><strong>Bot:</strong> Error: ${error.message}</p>`;
    }

    // Scroll to the bottom of the chat history
    chatHistory.scrollTop = chatHistory.scrollHeight;
});
