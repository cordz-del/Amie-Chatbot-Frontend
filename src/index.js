const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const { Deepgram } = require('@deepgram/sdk');
const multer = require('multer');

const app = express();


  origin: ['https://cordz-del.github.io', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Use built-in middleware to parse JSON bodies
app.use(express.json());

// Initialize OpenAI using the new SDK syntax
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Initialize Deepgram
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

// Configure multer for in-memory storage for audio uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Root endpoint to verify the backend is running
app.get('/', (req, res) => {
  res.send('Amie Chatbot Backend is running!');
});

// Chat endpoint: receives a message from the frontend and returns the AI response
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Amie, a helpful and friendly AI assistant. Provide clear and concise responses.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 150,
    });

    res.json({
      response: completion.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Transcribe endpoint: receives an audio file and returns the transcription using Deepgram
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioData = {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype
    };

    const response = await deepgram.transcription.preRecorded(audioData, {
      smart_format: true,
      model: 'general',
      language: 'en-US'
    });

    const transcription = response.results.channels[0].alternatives[0].transcript;
    res.json({ transcription });
  } catch (error) {
    console.error('Error in transcribe endpoint:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server on the specified PORT or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
