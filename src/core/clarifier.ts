import { parseSpecMarkdown, EarsRequirement } from './ears-validator.js';
import { SeverityLevel } from './config.js';

export interface ClarificationQuestion {
  id: string;
  category: 'Edge Case' | 'Failure Recovery' | 'Security & Auth' | 'Data Boundaries' | 'Performance';
  targetRequirement?: string;
  question: string;
  recommendation: string;
}

export function generateClarificationSession(
  specContent: string,
  severity: SeverityLevel = 'L2'
): ClarificationQuestion[] {
  const reqs = parseSpecMarkdown(specContent);
  const questions: ClarificationQuestion[] = [];

  // 1. Análisis de Casos Límite y Recuperación ante Fallos
  const hasUnwanted = reqs.some((r) => r.type === 'Unwanted Behavior');
  if (!hasUnwanted) {
    questions.push({
      id: 'CLARIFY-01',
      category: 'Failure Recovery',
      question: 'No se detectaron requerimientos de comportamiento no deseado (errores). ¿Qué debe ocurrir si un servicio externo, red o base de datos falla durante la ejecución?',
      recommendation: 'Agregar un REQ de tipo "Unwanted Behavior" (SI ... ENTONCES ...) con estrategia de reintentos o degradación elegante.',
    });
  }

  // 2. Análisis de Concurrencia y Datos Vacíos
  questions.push({
    id: 'CLARIFY-02',
    category: 'Data Boundaries',
    question: '¿Cómo debe comportarse el sistema si las entradas son listas vacías, strings vacíos o superan el tamaño esperado?',
    recommendation: 'Definir explícitamente en los criterios de aceptación el estado devuelto ante colecciones vacías o límites de tamaño.',
  });

  // 3. Análisis de Seguridad / Permisos
  const touchesAuth = reqs.some((r) => /auth|login|token|permission|credencial/i.test(r.declaration));
  if (touchesAuth || severity === 'L3') {
    questions.push({
      id: 'CLARIFY-03',
      category: 'Security & Auth',
      question: '¿Qué política de expiración, revocación o permisos no autorizados se aplica?',
      recommendation: 'Especificar respuestas 401/403 explícitas y auditoría de eventos de seguridad.',
    });
  }

  // 4. Análisis de Rendimiento (L2 / L3)
  if (severity === 'L2' || severity === 'L3') {
    questions.push({
      id: 'CLARIFY-04',
      category: 'Performance',
      question: '¿Existen restricciones de tiempo de respuesta (SLAs) o concurrencia máxima esperada?',
      recommendation: 'Cuantificar los tiempos máximos tolerables (ej: < 200ms para APIs, < 2s para reportes) en los criterios EARS.',
    });
  }

  return questions;
}

export function formatClarificationMarkdown(
  specId: string,
  questions: ClarificationQuestion[]
): string {
  let md = `# Registro de Clarificación Socrática: ${specId}\n\n`;
  md += `> **EL ÁRBITRO SDD (ROL: INQUISIDOR):** Responda o valide estas preguntas antes de pasar a la fase de Planificación (\`plan.md\`).\n\n`;

  for (const q of questions) {
    md += `### [${q.id}] (${q.category})\n`;
    md += `**Pregunta Incómoda:** ${q.question}\n\n`;
    md += `**Recomendación del Árbitro:** ${q.recommendation}\n\n`;
    md += `**Decisión Acordada:** [Pendiente de respuesta]\n\n---\n\n`;
  }

  return md;
}
