
import { Article, ArticleSectionKey, GuidedQuestion } from './types';

export const GUIDED_QUESTIONS: GuidedQuestion[] = [
  {
    key: ArticleSectionKey.PROBLEM,
    question: 'Para empezar, ¿cuál es el problema de investigación que abordas?',
    title: '1. Planteamiento del Problema',
  },
  {
    key: ArticleSectionKey.HYPOTHESIS,
    question: 'Excelente. Ahora, ¿cuál es tu hipótesis principal?',
    title: '2. Hipótesis',
  },
  {
    key: ArticleSectionKey.IMPORTANCE,
    question: 'Entendido. ¿Por qué es importante investigar este problema?',
    title: '3. Importancia y Justificación',
  },
  {
    key: ArticleSectionKey.THEORETICAL_FRAMEWORK,
    question: 'Perfecto. Ahora, ¿cuál es el marco teórico que sustenta tu investigación?',
    title: '4. Marco Teórico',
  },
  {
    key: ArticleSectionKey.METHODOLOGY,
    question: 'Muy bien. ¿Qué método o metodología vas a seguir en tu investigación?',
    title: '5. Metodología',
  },
  {
    key: ArticleSectionKey.LITERATURE,
    question: 'Continuemos. ¿Qué dice la literatura existente sobre este tema?',
    title: '6. Revisión de la Literatura',
  },
  {
    key: ArticleSectionKey.RESULTS,
    question: 'Interesante. ¿Qué resultados esperas obtener con tu investigación?',
    title: '7. Resultados Esperados',
  },
  {
    key: ArticleSectionKey.ANALYSIS,
    question: 'Casi terminamos. ¿Cómo planeas analizar y discutir los resultados?',
    title: '8. Análisis y Discusión',
  },
  {
    key: ArticleSectionKey.CONCLUSION,
    question: 'Finalmente, ¿cuáles serían las conclusiones preliminares o el impacto esperado?',
    title: '9. Conclusiones',
  },
  {
    key: ArticleSectionKey.FUTURE_RESEARCH,
    question: '¡Excelente! Ahora, pensemos a futuro. ¿Qué futuras líneas de investigación se desprenden de tu trabajo?',
    title: '10. Futuras Líneas de Investigación',
  },
  {
    key: ArticleSectionKey.REFERENCES,
    question: 'Basado en nuestro trabajo, generaré una lista de referencias para ti. No necesitas escribir nada aquí.',
    title: '11. Referencias',
  },
];

export const INITIAL_ARTICLE: Article = {
  [ArticleSectionKey.PROBLEM]: '',
  [ArticleSectionKey.HYPOTHESIS]: '',
  [ArticleSectionKey.IMPORTANCE]: '',
  [ArticleSectionKey.THEORETICAL_FRAMEWORK]: '',
  [ArticleSectionKey.METHODOLOGY]: '',
  [ArticleSectionKey.LITERATURE]: '',
  [ArticleSectionKey.RESULTS]: '',
  [ArticleSectionKey.ANALYSIS]: '',
  [ArticleSectionKey.CONCLUSION]: '',
  [ArticleSectionKey.FUTURE_RESEARCH]: '',
  [ArticleSectionKey.REFERENCES]: '',
};