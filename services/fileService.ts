
// This file relies on global objects attached to the window by the CDNs in index.html
// e.g., mammoth, pdfjsLib, jspdf, docx, saveAs

declare const mammoth: any;
declare const pdfjsLib: any;
declare const jspdf: any;
declare const docx: any;
declare const saveAs: any;

export const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const parsePdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  let fullText = '';
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return fullText;
};

export const exportToDocx = (text: string, fileName: string) => {
    const { Document, Packer, Paragraph } = docx;

    const paragraphs = text.split('\n').map(p => new Paragraph({ text: p }));

    const doc = new Document({
        sections: [{
            children: paragraphs,
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}_mejorado.docx`);
    });
};

export const exportToPdf = (text: string, fileName: string) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, 10);
    doc.save(`${fileName.replace(/\.[^/.]+$/, "")}_mejorado.pdf`);
};
