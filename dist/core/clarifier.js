import { parseSpecMarkdown } from './ears-validator.js';
/**
 * Genera la sesión de preguntas socráticas para la especificación.
 */
export function generateClarificationSession(specContent, severity = 'L2', context) {
    const reqs = parseSpecMarkdown(specContent);
    const questions = [];
    // 1. Análisis de Casos Límite y Recuperación ante Fallos
    const hasUnwanted = reqs.some((r) => r.type === 'Unwanted Behavior');
    if (!hasUnwanted) {
        questions.push({
            id: 'CLARIFY-01',
            category: 'Failure Recovery',
            question: 'No se detectaron requerimientos de comportamiento no deseado (errores). ¿Qué debe ocurrir si un servicio externo, red o base de datos falla durante la ejecución?',
            recommendation: 'Agregar un REQ de tipo "Unwanted Behavior" (SI ... ENTONCES ...) con estrategia de reintentos con backoff o degradación elegante (503).',
            options: [
                '(Recomendado) Reintento exponencial (máx 3 intentos) y degradación segura con respuesta HTTP 503',
                'Fallo inmediato con rollback transaccional y registro en auditoría',
                'Encolar en Dead-Letter Queue (DLQ) para procesamiento asíncrono posterior',
            ],
        });
    }
    // 2. Análisis de Concurrencia y Datos Vacíos
    questions.push({
        id: 'CLARIFY-02',
        category: 'Data Boundaries',
        question: '¿Cómo debe comportarse el sistema si las entradas son listas vacías, strings en blanco o superan el tamaño esperado?',
        recommendation: 'Definir explícitamente en los criterios de aceptación el estado devuelto (ej: colección vacía tipada y 200, o 400 Bad Request si es obligatoria).',
        options: [
            '(Recomendado) Retornar colección vacía tipada [] con HTTP 200; rechazar con 400 Bad Request si la entrada es requerida',
            'Lanzar excepción de validación 400 Bad Request inmediatamente para cualquier entrada en blanco',
            'Asignar valor predeterminado seguro y continuar ejecución',
        ],
    });
    // 3. Análisis de Seguridad / Permisos
    const touchesAuth = reqs.some((r) => /auth|login|token|permission|credencial|usuario/i.test(r.declaration));
    if (touchesAuth || severity === 'L3') {
        questions.push({
            id: 'CLARIFY-03',
            category: 'Security & Auth',
            question: '¿Qué política de expiración, revocación o acceso no autorizado se aplica en las operaciones protegidas?',
            recommendation: 'Especificar respuestas 401 Unauthorized para autenticación fallida, 403 Forbidden para permisos insuficientes y rate limiting.',
            options: [
                '(Recomendado) HTTP 401 para credenciales inválidas, 403 para permisos insuficientes, y rate limit por IP/usuario',
                'Cierre de sesión forzado con revocación de tokens y auditoría de seguridad',
                'Bloqueo temporal preventivo de cuenta tras 5 intentos fallidos consecutivos',
            ],
        });
    }
    // 4. Análisis de Rendimiento (L2 / L3)
    if (severity === 'L2' || severity === 'L3') {
        questions.push({
            id: 'CLARIFY-04',
            category: 'Performance',
            question: '¿Existen restricciones cuantitativas de tiempo de respuesta (SLAs) o volumen máximo esperado?',
            recommendation: 'Cuantificar los tiempos máximos tolerables (ej: < 200ms lectura, < 500ms escritura) y paginación obligatoria.',
            options: [
                '(Recomendado) SLA < 200ms para lecturas y < 500ms para escrituras, con paginación máxima de 50 ítems por página',
                'Límite de payload de 1MB y streaming de datos para respuestas voluminosas',
                'Caché distribuido con TTL de 5 minutos para lecturas idempotentes',
            ],
        });
    }
    // Auto-Grill: si el contexto ya tiene resueltas ciertas políticas en el codebase, marcarlas como auto-resueltas
    if (context) {
        for (const q of questions) {
            if (q.id === 'CLARIFY-03' && context.hasAuth) {
                q.autoResolved = true;
                q.autoResolutionReason =
                    'Detectada infraestructura de autenticación existente en el repositorio. Se aplica la política estándar del proyecto.';
            }
        }
    }
    return questions;
}
/**
 * Organiza la sesión de Auto-Grill separando lo auto-resuelto por el contexto
 * de las preguntas que genuinamente deben escalarse al líder humano.
 */
