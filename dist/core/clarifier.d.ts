import { SeverityLevel } from './config.js';
export interface ClarificationQuestion {
    id: string;
    category: 'Edge Case' | 'Failure Recovery' | 'Security & Auth' | 'Data Boundaries' | 'Performance';
    targetRequirement?: string;
    question: string;
    recommendation: string;
    options: string[];
    autoResolved?: boolean;
    autoResolutionReason?: string;
}
export interface InvariantViolation {
    ruleId: string;
    severity: 'CRITICAL' | 'WARNING';
    issue: string;
    violatedInvariant: string;
    recommendation: string;
}
export interface AutoGrillSession {
    autoResolved: ClarificationQuestion[];
    escalatedToHuman: ClarificationQuestion[];
    allQuestions: ClarificationQuestion[];
}
export interface CodebaseContext {
    hasAuth?: boolean;
    hasDatabase?: boolean;
    testRunner?: string;
    knownContracts?: string[];
}
/**
 * Genera la sesión de preguntas socráticas para la especificación.
 */
export declare function generateClarificationSession(specContent: string, severity?: SeverityLevel, context?: CodebaseContext): ClarificationQuestion[];
/**
 * Organiza la sesión de Auto-Grill separando lo auto-resuelto por el contexto
 * de las preguntas que genuinamente deben escalarse al líder humano.
 */
export declare function runAutoGrillSession(specContent: string, severity?: SeverityLevel, context?: CodebaseContext): AutoGrillSession;
/**
 * Detector Anti-Complacencia (Anti-Sycophancy / Devil's Advocate)
 * Evalúa las decisiones del humano o de la IA contra invariantes de seguridad,
 * arquitectura y buenas prácticas reconocidas.
 */
export declare function auditArchitectDecision(decisionText: string, _context?: {
    baselineContracts?: string[];
    constitutionRules?: string[];
}): InvariantViolation[];
/**
 * Formatea el reporte de clarificación en Markdown.
 */
export declare function formatClarificationMarkdown(specId: string, questions: ClarificationQuestion[], decisionsMap?: Record<string, string>): string;
/**
 * Incorpora las decisiones acordadas directamente en el contenido de la especificación
 * y actualiza el estado a APPROVED si se han completado.
 */
export declare function injectDecisionsIntoSpec(specContent: string, decisions: Array<{
    questionId: string;
    category: string;
    decision: string;
}>): string;
//# sourceMappingURL=clarifier.d.ts.map