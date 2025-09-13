
import React, { useState } from 'react';
import type { DocumentData } from '../types';
import DocumentDisplay from './DocumentDisplay';
import Chatbot from './Chatbot';
import ExportModal from './ExportModal';
import { Download } from 'lucide-react';

interface EditorViewProps {
  document: DocumentData;
  setDocument: React.Dispatch<React.SetStateAction<DocumentData | null>>;
  onReset: () => void;
}

const EditorView: React.FC<EditorViewProps> = ({ document, setDocument, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleApproveSuggestion = (suggestion: string) => {
    setDocument(prevDoc => {
      if (!prevDoc) return null;
      
      const placeholder = 'Tu documento reescrito aparecerá aquí. Responde a las preguntas del asistente para empezar.';
      const newText = prevDoc.improvedText === placeholder
        ? suggestion
        : `${prevDoc.improvedText}\n\n${suggestion}`;

      return { ...prevDoc, improvedText: newText };
    });
  };

  if (!document.proposedStructure) {
    // This should not happen if App.tsx logic is correct, but it's a safe fallback.
    onReset();
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 truncate" title={document.fileName}>
            Documento: {document.fileName}
          </h2>
          <button
            onClick={() => setIsExporting(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
        <DocumentDisplay text={document.improvedText} />
      </div>

      <div className="flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 h-[80vh] lg:h-auto">
        <Chatbot
          documentText={document.originalText}
          improvedText={document.improvedText}
          structure={document.proposedStructure}
          onApproveSuggestion={handleApproveSuggestion}
        />
      </div>

      {isExporting && (
        <ExportModal
          textToExport={document.improvedText}
          fileName={document.fileName}
          onClose={() => setIsExporting(false)}
        />
      )}
    </div>
  );
};

export default EditorView;