export function runAutoGrillSession(specContent, severity = 'L2', context) {
    const allQuestions = generateClarificationSession(specContent, severity, context);
    const autoResolved = [];
    const escalatedToHuman = [];
    for (const q of allQuestions) {
        if (q.autoResolved) {
            autoResolved.push(q);
        }
        else {
            escalatedToHuman.push(q);
        }
    }
    return {
        autoResolved,
        escalatedToHuman,
        allQuestions,
    };
}
/**
 * Detector Anti-Complacencia (Anti-Sycophancy / Devil's Advocate)
 * Evalúa las decisiones del humano o de la IA contra invariantes de seguridad,
 * arquitectura y buenas prácticas reconocidas.
 */
export function auditArchitectDecision(decisionText, _context) {
    const violations = [];
    const text = decisionText.toLowerCase();
    // 1. Fallo de autenticación devolviendo 200 OK
    const mentions200 = /(200|ok)/i.test(text);
    const mentionsAuth = /(auth|autentic|login|credencial|token)/i.test(text);
    const mentionsFail = /(fall|error|inv[aá]lid)/i.test(text);
    if ((mentions200 && mentionsAuth && mentionsFail) || /devolver\s+200.*(auth|autentic|login|credencial|token)/i.test(text)) {
        violations.push({
            ruleId: 'DEVIL-01',
            severity: 'CRITICAL',
            issue: 'Se propone responder 200 OK ante fallos de autenticación o credenciales inválidas.',
            violatedInvariant: 'Seguridad REST / OWASP: Errores de autenticación deben retornar HTTP 401 Unauthorized. Retornar 200 enmascara ataques y rompe monitoreo.',
            recommendation: 'Utilizar código canónico HTTP 401 Unauthorized con payload estructurado de error.',
        });
    }
    // 2. Almacenamiento o transporte inseguro de secretos
    if (/(texto\s*plano|plain\s*text|sin\s*cifr|base64.*password|localstorage.*secret|localstorage.*token)/i.test(text)) {
        violations.push({
            ruleId: 'DEVIL-02',
            severity: 'CRITICAL',
            issue: 'Se detecta propuesta de almacenar credenciales o secretos en texto plano, Base64 o almacenamiento vulnerable a XSS.',
            violatedInvariant: 'OWASP A02 (Cryptographic Failures): Contraseñas y tokens sensibles no deben persistirse en texto legible ni en localStorage.',
            recommendation: 'Utilizar hashing robusto (Argon2 / Bcrypt) para contraseñas y cookies HttpOnly SameSite=Strict para tokens de sesión.',
        });
    }
    // 3. Silenciamiento indiscriminado de excepciones
    if (/(ignorar.*error|catch\s*vac[ií]o|silenciar.*excepci[oó]n|sin\s*log.*error)/i.test(text)) {
        violations.push({
            ruleId: 'DEVIL-03',
            severity: 'WARNING',
            issue: 'Se propone silenciar excepciones o ignorar errores sin trazabilidad.',
            violatedInvariant: 'Observabilidad y Resiliencia: Silenciar errores oculta bugs y produce estados corruptos silenciosos en producción.',
            recommendation: 'Capturar errores con logging estructurado (Correlation ID) y aplicar degradación elegante con mensaje seguro al usuario.',
        });
    }
    // 4. Omisión o deshabilitación de pruebas
    if (/(sin|omitir|deshabilitar|no\s+(hacer|crear|ejecutar|escribir))\s+(los\s+|las\s+|el\s+|la\s+)?(tests?|pruebas?)/i.test(text) ||
        /sin\s+pruebas/i.test(text)) {
        violations.push({
            ruleId: 'DEVIL-04',
            severity: 'CRITICAL',
            issue: 'Se propone omitir o deshabilitar pruebas automatizadas.',
            violatedInvariant: 'Constitución SDD (Secciones 1 y 3): Prohibido código de producción sin verificación automatizada reproducible.',
            recommendation: 'Definir al menos una micro-tarea de prueba unitaria o de integración con comando de verificación ejecutable.',
        });
    }
    // 5. Reintentos infinitos sin backoff
    if (/(reintentos?\s*infinitos?|bucle\s*infinito.*reintento|sin\s*l[ií]mite.*reintento)/i.test(text)) {
        violations.push({
            ruleId: 'DEVIL-05',
            severity: 'WARNING',
            issue: 'Se proponen reintentos infinitos ante caídas de servicios.',
            violatedInvariant: 'Resiliencia en Red: Reintentos ilimitados provocan tormentas de red y fallos en cascada (Cascading Failures).',
            recommendation: 'Establecer límite estricto de reintentos (ej: 3) con backoff exponencial y jitter.',
        });
    }
    // 6. Ruptura de compatibilidad hacia atrás sin versionado
    if (/(eliminar\s*campo.*existente|cambiar\s*tipo.*existente|remover.*contrato|romper.*compatibilidad)/i.test(text)) {
        violations.push({
            ruleId: 'DEVIL-06',
            severity: 'WARNING',
            issue: 'Se propone alterar o remover campos existentes en contratos públicos sin versionado.',
            violatedInvariant: 'Invariante de Contratos Públicos: Modificar firmas existentes rompe clientes externos sin previo aviso.',
            recommendation: 'Marcar campos como @deprecated y mantener compatibilidad hacia atrás, o publicar una versión nueva (v2) del contrato.',
        });
    }
    return violations;
}
/**
 * Formatea el reporte de clarificación en Markdown.
 */
