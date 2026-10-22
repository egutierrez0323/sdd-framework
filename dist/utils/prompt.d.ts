/**
 * Entrada interactiva inyectable: la CLI usa la del proceso y las pruebas, una falsa.
 */
export interface CliIO {
    isTTY: boolean;
    ask(question: string): Promise<string>;
}
export declare function createProcessIO(): CliIO;
/**
 * Solo un "sí" explícito confirma; cualquier otra respuesta, incluida la vacía, equivale a "no".
 */
export declare function isAffirmative(answer: string): boolean;
//# sourceMappingURL=prompt.d.ts.map