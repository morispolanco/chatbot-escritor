
export type AppState = 'uploading' | 'structuring' | 'editing';

export interface DocumentData {
  fileName: string;
  originalText: string;
  proposedStructure?: string;
  improvedText: string;
}

export type MessageSender = 'user' | 'bot' | 'system';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  suggestion?: string;
}