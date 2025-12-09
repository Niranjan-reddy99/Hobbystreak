import { GoogleGenAI, Chat, LiveServerMessage, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize only if key exists to avoid runtime crashes, but handle errors gracefully later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const createHobbyCoachChat = () => {
  if (!ai) return null;
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are "HobbyBot", an enthusiastic and expert hobby coach. 
      Your goal is to help users find new hobbies, stay consistent, and overcome motivation blocks. 
      Keep your answers concise, encouraging, and actionable. 
      If a user asks about a specific hobby (e.g., running, painting), give them a "micro-challenge" they can do today.
      Format your response with simple formatting if needed, but avoid complex markdown tables.`,
    },
  });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
  if (!chat) throw new Error("AI not initialized");
  return await chat.sendMessageStream({ message });
};

// --- Live API Implementation ---

export class LiveSession {
  private ai: GoogleGenAI;
  private session: any; // Using any as the Session type resolves dynamically
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private active = false;

  constructor() {
    if (!apiKey) throw new Error("API Key missing");
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(
    onOpen: () => void,
    onClose: () => void,
    onError: (e: Error) => void
  ) {
    try {
      // Input Audio Context (16kHz for Gemini)
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      // Output Audio Context (24kHz for Gemini response)
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are a motivating, high-energy hobby coach using voice. 
          Keep your responses brief, conversational, and encouraging. 
          Focus on helping the user take action on their hobbies immediately.`,
        },
        callbacks: {
          onopen: () => {
            this.active = true;
            this.setupAudioInput(stream, sessionPromise);
            onOpen();
          },
          onmessage: (msg: LiveServerMessage) => {
            this.handleMessage(msg);
          },
          onclose: () => {
            this.active = false;
            this.cleanup();
            onClose();
          },
          onerror: (e) => {
            console.error("Live Error", e);
            onError(new Error("Connection error"));
            this.disconnect();
          },
        },
      });

      this.session = await sessionPromise;

    } catch (err) {
      console.error("Failed to connect live session", err);
      onError(err instanceof Error ? err : new Error("Failed to connect"));
      this.disconnect();
    }
  }

  private setupAudioInput(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputContext) return;

    this.inputSource = this.inputContext.createMediaStreamSource(stream);
    // Create ScriptProcessor (bufferSize, inputChannels, outputChannels)
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.active) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);
      
      // Ensure we only send data to a resolved session
      sessionPromise.then((session) => {
        if (this.active) {
          session.sendRealtimeInput({ media: pcmBlob });
        }
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const data = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (data && this.outputContext) {
      try {
        const pcmData = decode(data);
        const buffer = await decodeAudioData(
          pcmData, 
          this.outputContext, 
          24000, 
          1
        );
        this.playBuffer(buffer);
      } catch (e) {
        console.error("Audio decode error", e);
      }
    }
  }

  private playBuffer(buffer: AudioBuffer) {
    if (!this.outputContext) return;
    
    // Schedule next chunk
    this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
    
    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputContext.destination);
    
    source.onended = () => {
      this.sources.delete(source);
    };
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.sources.add(source);
  }

  disconnect() {
    this.active = false;
    this.session?.close();
    this.cleanup();
  }

  private cleanup() {
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    
    this.processor?.disconnect();
    this.inputSource?.disconnect();
    
    // Close contexts to release hardware
    if (this.inputContext?.state !== 'closed') this.inputContext?.close();
    if (this.outputContext?.state !== 'closed') this.outputContext?.close();
    
    this.inputContext = null;
    this.outputContext = null;
  }
}

// --- Helpers for PCM Encoding/Decoding ---

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Scale float (-1.0 to 1.0) to int16
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}