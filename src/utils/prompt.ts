import readline from 'node:readline/promises';

/**
 * Entrada interactiva inyectable: la CLI usa la del proceso y las pruebas, una falsa.
 */
export interface CliIO {
  isTTY: boolean;
  ask(question: string): Promise<string>;
}

export function createProcessIO(): CliIO {
  return {
    isTTY: Boolean(process.stdin.isTTY),
    async ask(question: string): Promise<string> {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      try {
        return (await rl.question(question)).trim();
      } finally {
        rl.close();
      }
    },
  };
}

/**
 * Solo un "sí" explícito confirma; cualquier otra respuesta, incluida la vacía, equivale a "no".
 */
export function isAffirmative(answer: string): boolean {
  return /^(s|si|sí|y|yes)$/i.test(answer.trim());
}
