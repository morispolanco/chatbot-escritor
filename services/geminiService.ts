
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractSectionFromDocument = async (sectionTitle: string, documentText: string): Promise<string> => {
  try {
    const prompt = `
      Eres un experto investigador y redactor académico. Tu tarea es analizar un documento base y extraer la información relevante para una sección específica de un artículo científico.
      A partir del siguiente documento, extrae y resume el contenido correspondiente a la sección "${sectionTitle}".
      Genera un párrafo conciso y bien redactado en español.
      Si no encuentras información explícita para esta sección en el documento, indica claramente diciendo "No se encontró información relevante para esta sección en el documento proporcionado.".
      No agregues ningún comentario adicional ni frases introductorias.

      Documento:
      """
      ${documentText}
      """
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error(`Error extracting section "${sectionTitle}":`, error);
    return `Lo siento, ha ocurrido un error al procesar la sección "${sectionTitle}".`;
  }
};

export const polishSectionWithAI = async (originalText: string, userText: string, sectionTitle: string): Promise<string> => {
  try {
    const prompt = `
      Eres un editor académico experto. Tu tarea es sintetizar dos versiones de una sección de un artículo científico en una única versión pulida.
      
      Debes lograr los siguientes objetivos:
      1.  **Adoptar el Estilo del Usuario:** La versión final debe reflejar el tono, la voz y el estilo de la "Versión del Usuario". Esta es la prioridad principal.
      2.  **Preservar Información Clave:** Asegúrate de que todos los datos, conceptos y puntos cruciales de la "Versión Original" se mantengan en el resultado final. No se debe perder información importante.
      3.  **Coherencia y Fluidez:** El resultado debe ser un texto coherente, bien redactado y fluido en español.
      4.  **No Añadir Contenido Nuevo:** No inventes información. Trabaja únicamente con el contenido proporcionado en las dos versiones.
      5.  **Respuesta Directa:** Genera únicamente el texto pulido final, sin frases introductorias como "Aquí está la versión pulida:" ni comentarios adicionales.

      **Sección a Trabajar:** ${sectionTitle}

      **Versión Original (Contenido base):**
      """
      ${originalText}
      """

      **Versión del Usuario (Estilo a seguir):**
      """
      ${userText}
      """

      Ahora, genera la versión final pulida.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error(`Error polishing section "${sectionTitle}":`, error);
    return `Hubo un error al pulir esta sección. Por favor, inténtalo de nuevo.

${userText}`; // Return user's text as fallback
  }
};

export const generateImprovementSuggestions = async (originalText: string, polishedText: string): Promise<string> => {
    if (!originalText || !originalText.trim()) {
        return "No hay texto original con el que comparar, ¡así que parece que vas por buen camino! Cuando estés listo, acepta y continúa.";
    }

    try {
        const prompt = `
            Eres un revisor académico y editor experto. Tu tarea es comparar una "Versión Original" de una sección de un artículo con una "Versión Pulida" creada por un usuario y proporcionar sugerencias para mejorarla.

            Tu objetivo es asegurar que la "Versión Pulida" no haya perdido ninguna información crítica o matiz importante de la "Versión Original", y al mismo tiempo, fortalecerla con rigor académico.

            Instrucciones:
            1.  Compara cuidadosamente ambos textos.
            2.  Identifica si algún dato, concepto, cifra o argumento clave de la "Versión Original" fue omitido o simplificado en exceso en la "Versión Pulida".
            3.  Proporciona una lista de 2-3 sugerencias constructivas y específicas. Cada sugerencia debe ser clara y accionable.
            4.  **Sugerir Citas:** Si el argumento del texto puede ser fortalecido, sugiere 1-2 **citas reales** y relevantes de la literatura académica. Formatea las citas en estilo APA 7 dentro del texto, por ejemplo: "(Smith, 2021)". Explica brevemente por qué la cita es relevante.
            5.  Si la "Versión Pulida" es excelente y ha integrado bien toda la información clave, elógiala y menciona que no se necesitan cambios críticos.
            6.  Tu tono debe ser de apoyo y colaborativo, no crítico.
            7.  Responde en español y usa markdown para formatear la lista (ej: "- Sugerencia 1...").

            **Versión Original (Fuente de la verdad):**
            """
            ${originalText}
            """

            **Versión Pulida (A revisar):**
            """
            ${polishedText}
            """

            Ahora, genera tus sugerencias de mejora.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return "No pude generar sugerencias en este momento. Por favor, revisa el texto tú mismo y continúa cuando estés listo.";
    }
};

export const generateReferencesSection = async (articleContent: string): Promise<string> => {
    try {
        const prompt = `
            Eres un bibliotecario de investigación y experto en redacción académica. Tu tarea es generar una lista de referencias bibliográficas completa y precisa basada en el contenido de un artículo académico.

            Instrucciones:
            1.  **Analiza el Contenido:** Lee cuidadosamente el siguiente artículo completo.
            2.  **Identifica Fuentes Clave:** Identifica los conceptos, teorías y datos clave mencionados en el artículo que requerirían citas y referencias.
            3.  **Genera Referencias Reales:** Crea una lista de 5 a 10 referencias bibliográficas utilizando fuentes académicas **reales** (artículos de revistas, libros, actas de congresos). No inventes fuentes.
            4.  **Formato APA 7:** Formatea cada entrada de la lista de referencias estrictamente en estilo APA 7.
            5.  **Relevancia:** Asegúrate de que cada referencia sea directamente relevante para el contenido del artículo.
            6.  **Respuesta Directa:** Genera únicamente la lista de referencias, sin añadir títulos, encabezados como "Referencias" o frases introductorias. Cada referencia debe estar en una nueva línea.

            **Artículo Completo:**
            """
            ${articleContent}
            """

            Ahora, genera la lista de referencias bibliográficas.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating references:", error);
        return "No se pudo generar la lista de referencias en este momento. Puedes intentar de nuevo más tarde o añadirla manualmente.";
    }
};