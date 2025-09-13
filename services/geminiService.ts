import { GoogleGenAI } from "@google/genai";

// Ensure process.env.API_KEY is defined in your environment
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_STRUCTURE = `Eres un editor experto en estructuración de contenido. Tu tarea es analizar el documento proporcionado y proponer una estructura o esquema claro, lógico y mejorado. El objetivo es ayudar al autor a reorganizar sus ideas para un mejor flujo e impacto. Presenta el esquema utilizando encabezados de markdown (ej: '# Título Principal', '## Subtítulo') y listas con viñetas (ej: '* Punto 1'). No reescribas el contenido, solo proporciona la nueva estructura. Responde únicamente con la estructura propuesta.`;

const SYSTEM_INSTRUCTION_ANALYSIS = `Eres un asistente de escritura. El usuario ha aprobado la siguiente estructura para su documento. Basándote en el documento original y en esta nueva estructura, tu tarea es hacer una pregunta inicial, atractiva y abierta para que el usuario comience a escribir la primera sección del nuevo esquema con sus propias palabras. Responde únicamente con la pregunta.`;

const SYSTEM_INSTRUCTION_IMPROVEMENT = `Eres un asistente de escritura colaborativo. El usuario está reescribiendo un documento siguiendo una estructura acordada. Has recibido su último borrador para una sección. Tu tarea es: 1. Mejorar la redacción, la claridad y el flujo del texto del usuario, manteniendo su voz y estilo originales. 2. Devolver SOLO el párrafo o sección mejorada. 3. Después del texto mejorado, en una nueva línea y precedido por '>>', haz una pregunta de seguimiento para guiar al usuario a escribir la siguiente sección del documento, basándote en la estructura general. Tu respuesta DEBE seguir el formato de 'Párrafo mejorado.\\n>> Pregunta de seguimiento.'`;


export const generateDocumentStructure = async (documentText: string): Promise<string> => {
    try {
        const truncatedText = documentText.slice(0, 15000);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analiza el siguiente documento y propón una nueva estructura:\n\n---\n\n${truncatedText}`,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_STRUCTURE,
                temperature: 0.5,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating document structure:", error);
        throw new Error("No se pudo generar una estructura para el documento.");
    }
};


export const generateInitialQuestions = async (documentText: string, structure: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Documento Original (para contexto):\n"${documentText.slice(0, 2000)}..."\n\nEstructura Aprobada:\n${structure}\n\nGenera la pregunta inicial.`,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
                temperature: 0.7,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating initial questions:", error);
        return "Lo siento, tuve un problema. ¿Podrías empezar describiendo la primera sección de tu nueva estructura con tus propias palabras?";
    }
};

export const improveUserResponse = async (userResponse: string, originalContext: string, rewrittenText: string, structure: string): Promise<{ suggestion: string; followupQuestion: string; }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Estructura general del documento:\n"${structure}"\n\nContexto del documento original:\n"${originalContext.slice(0, 1000)}..."\n\nTexto reescrito hasta ahora:\n"${rewrittenText.slice(-2000)}"\n\nRespuesta del usuario para mejorar y continuar:\n"${userResponse}"`,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_IMPROVEMENT,
                temperature: 0.7,
            },
        });
        const fullText = response.text;
        const parts = fullText.split('\n>> ');

        const suggestion = parts[0].trim();
        const followupQuestion = parts.length > 1 ? parts[1].trim() : '¿Qué te gustaría escribir a continuación?'; // Default follow-up

        return { suggestion, followupQuestion };
    } catch (error) {
        console.error("Error improving user response:", error);
        return {
            suggestion: "No pude procesar esa respuesta. Por favor, intenta reformularla.",
            followupQuestion: "¿Podrías intentar describir esa parte de nuevo?"
        };
    }
};