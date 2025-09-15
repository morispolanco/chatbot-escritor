import { GoogleGenAI } from "@google/genai";

// Ensure process.env.API_KEY is defined in your environment
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_STRUCTURE = `Eres un editor experto en estructuración de contenido. Tu tarea es analizar el documento proporcionado y proponer una estructura o esquema claro, lógico y mejorado. El objetivo es ayudar al autor a reorganizar sus ideas para un mejor flujo e impacto. Presenta el esquema utilizando encabezados de markdown (ej: '# Título Principal', '## Subtítulo') y listas con viñetas (ej: '* Punto 1'). No reescribas el contenido, solo proporciona la nueva estructura. Responde únicamente con la estructura propuesta.`;

const SYSTEM_INSTRUCTION_RESTRUCTURE = `Eres un editor experto en estructuración de contenido. Tu tarea es revisar una propuesta de estructura para un documento basándote en las observaciones del usuario. Analiza el documento original y las observaciones proporcionadas para generar una NUEVA estructura mejorada que incorpore los cambios solicitados. El objetivo es ayudar al autor a refinar el esquema. Presenta el nuevo esquema utilizando encabezados de markdown y listas con viñetas. Responde únicamente con la nueva estructura propuesta.`;

const SYSTEM_INSTRUCTION_ANALYSIS = `Eres un asistente de escritura con un tono amigable y colaborador. El usuario ha aprobado una estructura para su documento. Tu tarea es formular una pregunta inicial que sea atractiva, abierta y que suene natural, para inspirar al usuario a empezar a escribir la primera sección con sus propias palabras. Evita un lenguaje robótico o demasiado formal. Responde únicamente con la pregunta.`;

const SYSTEM_INSTRUCTION_IMPROVEMENT = `Eres un asistente de escritura colaborativo y un experto en emular el estilo de escritura humano. Tu objetivo es ayudar al usuario a mejorar su texto de manera que sea indistinguible del de un escritor humano y evite ser detectado por herramientas de IA. El usuario está reescribiendo un documento siguiendo una estructura acordada. Has recibido su último borrador para una sección. Tu tarea es:
1.  **Reescribir para sonar humano:** Mejora la redacción, claridad y flujo del texto del usuario. Crucialmente, debes infundir un estilo de escritura natural. Varía la longitud y complejidad de las frases (alta "rafagosidad" o burstiness). Utiliza un vocabulario rico pero no predecible (alta "perplejidad" o perplexity). Evita patrones robóticos y frases que suenen generadas por una IA.
2.  **Mantener la voz original:** Es fundamental que el texto mejorado conserve la voz, el tono y la intención del usuario. No lo hagas sonar como una máquina.
3.  **Devolver solo el texto mejorado:** Responde únicamente con el párrafo o la sección mejorada.
4.  **Pregunta de seguimiento:** Después del texto mejorado, en una nueva línea y precedido por '>>', haz una pregunta de seguimiento para guiar al usuario a escribir la siguiente sección del documento, basándote en la estructura general.
Tu respuesta DEBE seguir estrictamente el formato: 'Párrafo mejorado.\\n>> Pregunta de seguimiento.'`;


export const generateDocumentStructure = async (documentText: string, feedback?: string): Promise<string> => {
    try {
        const truncatedText = documentText.slice(0, 15000);
        
        const isRegenerating = !!feedback;

        const systemInstruction = isRegenerating ? SYSTEM_INSTRUCTION_RESTRUCTURE : SYSTEM_INSTRUCTION_STRUCTURE;

        const contents = isRegenerating 
            ? `Documento Original:\n\n---\n\n${truncatedText}\n\n---\n\nObservaciones del usuario sobre la estructura anterior:\n\n"${feedback}"\n\n---\n\nGenera una nueva estructura mejorada basándote en las observaciones.`
            : `Analiza el siguiente documento y propón una nueva estructura:\n\n---\n\n${truncatedText}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
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
        return "Lo siento, tuve un problema. ¿Podrías empezar describiendo la primera sección de tu nueva estructura con sus propias palabras?";
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