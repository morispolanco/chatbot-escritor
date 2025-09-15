import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { generateInitialQuestions, improveUserResponse } from '../services/geminiService';
import ChatMessageBubble from './ChatMessageBubble';
import { SendHorizonal, Bot, Mic } from 'lucide-react';

// For SpeechRecognition API, which may not be in standard TS DOM library
// Fix: Replaced incomplete/incorrect declarations with a complete set for Web Speech API.
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }

    interface SpeechRecognition extends EventTarget {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: (event: SpeechRecognitionEvent) => void;
        onerror: (event: SpeechRecognitionErrorEvent) => void;
        onstart: () => void;
        onend: () => void;
        start(): void;
        stop(): void;
    }

    var SpeechRecognition: {
        prototype: SpeechRecognition;
        new(): SpeechRecognition;
    };
    
    var webkitSpeechRecognition: {
        prototype: SpeechRecognition;
        new(): SpeechRecognition;
    };

    interface SpeechRecognitionEvent extends Event {
        results: SpeechRecognitionResultList;
        resultIndex: number;
    }
    interface SpeechRecognitionErrorEvent extends Event {
        error: string;
    }
    interface SpeechRecognitionResultList {
        [index: number]: SpeechRecognitionResult;
        // FIX: Added readonly modifier to match built-in TypeScript DOM library definitions.
        readonly length: number;
    }
    interface SpeechRecognitionResult {
        [index: number]: SpeechRecognitionAlternative;
        // FIX: Added readonly modifier to match built-in TypeScript DOM library definitions.
        readonly length: number;
        // FIX: Added readonly modifier to match built-in TypeScript DOM library definitions.
        readonly isFinal: boolean;
    }
    interface SpeechRecognitionAlternative {
        // FIX: Added readonly modifier to match built-in TypeScript DOM library definitions.
        readonly transcript: string;
        // FIX: Added readonly modifier to match built-in TypeScript DOM library definitions.
        readonly confidence: number;
    }
}


interface ChatbotProps {
  documentText: string;
  improvedText: string;
  structure: string;
  onApproveSuggestion: (suggestion: string) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ documentText, improvedText, structure, onApproveSuggestion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [nextQuestion, setNextQuestion] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textBeforeListening = useRef<string>('');

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const addMessage = useCallback((sender: 'user' | 'bot' | 'system', text: string, suggestion?: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), sender, text, suggestion }]);
  }, []);

  useEffect(() => {
    const fetchInitialQuestion = async () => {
      addMessage('system', 'Estructura aprobada. ¡Empecemos a escribir!');
      const question = await generateInitialQuestions(documentText, structure);
      addMessage('bot', question);
      setIsLoading(false);
    };

    fetchInitialQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentText, structure]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      setUserInput(prev => (textBeforeListening.current + finalTranscript).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
    };
    
    recognition.onstart = () => {
        setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleToggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      textBeforeListening.current = userInput ? `${userInput} ` : '';
      try {
        recognitionRef.current.start();
      } catch(e) {
        console.error("Could not start recognition", e);
      }
    }
  }, [isListening, userInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
        recognitionRef.current?.stop();
    }
    if (!userInput.trim() || isLoading) return;

    const newUserMessage = userInput;
    addMessage('user', newUserMessage);
    setUserInput('');
    setIsLoading(true);

    const { suggestion, followupQuestion } = await improveUserResponse(newUserMessage, documentText, improvedText, structure);
    setNextQuestion(followupQuestion);
    addMessage('bot', 'Aquí tienes una versión mejorada de tu respuesta. Puedes aprobarla para agregarla a tu documento.', suggestion);
    setIsLoading(false);
  };
  
  const handleApprove = (suggestion: string) => {
      onApproveSuggestion(suggestion);
      addMessage('system', '¡Sugerencia aprobada y añadida al documento!');
      // remove suggestion from message to hide button
      setMessages(prev => prev.map(m => m.suggestion === suggestion ? {...m, suggestion: undefined} : m));

      if (nextQuestion) {
          addMessage('bot', nextQuestion);
          setNextQuestion(null);
      }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
        <Bot className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-slate-800">Asistente de Escritura</h3>
      </div>
      <div className="flex-grow p-4 overflow-y-auto bg-slate-50">
        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} onApprove={handleApprove}/>
          ))}
          {isLoading && !messages.some(m => m.sender !== 'system') && (
             <div className="flex justify-start">
                <div className="bg-slate-200 rounded-lg p-3 max-w-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isListening ? "Escuchando..." : "Escribe tu respuesta aquí..."}
            className="flex-grow w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            disabled={isLoading}
            rows={10}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                }
            }}
          />
          <div className="flex flex-col gap-2">
            <button
                type="button"
                onClick={handleToggleListening}
                disabled={isLoading}
                className={`p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed ${
                isListening
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
                aria-label={isListening ? 'Detener dictado' : 'Iniciar dictado'}
            >
                <Mic className="h-5 w-5" />
            </button>
            <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
                <SendHorizonal className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;