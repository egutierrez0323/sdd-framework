import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);
export class GitClient {
    cwd;
    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
    }
    async run(cmd) {
        try {
            const { stdout } = await execAsync(cmd, { cwd: this.cwd });
            return stdout.trim();
        }
        catch (error) {
            throw new Error(`Git error: ${error.message}`);
        }
    }
    async getStatus() {
        try {
            const statusOut = await this.run('git status --porcelain');
            const branchOut = await this.run('git branch --show-current');
            return {
                isClean: statusOut.length === 0,
                currentBranch: branchOut || 'detached',
            };
        }
        catch {
            return { isClean: true, currentBranch: 'none' };
        }
    }
    async createOrCheckoutBranch(branchName) {
        try {
            await this.run(`git checkout -B ${branchName}`);
        }
        catch {
            // Si git no está inicializado, no falla catastróficamente
        }
    }
    async commit(message) {
        try {
            await this.run('git add -A');
            await this.run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
        }
        catch {
            // Ignorar si no hay cambios
        }
    }
    async resetHardAndClean() {
        try {
            await this.run('git reset --hard HEAD');
            await this.run('git clean -fd');
        }
        catch {
            // Git no inicializado o error controlado
        }
    }
}
//# sourceMappingURL=git-client.js.map