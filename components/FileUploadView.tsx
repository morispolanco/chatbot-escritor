import React, { useState, useCallback } from 'react';
import { parseDocx, parsePdf } from '../services/fileService';
import type { DocumentData } from '../types';
import { UploadCloud, FileText, XCircle } from 'lucide-react';

interface FileUploadViewProps {
  onFileProcessed: (data: DocumentData) => void;
  onProcessingError: (error: string) => void;
  error: string | null;
}

const FileUploadView: React.FC<FileUploadViewProps> = ({ onFileProcessed, onProcessingError, error }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    onProcessingError(''); // Clear previous errors

    try {
      let text = '';
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await parseDocx(file);
      } else if (file.type === 'application/pdf') {
        text = await parsePdf(file);
      } else {
        throw new Error('Formato de archivo no soportado. Por favor, sube un archivo Word (.docx) o PDF.');
      }
      
      onFileProcessed({
        fileName: file.name,
        originalText: text,
        improvedText: 'Tu documento reescrito aparecerá aquí. Responde a las preguntas del asistente para empezar.',
      });

    } catch (e) {
      console.error(e);
      onProcessingError((e as Error).message || 'Ocurrió un error al procesar el archivo.');
      setIsProcessing(false);
      setFileName(null);
    }
  }, [onFileProcessed, onProcessingError]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
      <div className="text-center">
        <UploadCloud className="mx-auto h-16 w-16 text-blue-500" />
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Mejora tu Escritura con IA</h2>
        <p className="mt-2 text-md text-slate-600">
          Sube tu documento (.docx o .pdf) y nuestro asistente inteligente te ayudará a refinarlo.
        </p>
      </div>
      <div className="mt-8 w-full max-w-md">
        <label
          htmlFor="file-upload"
          className="relative cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-lg border-2 border-dashed border-blue-300 flex flex-col items-center justify-center transition-colors duration-300 h-40"
        >
          {isProcessing ? (
             <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                <span className="mt-3 text-sm">Procesando {fileName}...</span>
             </div>
          ) : fileName ? (
             <div className="flex flex-col items-center text-center">
                <FileText className="h-8 w-8 text-green-500" />
                <span className="mt-2 text-sm font-medium text-slate-800">{fileName}</span>
                <span className="mt-1 text-xs text-slate-500">¡Listo para procesar!</span>
            </div>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-blue-700">Selecciona un archivo</span>
              <span className="text-xs text-slate-500 mt-1">DOCX o PDF</span>
            </>
          )}
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept=".docx,.pdf"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </label>
      </div>
      {error && (
        <div className="mt-6 flex items-center bg-red-100 text-red-700 p-3 rounded-lg text-sm">
          <XCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploadView;
