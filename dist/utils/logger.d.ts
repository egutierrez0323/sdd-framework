export type ArbiterRole = 'INQUISITOR' | 'ARCHITECT' | 'AUDITOR' | 'SUPERVISOR';
export declare class Logger {
    private static colors;
    static info(message: string): void;
    static success(message: string): void;
    static warn(message: string): void;
    static error(message: string): void;
    static arbiter(role: ArbiterRole, message: string): void;
    static banner(title: string): void;
}
//# sourceMappingURL=logger.d.ts.map