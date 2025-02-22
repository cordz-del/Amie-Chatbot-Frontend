// Add this constant at the top of your file
const BACKEND_URL = 'https://amie-chatbot-backend-raarongraham.replit.app';

// Update your handleSendMessage function
const handleSendMessage = async (e) => {
  e.preventDefault();
  if (inputMessage.trim() === '') return;

  // Capture the current input message before clearing
  const messageToSend = inputMessage;

  const userMessage = {
    text: messageToSend,
    sender: 'user',
    timestamp: new Date().toISOString()
  };
  setMessages(prev => [...prev, userMessage]);
  setInputMessage(''); // Clear input field immediately
  setIsLoading(true);

  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageToSend })
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
    // Optionally, update the UI to show an error message
  } finally {
    setIsLoading(false);
  }
};

// Update your handleVoiceInput function
const handleVoiceInput = async () => {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // TODO: Implement MediaRecorder setup to start recording with this stream.
      // e.g., mediaRecorder.start() and capture audio chunks.
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  } else {
    // TODO: Implement logic to stop MediaRecorder and generate audioBlob from recorded chunks.
    setIsRecording(false);
    
    try {
      const response = await fetch(`${BACKEND_URL}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav', // Adjust content type if needed
        },
        body: audioBlob // Ensure audioBlob is correctly created from your recording logic
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setInputMessage(data.transcription);
    } catch (error) {
      console.error('Error:', error);
    }
  }
};
