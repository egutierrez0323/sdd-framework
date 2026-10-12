import { SeverityLevel } from './config.js';

export type EarsType =
  | 'Ubiquitous'
  | 'Event-driven'
  | 'State-driven'
  | 'Unwanted Behavior'
  | 'Optional';

export interface EarsRequirement {
  id: string;
  name: string;
  type?: EarsType;
  declaration: string;
  acceptanceCriteria: {
    given?: string;
    when?: string;
    then?: string;
  };
  line: number;
}

export interface ValidationIssue {
  reqId?: string;
  line?: number;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  severity: SeverityLevel;
  totalRequirements: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  requirements: EarsRequirement[];
}

const EARS_PATTERNS = {
  ubiquitous: /(el sistema deber[aá]|the system shall)/i,
  eventDriven: /(cuando|when)\b.*(el sistema deber[aá]|the system shall)/i,
  stateDriven: /(mientras|while)\b.*(el sistema deber[aá]|the system shall)/i,
  unwanted: /(si|if)\b.*(entonces|then)\b.*(el sistema deber[aá]|the system shall)/i,
  optional: /(donde|where)\b.*(el sistema deber[aá]|the system shall)/i,
};

const VAGUE_WORDS = [
  'rápido',
  'adecuado',
  'apropiado',
  'eficiente',
  'etc',
  'etcétera',
  'a veces',
  'normalmente',
  'fácil',
  'óptimo',
];

export function parseSpecMarkdown(content: string): EarsRequirement[] {
  const requirements: EarsRequirement[] = [];
  const lines = content.split(/\r?\n/);

  let currentReq: Partial<EarsRequirement> | null = null;
  let capturing = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detectar encabezado de requerimiento ej: ### REQ-001-01: Nombre
    const reqHeaderMatch = line.match(/^###?\s+(REQ-[A-Za-z0-9-_]+):\s*(.+)$/i);
    if (reqHeaderMatch) {
      if (currentReq && currentReq.id) {
        requirements.push(finalizeReq(currentReq));
      }
      currentReq = {
        id: reqHeaderMatch[1].trim(),
        name: reqHeaderMatch[2].trim(),
        line: lineNum,
        declaration: '',
        acceptanceCriteria: {},
      };
      capturing = '';
      continue;
    }

    if (!currentReq) continue;

    // Tipo EARS
    const typeMatch = line.match(/[-*]\s+\*\*Tipo EARS:\*\*\s*(.+)$/i);
    if (typeMatch) {
      currentReq.type = normalizeEarsType(typeMatch[1].trim());
      continue;
    }

    // Declaración
    if (line.match(/[-*]\s+\*\*Declaraci[oó]n:\*\*/i)) {
      capturing = 'declaration';
      continue;
    }

    // Criterios de aceptación
    if (line.match(/[-*]\s+\*\*Criterio(s)? de Aceptaci[oó]n:\*\*/i)) {
      capturing = 'acceptance';
      continue;
    }

    if (capturing === 'declaration') {
      const trimmed = line.replace(/^>\s*/, '').trim();
      if (trimmed.length > 0) {
        currentReq.declaration = currentReq.declaration
          ? `${currentReq.declaration} ${trimmed}`
          : trimmed;
      }
      if (line.startsWith('-') || line.startsWith('###')) {
        capturing = '';
      }
    }

    if (capturing === 'acceptance' || line.match(/[-*]\s+\*\*(DADO|CUANDO|ENTONCES|GIVEN|WHEN|THEN):\*\*/i)) {
      const givenMatch = line.match(/\*\*(DADO|GIVEN):\*\*\s*(.+)$/i);
      if (givenMatch && currentReq.acceptanceCriteria) {
        currentReq.acceptanceCriteria.given = givenMatch[2].trim();
      }
      const whenMatch = line.match(/\*\*(CUANDO|WHEN):\*\*\s*(.+)$/i);
      if (whenMatch && currentReq.acceptanceCriteria) {
        currentReq.acceptanceCriteria.when = whenMatch[2].trim();
      }
      const thenMatch = line.match(/\*\*(ENTONCES|THEN):\*\*\s*(.+)$/i);
      if (thenMatch && currentReq.acceptanceCriteria) {
        currentReq.acceptanceCriteria.then = thenMatch[2].trim();
      }
    }
  }

  if (currentReq && currentReq.id) {
    requirements.push(finalizeReq(currentReq));
  }

  return requirements;
}

