const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { Deepgram } = require('@deepgram/sdk');
const multer = require('multer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: ['https://cordz-del.github.io', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Middleware
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Deepgram
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

// Configure multer for handling audio files
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
  res.send('Amie Chatbot Backend is running!');
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Amie, a helpful and friendly AI assistant. Provide clear and concise responses."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 150
    });

    res.json({
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Voice transcription endpoint
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

    res.json({
      transcription: transcription
    });
  } catch (error) {
    console.error('Error in transcribe endpoint:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
