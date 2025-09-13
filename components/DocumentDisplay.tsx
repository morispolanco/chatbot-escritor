
import React from 'react';

interface DocumentDisplayProps {
  text: string;
}

const DocumentDisplay: React.FC<DocumentDisplayProps> = ({ text }) => {
  return (
    <div className="p-6 overflow-y-auto flex-grow">
      <div className="prose prose-slate max-w-none">
        {text.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph || '\u00A0'}</p> // Use non-breaking space for empty lines
        ))}
      </div>
    </div>
  );
};

export default DocumentDisplay;
