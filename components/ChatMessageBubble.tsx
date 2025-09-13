
import React from 'react';
import type { ChatMessage } from '../types';
import { Check } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onApprove: (suggestion: string) => void;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, onApprove }) => {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="text-center text-xs text-slate-500 py-2">
        {message.text}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`p-3 rounded-xl max-w-md ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
        <div className="prose prose-sm max-w-none text-inherit">
            {message.text.split('\n').map((line, i) => <p key={i} className="my-1 text-inherit">{line}</p>)}
        </div>
        {message.suggestion && (
          <div className="mt-4 p-4 bg-white/90 border border-blue-200 rounded-lg text-slate-800">
            <p className="text-sm font-semibold mb-2 text-slate-700">Sugerencia:</p>
            <div className="prose prose-sm max-w-none">
              <p>{message.suggestion}</p>
            </div>
            <button
              onClick={() => onApprove(message.suggestion!)}
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Check className="h-4 w-4" />
              Aprobar y Añadir
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageBubble;
