require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const { Deepgram } = require('@deepgram/sdk');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

// Add your routes here
app.post('/transcribe', async (req, res) => {
    // Transcription logic will go here
});

app.post('/chat', async (req, res) => {
    // Chat logic will go here
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
