
import React, { useRef, useEffect, useState } from 'react';
import type { Message, AppState, GuidedQuestion } from '../types';
import { MessageSender } from '../types';
import { BotIcon, UploadIcon, RestartIcon } from './icons';
import { AppState as AppStates } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onFileUpload: (files: FileList) => void;
  appState: AppState;
  isLoading: boolean;
  currentQuestion: GuidedQuestion | null;
  originalText: string;
  rewrittenTextForCurrentSection: string;
  onDictatedText: (text: string) => void;
  onPolishAndSuggest: () => void;
  onAdvanceToNextSection: () => void;
  onRestart: () => void;
  isInReviewLoop: boolean;
}

const ChatBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
          <BotIcon />
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-xl max-w-md break-words whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-slate-200 text-slate-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />') }} />
      </div>
    </div>
  );
};

const LoadingIndicator = () => (
  <div className="flex items-start gap-3 my-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
      <BotIcon />
    </div>
    <div className="bg-slate-200 text-slate-800 rounded-xl rounded-bl-none px-4 py-3">
        <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
        </div>
    </div>
  </div>
);


const FileUploader: React.FC<{ onFileUpload: (files: FileList) => void }> = ({ onFileUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            onFileUpload(files);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.docx"
                multiple
            />
            <button
                onClick={handleClick}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <span className="mr-2"><UploadIcon /></span>
                Subir Documento(s) (.txt, .docx)
            </button>
        </div>
    );
};

const DictationInput: React.FC<{ 
    value: string; 
    onDictatedText: (text: string) => void; 
    onPolish: () => void; 
    onAdvance: () => void;
    disabled: boolean;
    isInReviewLoop: boolean;
}> = ({ value, onDictatedText, onPolish, onAdvance, disabled, isInReviewLoop }) => {

  return (
    <div className='space-y-3'>
        <textarea
            value={value}
            onChange={(e) => onDictatedText(e.target.value)}
            placeholder={isInReviewLoop ? "Aplica las sugerencias o haz tus propios cambios aquí..." : "Describe esta sección con tu propio estilo..."}
            className="w-full p-2 text-sm bg-white border border-slate-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            rows={4}
            disabled={disabled}
        />
        {isInReviewLoop ? (
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={onPolish}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    disabled={disabled}
                >
                    Aplicar Cambios y Repulir
                </button>
                <button 
                    onClick={onAdvance}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 border border-transparent rounded-md shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    disabled={disabled}
                >
                    Aceptar y Continuar
                </button>
            </div>
        ) : (
            <button 
                onClick={onPolish}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                disabled={disabled || !value.trim()}
            >
                Pulir y Obtener Sugerencias
            </button>
        )}
    </div>
  );
};


export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onFileUpload, appState, isLoading, currentQuestion, originalText, rewrittenTextForCurrentSection, onDictatedText, onPolishAndSuggest, onAdvanceToNextSection, onRestart, isInReviewLoop }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleHeaderUploadClick = () => {
    headerFileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileUpload(files);
      event.target.value = ''; // Reset to allow re-uploading the same file
    }
  };

  const renderFooter = () => {
    switch (appState) {
        case AppStates.WAITING_FOR_UPLOAD:
            return <FileUploader onFileUpload={onFileUpload} />;
        case AppStates.PROCESSING:
            return <p className="text-center text-sm text-slate-500">Procesando documento(s)...</p>;
        case AppStates.REWRITING:
            return <DictationInput 
                      value={rewrittenTextForCurrentSection} 
                      onDictatedText={onDictatedText} 
                      onPolish={onPolishAndSuggest} 
                      onAdvance={onAdvanceToNextSection}
                      disabled={isLoading}
                      isInReviewLoop={isInReviewLoop}
                   />;
        case AppStates.EDITING_COMPLETE:
            return <p className="text-center text-sm text-slate-500">Proceso de escritura completado. Realiza los ajustes finales en el editor.</p>;
        default:
            return null;
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <input
        type="file"
        ref={headerFileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.docx"
        multiple
        disabled={isLoading}
      />
      <header className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Chatbot Escritor</h1>
            <p className="text-sm text-slate-500">Tu asistente de estilo y escritura</p>
          </div>
          <div className="flex items-center space-x-1">
             <button
                onClick={handleHeaderUploadClick}
                title="Subir más documentos"
                className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed [&>svg]:w-5 [&>svg]:h-5"
                disabled={isLoading}
              >
                <UploadIcon />
              </button>
              <button
                onClick={onRestart}
                title="Recomenzar"
                className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <RestartIcon />
              </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
        {appState === AppStates.REWRITING && originalText && !isInReviewLoop && (
             <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-bold text-sm text-amber-800 mb-2">Texto Original a Reescribir:</h4>
                <p className="text-xs text-slate-600 italic whitespace-pre-wrap">"{originalText}"</p>
            </div>
        )}
        {isLoading && <LoadingIndicator />}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        {renderFooter()}
      </div>
    </div>
  );
};