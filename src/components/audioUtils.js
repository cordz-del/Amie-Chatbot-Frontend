export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      // Listen for available data and push to audioChunks array
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording() {
    if (!this.mediaRecorder) {
      throw new Error('No media recorder available. Please start recording first.');
    }

    return new Promise((resolve, reject) => {
      try {
        // When recording stops, create a blob from audio chunks
        this.mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          resolve(audioBlob);
        });

        this.mediaRecorder.stop();

        // Stop all tracks to release the microphone
        const tracks = this.mediaRecorder.stream.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (error) {
        reject(error);
      }
    });
  }
}
