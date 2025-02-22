// Add this constant at the top of your file
const BACKEND_URL = 'https://amie-chatbot-backend-raarongraham.replit.app';

// Update your handleSendMessage function
const handleSendMessage = async (e) => {
  e.preventDefault();
  if (inputMessage.trim() === '') return;

  const userMessage = {
    text: inputMessage,
    sender: 'user',
    timestamp: new Date().toISOString()
  };
  setMessages(prev => [...prev, userMessage]);
  setInputMessage('');
  setIsLoading(true);

  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: inputMessage })
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    const botResponse = {
      text: data.response,
      sender: 'bot',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, botResponse]);
  } catch (error) {
    console.error('Error:', error);
    // Add error handling UI if needed
  } finally {
    setIsLoading(false);
  }
};

// Update your handleVoiceInput function
const handleVoiceInput = async () => {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Start recording logic
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  } else {
    // Stop recording logic
    setIsRecording(false);
    // Send audio to backend
    try {
      const response = await fetch(`${BACKEND_URL}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav', // Adjust content type as needed
        },
        body: audioBlob // You'll need to implement audio recording to get this blob
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setInputMessage(data.transcription);
    } catch (error) {
      console.error('Error:', error);
    }
  }
};
