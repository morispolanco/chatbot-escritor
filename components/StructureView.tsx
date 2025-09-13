
import React, { useState, useEffect } from 'react';
import { generateDocumentStructure } from '../services/geminiService';
import { Loader2, Wand2, CheckCircle } from 'lucide-react';
import type { DocumentData } from '../types';

interface StructureViewProps {
  document: DocumentData;
  onStructureApproved: (structure: string) => void;
  onProcessingError: (error: string) => void;
}

const StructureView: React.FC<StructureViewProps> = ({ document, onStructureApproved, onProcessingError }) => {
  const [structure, setStructure] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getStructure = async () => {
      try {
        setIsLoading(true);
        const generatedStructure = await generateDocumentStructure(document.originalText);
        setStructure(generatedStructure);
      } catch (error) {
        console.error("Error generating document structure:", error);
        onProcessingError("No se pudo generar una estructura para el documento. Por favor, intenta empezar de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };
    getStructure();
  }, [document.originalText, onProcessingError]);

  const handleApprove = () => {
    if (structure) {
      onStructureApproved(structure);
    }
  };

  const renderStructure = (text: string) => {
      return text.split('\n').map((line, index) => {
          line = line.trim();
          if (line.startsWith('# ')) {
              return <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-slate-800">{line.substring(2)}</h2>;
          }
          if (line.startsWith('## ')) {
              return <h3 key={index} className="text-lg font-semibold mt-3 mb-1 text-slate-700">{line.substring(3)}</h3>;
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
              return <li key={index} className="ml-6 text-slate-600">{line.substring(2)}</li>;
          }
          if(line) {
             return <p key={index} className="text-slate-600">{line}</p>;
          }
          return null;
      });
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 animate-in fade-in-0">
      <div className="flex items-center gap-3 mb-4">
        <Wand2 className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Estructura Propuesta</h2>
      </div>
      <p className="text-md text-slate-600 mb-6">
        He analizado tu documento y te propongo la siguiente estructura para mejorar su claridad y flujo.
        Revísala y, si estás de acuerdo, podemos empezar a reescribir el texto juntos.
      </p>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-lg">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="mt-4 text-slate-600">Generando una nueva estructura...</p>
        </div>
      )}

      {structure && !isLoading && (
        <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 max-h-[50vh] overflow-y-auto">
          <div className="prose prose-slate max-w-none">
              <ul>{renderStructure(structure)}</ul>
          </div>
        </div>
      )}

      {!isLoading && structure && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleApprove}
            className="flex items-center gap-2 px-6 py-3 text-md font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <CheckCircle className="h-5 w-5" />
            Aprobar y Empezar a Escribir
          </button>
        </div>
      )}
    </div>
  );
};

export default StructureView;
