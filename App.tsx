
import React, { useState, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { EditorPanel } from './components/EditorPanel';
import { extractSectionFromDocument, polishSectionWithAI, generateImprovementSuggestions, generateReferencesSection } from './services/geminiService';
import type { Message, Article, ArticleSectionKey } from './types';
import { MessageSender, AppState } from './types';
import { GUIDED_QUESTIONS, INITIAL_ARTICLE } from './constants';

declare const mammoth: any;

const INITIAL_MESSAGE: Message = { 
  text: "¡Hola! Soy tu asistente de escritura. Sube uno o más documentos (.txt o .docx) para comenzar a darles tu estilo personal.", 
  sender: MessageSender.BOT 
};

const LOCAL_STORAGE_KEY = 'chatbotEscritorState';

function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [originalArticle, setOriginalArticle] = useState<Article>(INITIAL_ARTICLE);
  const [rewrittenArticle, setRewrittenArticle] = useState<Article>(INITIAL_ARTICLE);
  const [userDrafts, setUserDrafts] = useState<Article>(INITIAL_ARTICLE); // Store user's raw input
  const [appState, setAppState] = useState<AppState>(AppState.WAITING_FOR_UPLOAD);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [combinedDocumentText, setCombinedDocumentText] = useState('');
  const [isInReviewLoop, setIsInReviewLoop] = useState(false);

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState) {
          if (savedState.rewrittenArticle) setRewrittenArticle(savedState.rewrittenArticle);
          if (savedState.originalArticle) setOriginalArticle(savedState.originalArticle);
          if (savedState.userDrafts) setUserDrafts(savedState.userDrafts);
          if (typeof savedState.currentSectionIndex === 'number') setCurrentSectionIndex(savedState.currentSectionIndex);
          if (savedState.appState) setAppState(savedState.appState);
          if (savedState.combinedDocumentText) setCombinedDocumentText(savedState.combinedDocumentText);
          if (savedState.messages && savedState.messages.length > 0) {
              setMessages([...savedState.messages, { text: "He restaurado tu sesión anterior. ¡Continuemos!", sender: MessageSender.BOT }]);
          }
          if (typeof savedState.isInReviewLoop === 'boolean') setIsInReviewLoop(savedState.isInReviewLoop);
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const startRewritingProcess = () => {
      setAppState(AppState.REWRITING);
      setCurrentSectionIndex(0);
      setIsInReviewLoop(false);
      const firstQuestion = GUIDED_QUESTIONS[0];
      setMessages(prev => [...prev, {
          text: `¡Excelente! He procesado tus documentos. Empecemos con la primera sección: **${firstQuestion.title}**.

Aquí está el texto original. Léelo y luego usa el cuadro de abajo para dictar o escribir tu propia versión.`,
          sender: MessageSender.BOT
      }]);
  }

  const handleFileUpload = async (files: FileList) => {
    setAppState(AppState.PROCESSING);
    setIsLoading(true);
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    const userMessage = combinedDocumentText
      ? `Añadiendo nuevos documentos: "${fileNames}"...`
      : `Analizando: "${fileNames}"... Esto puede tardar unos minutos.`;
    setMessages(prev => [...prev, { text: userMessage, sender: MessageSender.USER }]);

    const fileReadPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            if (file.name.endsWith('.txt')) {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = (e) => reject('Error reading .txt file');
                reader.readAsText(file);
            } else if (file.name.endsWith('.docx')) {
                reader.onload = (e) => {
                    mammoth.extractRawText({ arrayBuffer: e.target?.result })
                        .then((result: any) => resolve(result.value))
                        .catch((err: any) => reject('Error parsing .docx file'));
                };
                reader.onerror = (e) => reject('Error reading .docx file');
                reader.readAsArrayBuffer(file);
            } else {
                resolve(''); // Ignore unsupported files
            }
        });
    });

    try {
        const newDocumentsText = (await Promise.all(fileReadPromises)).join('\n\n');
        
        if (!newDocumentsText.trim()) {
            throw new Error("No content could be extracted from the files.");
        }
        
        const updatedCombinedText = combinedDocumentText ? `${combinedDocumentText}\n\n${newDocumentsText}` : newDocumentsText;
        setCombinedDocumentText(updatedCombinedText);

        const extractedArticle: Article = { ...INITIAL_ARTICLE };
        for (const question of GUIDED_QUESTIONS) {
            // Don't try to extract the references section from the source doc
            if (question.key === 'references') continue;
            const paragraph = await extractSectionFromDocument(question.title, updatedCombinedText);
            extractedArticle[question.key] = paragraph.replace('No se encontró información relevante para esta sección en el documento proporcionado.', '').trim();
        }

        setOriginalArticle(extractedArticle);
        setIsLoading(false);
        
        if (appState === AppState.WAITING_FOR_UPLOAD) {
            startRewritingProcess();
        } else {
            setAppState(AppState.REWRITING); // Ensure we are in rewriting state
            setMessages(prev => [...prev, {
                text: "¡Documentos adicionales procesados! El texto original de las secciones ha sido actualizado. Puedes continuar.",
                sender: MessageSender.BOT
            }]);
        }

    } catch (error) {
        console.error("File processing error:", error);
        setMessages(prev => [...prev, { text: `Lo siento, hubo un error al procesar los archivos. Asegúrate de que no estén corruptos e inténtalo de nuevo.`, sender: MessageSender.BOT }]);
        setIsLoading(false);
        setAppState(prev => prev === AppState.PROCESSING ? AppState.WAITING_FOR_UPLOAD : prev);
    }
  };
  
  const handleDictatedText = (text: string) => {
      if (currentSectionIndex < GUIDED_QUESTIONS.length) {
        const currentKey = GUIDED_QUESTIONS[currentSectionIndex].key;
        setUserDrafts(prev => ({...prev, [currentKey]: text }));
      }
  }

  const handlePolishAndSuggest = async () => {
    if (currentSectionIndex >= GUIDED_QUESTIONS.length) return;

    setIsLoading(true);
    const currentKey = GUIDED_QUESTIONS[currentSectionIndex].key;
    const currentTitle = GUIDED_QUESTIONS[currentSectionIndex].title;
    const originalText = originalArticle[currentKey];
    const userText = userDrafts[currentKey];

    // User message is implicit in the button click, let's just show bot thinking
    setMessages(prev => [...prev, {
        text: "Entendido. Permíteme pulir esta sección y generar algunas sugerencias. Un momento...",
        sender: MessageSender.BOT
    }]);

    const polishedText = await polishSectionWithAI(originalText, userText, currentTitle);
    const suggestions = await generateImprovementSuggestions(originalText, polishedText);
    
    setRewrittenArticle(prev => ({ ...prev, [currentKey]: polishedText }));
    // CRITICAL: Update the user's draft with the polished text so they can edit it.
    setUserDrafts(prev => ({ ...prev, [currentKey]: polishedText }));

    setMessages(prev => [...prev, {
        text: `Aquí tienes una versión pulida. He añadido algunas sugerencias a continuación para asegurarnos de que sea perfecta. 

Puedes editar el texto directamente en el cuadro de abajo para aplicar los cambios y luego "Repulir", o "Aceptar y Continuar" si estás satisfecho.`,
        sender: MessageSender.BOT
    }, {
        text: suggestions,
        sender: MessageSender.BOT
    }]);

    setIsInReviewLoop(true);
    setIsLoading(false);
  }

  const handleAdvanceToNextSection = async () => {
    setIsInReviewLoop(false);

    const nextIndex = currentSectionIndex + 1;
    const nextQuestion = GUIDED_QUESTIONS[nextIndex];

    if (!nextQuestion) { // We've finished the last section
        setAppState(AppState.EDITING_COMPLETE);
        setMessages(prev => [...prev, {
          text: `¡Hemos terminado! Has escrito todas las secciones. Ahora puedes hacer ajustes finales en el editor de la derecha y exportar tu documento cuando estés listo.`,
          sender: MessageSender.BOT
      }]);
      return;
    }

    // Special handling for the automated References section
    if (nextQuestion.key === 'references') {
        setCurrentSectionIndex(nextIndex);
        setIsLoading(true);
        setMessages(prev => [...prev, {
            text: `¡Excelente trabajo! Para finalizar, basándome en todo el contenido que hemos escrito, generaré una sección de referencias bibliográficas para ti. Esto puede tardar un momento...`,
            sender: MessageSender.BOT
        }]);

        const fullArticleText = GUIDED_QUESTIONS
            .filter(q => q.key !== 'references') // Exclude the empty references section itself
            .map(q => `## ${q.title}\n${rewrittenArticle[q.key]}`)
            .filter(text => text && text.trim() !== '')
            .join('\n\n');

        const references = await generateReferencesSection(fullArticleText);
        setRewrittenArticle(prev => ({ ...prev, ['references']: references }));
        
        setIsLoading(false);
        setAppState(AppState.EDITING_COMPLETE);
        setMessages(prev => [...prev, {
            text: `¡Lista de referencias generada! Con esto, hemos completado el borrador inicial. Revisa todo el documento en el editor y exporta tu trabajo. ¡Felicidades!`,
            sender: MessageSender.BOT
        }]);
    } else { // Normal section advance
        setCurrentSectionIndex(nextIndex);
        
        const nextKey = nextQuestion.key;
        setUserDrafts(prev => ({ ...prev, [nextKey]: '' }));

         setMessages(prev => [...prev, {
          text: `¡Perfecto! Sección guardada. Continuemos con: **${nextQuestion.title}**.

Dicta o escribe tu versión del siguiente texto original.`,
          sender: MessageSender.BOT
      }]);
    }
  }
  
  const handleArticleChange = (section: ArticleSectionKey, value: string) => {
    setRewrittenArticle(prev => ({...prev, [section]: value}));
    // Also update the draft if we are in the review loop for that section
    const currentKey = GUIDED_QUESTIONS[currentSectionIndex]?.key;
    if (isInReviewLoop && section === currentKey) {
       setUserDrafts(prev => ({...prev, [section]: value}));
    }
  };

  const handleSave = () => {
    try {
      const stateToSave = {
        rewrittenArticle,
        originalArticle,
        userDrafts,
        currentSectionIndex,
        appState,
        combinedDocumentText,
        messages,
        isInReviewLoop,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
      alert('Hubo un error al guardar tu progreso.');
    }
  };

  const handleRestart = () => {
    setMessages([INITIAL_MESSAGE]);
    setOriginalArticle(INITIAL_ARTICLE);
    setRewrittenArticle(INITIAL_ARTICLE);
    setUserDrafts(INITIAL_ARTICLE);
    setAppState(AppState.WAITING_FOR_UPLOAD);
    setIsLoading(false);
    setCurrentSectionIndex(0);
    setCombinedDocumentText('');
    setIsInReviewLoop(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };
  
  const currentQuestion = GUIDED_QUESTIONS[currentSectionIndex] || null;
  const originalTextForCurrentSection = currentQuestion ? originalArticle[currentQuestion.key] : '';
  const rewrittenTextForCurrentSection = currentQuestion ? userDrafts[currentQuestion.key] : '';

  return (
    <div className="flex h-screen font-sans antialiased text-slate-800">
      <div className="w-1/3 max-w-md h-screen flex-shrink-0">
        <ChatPanel 
            messages={messages} 
            onFileUpload={handleFileUpload}
            appState={appState}
            isLoading={isLoading}
            currentQuestion={currentQuestion}
            originalText={originalTextForCurrentSection}
            rewrittenTextForCurrentSection={rewrittenTextForCurrentSection}
            onDictatedText={handleDictatedText}
            onPolishAndSuggest={handlePolishAndSuggest}
            onAdvanceToNextSection={handleAdvanceToNextSection}
            onRestart={handleRestart}
            isInReviewLoop={isInReviewLoop}
        />
      </div>
      <main className="flex-1 h-screen overflow-y-auto">
        <EditorPanel 
            article={rewrittenArticle} 
            onArticleChange={handleArticleChange}
            isReady={appState === AppState.REWRITING || appState === AppState.EDITING_COMPLETE}
            currentSectionKey={currentQuestion?.key || null}
            onSave={handleSave}
        />
      </main>
    </div>
  );
}

export default App;