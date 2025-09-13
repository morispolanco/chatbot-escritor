
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { generateInitialQuestions, improveUserResponse } from '../services/geminiService';
import ChatMessageBubble from './ChatMessageBubble';
import { SendHorizonal, Bot } from 'lucide-react';

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
  }, [documentText, structure]); // Run only when document and structure are available.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          {isLoading && (
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className="flex-grow w-full px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;