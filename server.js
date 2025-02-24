import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_FRONTEND_URL 
    : 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist')); // Vite builds to 'dist' by default
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    const messages = [
      { 
        role: "system", 
        content: "You are Amie, a friendly and empathetic AI assistant focused on social and emotional learning. You help users develop emotional intelligence, social skills, and self-awareness."
      },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.data.choices[0].message.content;
    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.message 
    });
  }
});

// Text-to-Speech endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const response = await fetch(`${process.env.VITE_ELEVENLABS_API_ENDPOINT}/${process.env.VITE_ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.VITE_ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error('ElevenLabs API error');
    }

    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ 
      error: 'Text-to-speech conversion failed',
      details: error.message 
    });
  }
});

// Speech-to-Text endpoint
app.post('/api/stt', async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('file', req.files.audio.data, { filename: 'audio.wav' });
    formData.append('model', 'whisper-1');

    const response = await fetch(process.env.VITE_WHISPER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Whisper API error');
    }

    const data = await response.json();
    res.json({ text: data.text });
  } catch (error) {
    console.error('STT Error:', error);
    res.status(500).json({ 
      error: 'Speech-to-text conversion failed',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Handle React routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
