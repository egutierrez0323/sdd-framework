import { SeverityLevel } from './config.js';
export type EarsType = 'Ubiquitous' | 'Event-driven' | 'State-driven' | 'Unwanted Behavior' | 'Optional';
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
export declare function parseSpecMarkdown(content: string): EarsRequirement[];
export declare function validateSpec(content: string, severity?: SeverityLevel): ValidationReport;
//# sourceMappingURL=ears-validator.d.ts.map