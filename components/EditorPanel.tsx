
import React, { useState } from 'react';
import type { Article, ArticleSectionKey } from '../types';
import { GUIDED_QUESTIONS } from '../constants';
import { DownloadIcon, SaveIcon } from './icons';

interface EditorPanelProps {
  article: Article;
  onArticleChange: (section: ArticleSectionKey, value: string) => void;
  isReady: boolean;
  currentSectionKey: ArticleSectionKey | null;
  onSave: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ article, onArticleChange, isReady, currentSectionKey, onSave }) => {
  const [saveButtonText, setSaveButtonText] = useState('Guardar Progreso');

  const handleSaveClick = () => {
    onSave();
    setSaveButtonText('¡Guardado!');
    setTimeout(() => {
      setSaveButtonText('Guardar Progreso');
    }, 2000);
  };

  const handleExport = async () => {
    if (!(window as any).htmlDocx) {
      console.error('html-to-docx library not found. Please ensure it is loaded.');
      alert('Error: La función de exportación no está disponible. Intenta recargar la página.');
      return;
    }

    let contentHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Artículo Académico</title>
      </head>
      <body>
    `;

    GUIDED_QUESTIONS.forEach(section => {
      if (article[section.key]) {
        contentHtml += `<h1>${section.title}</h1>`;
        // Replace newlines with paragraph tags for better formatting in Word
        const paragraphs = article[section.key].split('\n').filter(p => p.trim() !== '');
        paragraphs.forEach(p => {
            contentHtml += `<p>${p}</p>`;
        });
      }
    });

    contentHtml += `</body></html>`;

    try {
      const fileBuffer = await (window as any).htmlDocx.asBlob(contentHtml, {
        title: 'Artículo Académico',
        orientation: 'portrait',
        margins: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720,
        },
      });

      const url = URL.createObjectURL(fileBuffer);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'articulo_academico.docx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar a DOCX:', error);
      alert('Hubo un error al generar el documento. Por favor, inténtelo de nuevo.');
    }
  };

  if (!isReady) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-center text-slate-500 p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-slate-700">Bienvenido al Editor de Artículos</h2>
            <p className="max-w-md mt-2">Para comenzar, sube tu documento base o borrador en formato <span className="font-semibold text-slate-600">.txt</span> o <span className="font-semibold text-slate-600">.docx</span> utilizando el panel de chat a la izquierda.</p>
            <p className="max-w-md mt-1">El chatbot lo analizará y te guiará para reescribirlo con tu propio estilo.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="p-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800">Editor del Artículo</h2>
        <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveClick}
              disabled={saveButtonText === '¡Guardado!'}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
            >
              <SaveIcon />
              {saveButtonText}
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <DownloadIcon />
              Exportar a Word
            </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 prose max-w-none">
        {GUIDED_QUESTIONS.map(({ key, title }) => (
          <div key={key} className={`mb-8 p-4 rounded-lg transition-all duration-300 ${currentSectionKey === key ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-white'}`}>
            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">{title}</h3>
            <textarea
              value={article[key]}
              onChange={(e) => onArticleChange(key, e.target.value)}
              placeholder="El contenido reescrito aparecerá aquí..."
              className="w-full h-48 p-3 text-sm bg-white border border-slate-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
