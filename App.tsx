
import React, { useState } from 'react';
import type { AppState, DocumentData } from './types';
import FileUploadView from './components/FileUploadView';
import EditorView from './components/EditorView';
import StructureView from './components/StructureView';
import { BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('uploading');
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileProcessed = (data: DocumentData) => {
    setDocument(data);
    setAppState('structuring');
    setError(null);
  };

  const handleStructureApproved = (structure: string) => {
      setDocument(prev => prev ? { ...prev, proposedStructure: structure } : null);
      setAppState('editing');
  };

  const handleProcessingError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleReset = () => {
    setAppState('uploading');
    setDocument(null);
    setError(null);
  };

  const renderContent = () => {
    switch (appState) {
      case 'structuring':
        if (document) {
            return <StructureView 
                document={document} 
                onStructureApproved={handleStructureApproved}
                onProcessingError={handleProcessingError} 
            />;
        }
        handleReset();
        return null;
      case 'editing':
        if (document && document.proposedStructure) {
          return <EditorView document={document} setDocument={setDocument} onReset={handleReset} />;
        }
        // Fallback in case state is inconsistent
        handleReset();
        return null;
      case 'uploading':
      default:
        return (
          <FileUploadView
            onFileProcessed={handleFileProcessed}
            onProcessingError={handleProcessingError}
            error={error}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      <header className="bg-white shadow-md w-full p-4 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <BrainCircuit className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-800">Chatbot Asistente de Escritura</h1>
            </div>
            {appState !== 'uploading' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Empezar de Nuevo
              </button>
            )}
        </div>
      </header>
      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;