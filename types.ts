export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export interface Message {
  text: string;
  sender: MessageSender;
}

export enum ArticleSectionKey {
  PROBLEM = 'problem',
  HYPOTHESIS = 'hypothesis',
  IMPORTANCE = 'importance',
  THEORETICAL_FRAMEWORK = 'theoretical_framework',
  METHODOLOGY = 'methodology',
  LITERATURE = 'literature',
  RESULTS = 'results',
  ANALYSIS = 'analysis',
  CONCLUSION = 'conclusion',
  FUTURE_RESEARCH = 'future_research',
  REFERENCES = 'references',
}

export type Article = {
  [key in ArticleSectionKey]: string;
};

export interface GuidedQuestion {
  key: ArticleSectionKey;
  question: string;
  title: string;
}

export enum AppState {
  WAITING_FOR_UPLOAD = 'waiting_for_upload',
  PROCESSING = 'processing',
  REWRITING = 'rewriting',
  EDITING_COMPLETE = 'editing_complete',
}