export function formatClarificationMarkdown(specId, questions, decisionsMap = {}) {
    let md = `# Registro de Clarificación Socrática: ${specId}\n\n`;
    md += `> **EL ÁRBITRO SDD (ROL: INQUISIDOR):** Registro formal de interrogatorio socrático, decisiones arquitectónicas y auditoría anti-complacencia.\n\n`;
    for (const q of questions) {
        md += `### [${q.id}] (${q.category})\n`;
        md += `**Pregunta Incómoda:** ${q.question}\n\n`;
        md += `**Recomendación del Árbitro:** ${q.recommendation}\n\n`;
        if (q.options && q.options.length > 0) {
            md += `**Opciones Analizadas:**\n`;
            for (const opt of q.options) {
                md += `- ${opt}\n`;
            }
            md += `\n`;
        }
        const dec = decisionsMap[q.id] || '[Pendiente de respuesta]';
        md += `**Decisión Acordada:** ${dec}\n\n---\n\n`;
    }
    return md;
}
/**
 * Incorpora las decisiones acordadas directamente en el contenido de la especificación
 * y actualiza el estado a APPROVED si se han completado.
 */
export function injectDecisionsIntoSpec(specContent, decisions) {
    let updated = specContent;
    // Actualizar Estado a APPROVED si estaba en DRAFT
    updated = updated.replace(/Estado:\s*DRAFT/i, 'Estado: APPROVED');
    let decisionsSection = `\n---\n\n## 3. Registro de Clarificación Socrática y Decisiones de Arquitectura\n\n`;
    decisionsSection += `> **VALIDACIÓN DEL ÁRBITRO:** Decisiones acordadas durante la sesión socrática Grill-Me.\n\n`;
    for (const d of decisions) {
        decisionsSection += `### [${d.questionId}] ${d.category}\n`;
        decisionsSection += `- **Decisión Vinculante:** ${d.decision}\n\n`;
    }
    // Si ya existe la sección 3 o similar, anexar o reemplazar
    if (updated.includes('## 3. Registro de Clarificación Socrática')) {
        const parts = updated.split(/## 3\. Registro de Clarificación Socrática/i);
        updated = parts[0].trimEnd() + '\n' + decisionsSection;
    }
    else {
        updated = updated.trimEnd() + '\n' + decisionsSection;
    }
    return updated;
}
//# sourceMappingURL=clarifier.js.map