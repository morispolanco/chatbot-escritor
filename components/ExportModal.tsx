
import React from 'react';
import { exportToDocx, exportToPdf } from '../services/fileService';
import { X, FileText, FileCode } from 'lucide-react';

interface ExportModalProps {
  textToExport: string;
  fileName: string;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ textToExport, fileName, onClose }) => {
  
  const handleExportDocx = () => {
    exportToDocx(textToExport, fileName);
    onClose();
  };
  
  const handleExportPdf = () => {
    exportToPdf(textToExport, fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full relative transform transition-all animate-in fade-in-0 zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Exportar Documento</h3>
        <p className="text-slate-600 mb-6">Elige el formato en el que deseas descargar tu documento mejorado.</p>
        
        <div className="space-y-4">
          <button
            onClick={handleExportDocx}
            className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors"
          >
            <FileCode className="h-6 w-6" />
            <span>Descargar como Word (.docx)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-700 font-semibold rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors"
          >
            <FileText className="h-6 w-6" />
            <span>Descargar como PDF (.pdf)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