function normalizeEarsType(raw: string): EarsType | undefined {
  if (/event/i.test(raw)) return 'Event-driven';
  if (/state/i.test(raw)) return 'State-driven';
  if (/unwanted|error/i.test(raw)) return 'Unwanted Behavior';
  if (/option/i.test(raw)) return 'Optional';
  if (/ubiquitous|ubicuo/i.test(raw)) return 'Ubiquitous';
  return undefined;
}

function finalizeReq(partial: Partial<EarsRequirement>): EarsRequirement {
  return {
    id: partial.id || 'REQ-UNKNOWN',
    name: partial.name || 'Sin título',
    type: partial.type,
    declaration: partial.declaration || '',
    acceptanceCriteria: partial.acceptanceCriteria || {},
    line: partial.line || 1,
  };
}

export function validateSpec(content: string, severity: SeverityLevel = 'L2'): ValidationReport {
  const requirements = parseSpecMarkdown(content);
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (requirements.length === 0) {
    errors.push({
      message: 'No se encontraron requerimientos formales (### REQ-xxx) en la especificación.',
    });
  }

  for (const req of requirements) {
    // 1. Validar que exista declaración
    if (!req.declaration || req.declaration.trim().length === 0) {
      const issue: ValidationIssue = {
        reqId: req.id,
        line: req.line,
        message: `${req.id}: Falta la declaración del requerimiento.`,
      };
      if (severity === 'L1') warnings.push(issue);
      else errors.push(issue);
      continue;
    }

    // 2. Validar sintaxis EARS según tipo declarado (limpiando marcas de formato como **)
    const cleanDecl = req.declaration.replace(/[*_`]/g, '');
    let satisfiesPattern = false;

    if (req.type === 'Event-driven') satisfiesPattern = EARS_PATTERNS.eventDriven.test(cleanDecl);
    else if (req.type === 'State-driven') satisfiesPattern = EARS_PATTERNS.stateDriven.test(cleanDecl);
    else if (req.type === 'Unwanted Behavior') satisfiesPattern = EARS_PATTERNS.unwanted.test(cleanDecl);
    else if (req.type === 'Optional') satisfiesPattern = EARS_PATTERNS.optional.test(cleanDecl);
    else if (req.type === 'Ubiquitous') satisfiesPattern = EARS_PATTERNS.ubiquitous.test(cleanDecl);
    else {
      // Si no especificó tipo, verificar si cumple cualquiera
      satisfiesPattern = Object.values(EARS_PATTERNS).some((regex) => regex.test(cleanDecl));
    }

    if (!satisfiesPattern) {
      const issue: ValidationIssue = {
        reqId: req.id,
        line: req.line,
        message: `${req.id}: La declaración no cumple el patrón sintáctico EARS esperado para "${req.type || 'General'}".`,
      };
      if (severity === 'L1') warnings.push(issue);
      else errors.push(issue);
    }

    // 3. Validar Criterios de Aceptación (Given-When-Then)
    const hasGiven = Boolean(req.acceptanceCriteria.given);
    const hasWhen = Boolean(req.acceptanceCriteria.when);
    const hasThen = Boolean(req.acceptanceCriteria.then);

    if (!hasGiven || !hasWhen || !hasThen) {
      const missing = [
        !hasGiven && 'DADO',
        !hasWhen && 'CUANDO',
        !hasThen && 'ENTONCES',
      ].filter(Boolean).join(', ');

      const issue: ValidationIssue = {
        reqId: req.id,
        line: req.line,
        message: `${req.id}: Criterio de aceptación incompleto (falta: ${missing}).`,
      };

      if (severity === 'L1') warnings.push(issue);
      else errors.push(issue);
    }

    // 4. Reglas Nivel L3 (Draconian) - Detección de ambigüedad
    if (severity === 'L3') {
      for (const word of VAGUE_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(req.declaration)) {
          errors.push({
            reqId: req.id,
            line: req.line,
            message: `${req.id} (Nivel L3): Palabra ambigua detectada "${word}". En L3 los requisitos deben ser estrictamente cuantitativos.`,
          });
        }
      }
    }
  }

  // En L3 debe haber al menos un requerimiento de comportamiento no deseado (Unwanted Behavior / Error case)
  if (severity === 'L3') {
    const hasErrorReq = requirements.some((r) => r.type === 'Unwanted Behavior');
    if (!hasErrorReq) {
      errors.push({
        message: 'Nivel L3 exige al menos un requerimiento de comportamiento no deseado (Unwanted Behavior) para resiliencia.',
      });
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    severity,
    totalRequirements: requirements.length,
    errors,
    warnings,
    requirements,
  };
}
