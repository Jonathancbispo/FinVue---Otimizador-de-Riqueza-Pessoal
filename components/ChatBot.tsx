
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, List, AlignLeft, Info, Mic, MicOff, Volume2 } from 'lucide-react';
import { FinancialState, ChatMessage } from '../types';
import { chatWithAi } from '../services/geminiService';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface ChatBotProps {
  financialData: FinancialState;
}

// PCM Helpers
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
  numChannels: number,
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

const ChatBot: React.FC<ChatBotProps> = ({ financialData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou seu assistente FinVue. Posso analisar sua vida financeira do ano inteiro. O que você gostaria de saber hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUserQuestion, setPendingUserQuestion] = useState<string | null>(null);
  
  // Voice States
  const [isLive, setIsLive] = useState(false);
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Live API Refs
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionBufferRef = useRef({ user: '', model: '' });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading, isLive]);

  const stopLiveSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    setIsLive(false);
    setIsConnectingLive(false);
  }, []);

  const startLiveSession = async () => {
    setIsConnectingLive(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioIn = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const audioOut = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextInRef.current = audioIn;
      audioContextOutRef.current = audioOut;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `Você é o Agente FinVue Voice. Especialista em finanças. Dados do usuário: ${JSON.stringify(financialData)}. Seja breve e direto nas respostas de voz.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setIsConnectingLive(false);
            
            const source = audioIn.createMediaStreamSource(stream);
            const processor = audioIn.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                if (session) session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(audioIn.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Transcriptions
            if (message.serverContent?.inputTranscription) {
              transcriptionBufferRef.current.user += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionBufferRef.current.model += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              const uText = transcriptionBufferRef.current.user;
              const mText = transcriptionBufferRef.current.model;
              if (uText || mText) {
                setMessages(prev => [
                  ...prev, 
                  ...(uText ? [{ role: 'user' as const, text: uText }] : []),
                  ...(mText ? [{ role: 'model' as const, text: mText }] : [])
                ]);
              }
              transcriptionBufferRef.current = { user: '', model: '' };
            }

            // Audio
            const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64 && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => activeSourcesRef.current.delete(source);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            // Interruption (Barge-in)
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopLiveSession(),
          onerror: () => stopLiveSession()
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Live Voice Error:", err);
      setIsConnectingLive(false);
    }
  };

  const processWithAI = useCallback(async (userMessage: string, format?: 'Resumo' | 'Detalhado') => {
    setIsLoading(true);
    const finalPrompt = format ? `${userMessage} (Formato solicitado: ${format})` : userMessage;
    try {
      const response = await chatWithAi(finalPrompt, financialData, messages);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Ops! Tive um problema técnico. Pode tentar novamente?' }]);
    } finally {
      setIsLoading(false);
      setPendingUserQuestion(null);
    }
  }, [financialData, messages]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride || input).trim();
    if (!text || isLoading) return;

    if (pendingUserQuestion && (text === 'Resumo' || text === 'Detalhado')) {
      setMessages(prev => [...prev, { role: 'user', text: text }]);
      await processWithAI(pendingUserQuestion, text as 'Resumo' | 'Detalhado');
      return;
    }

    if (pendingUserQuestion) setPendingUserQuestion(null);

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: text }]);

    const lowercaseText = text.toLowerCase();
    const hasFormat = lowercaseText.includes('resumo') || lowercaseText.includes('detalhado');

    if (hasFormat) {
      await processWithAI(text);
    } else {
      setPendingUserQuestion(text);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: 'Entendido! Para esta análise, você prefere um **Resumo** direto ou algo mais **Detalhado**?' 
        }]);
      }, 500);
    }
  };

  const QuickButton = ({ text, icon: Icon }: { text: string, icon: any }) => {
    const isWaitingChoice = !!pendingUserQuestion;
    return (
      <button
        onClick={() => handleSend(text)}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all border shadow-sm ${
          isWaitingChoice 
          ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 animate-pulse' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-darkBorder text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-800'
        }`}
      >
        <Icon size={14} />
        <span>{text}</span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center border-4 border-white dark:border-darkCard active:scale-90"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="bg-white dark:bg-darkCard w-[90vw] sm:w-[420px] h-[600px] max-h-[70vh] lg:max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-darkBorder flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 transition-all duration-300 -mr-2 lg:mr-0">
          {/* Header */}
          <div className="bg-indigo-600 p-6 text-white flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-lg leading-none">FinVue AI</span>
                <div className="flex items-center space-x-1 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                  <span className="text-[10px] opacity-80 font-semibold uppercase tracking-wider">
                    {isLive ? 'Voz Ativa' : 'Pronto para Conversar'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => { setIsOpen(false); stopLiveSession(); }} className="hover:bg-white/20 p-2.5 rounded-full transition-colors active:scale-90">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-darkBg transition-colors duration-300 scroll-smooth">
            {isLive && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in-95">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                  <div className="relative w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800">
                    <Volume2 className="text-white w-8 h-8 animate-bounce" />
                  </div>
                </div>
                <div className="text-center">
                   <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Modo de Voz Ativo</p>
                   <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Fale naturalmente com seu assistente...</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-darkBorder text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  <div className={`flex items-center space-x-2 mb-2 opacity-40 text-[9px] uppercase font-black tracking-widest ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'user' ? <span>VOCÊ</span> : <span>AGENTE FINVUE</span>}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-center space-x-2 animate-pulse">
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-darkBorder p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-medium text-slate-400">Analisando seus dados...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white dark:bg-darkCard border-t border-slate-100 dark:border-darkBorder transition-colors duration-300 shrink-0">
            <div className="flex items-center space-x-3 mb-5 overflow-x-auto scrollbar-hide py-1">
              <QuickButton text="Resumo" icon={AlignLeft} />
              <QuickButton text="Detalhado" icon={List} />
              {!pendingUserQuestion && <QuickButton text="Dicas" icon={Info} />}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={isLive ? stopLiveSession : startLiveSession}
                disabled={isConnectingLive}
                className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center ${
                  isLive 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'
                }`}
              >
                {isConnectingLive ? <Loader2 className="w-5 h-5 animate-spin" /> : isLive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isLive ? "IA ouvindo..." : (pendingUserQuestion ? "Escolha o formato acima..." : "Como fechei o semestre?...")}
                  disabled={isLoading || isLive}
                  className={`w-full bg-slate-100 dark:bg-slate-800/50 border-2 rounded-[1.5rem] pl-6 pr-14 py-4 text-sm outline-none text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                    pendingUserQuestion ? 'border-indigo-200 dark:border-indigo-900/50 ring-2 ring-indigo-500/10' : 'border-transparent'
                  }`}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim() || isLive}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-2xl disabled:opacity-30 hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
