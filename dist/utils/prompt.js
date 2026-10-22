import readline from 'node:readline/promises';
export function createProcessIO() {
    return {
        isTTY: Boolean(process.stdin.isTTY),
        async ask(question) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            try {
                return (await rl.question(question)).trim();
            }
            finally {
                rl.close();
            }
        },
    };
}
/**
 * Solo un "sí" explícito confirma; cualquier otra respuesta, incluida la vacía, equivale a "no".
 */
export function isAffirmative(answer) {
    return /^(s|si|sí|y|yes)$/i.test(answer.trim());
}
//# sourceMappingURL=prompt.js.map