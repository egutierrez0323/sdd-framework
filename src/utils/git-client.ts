import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface GitStatus {
  isClean: boolean;
  currentBranch: string;
}

export class GitClient {
  constructor(private cwd: string = process.cwd()) {}

  private async run(cmd: string): Promise<string> {
    try {
      const { stdout } = await execAsync(cmd, { cwd: this.cwd });
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Git error: ${error.message}`);
    }
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const statusOut = await this.run('git status --porcelain');
      const branchOut = await this.run('git branch --show-current');
      return {
        isClean: statusOut.length === 0,
        currentBranch: branchOut || 'detached',
      };
    } catch {
      return { isClean: true, currentBranch: 'none' };
    }
  }

  async createOrCheckoutBranch(branchName: string): Promise<void> {
    try {
      await this.run(`git checkout -B ${branchName}`);
    } catch {
      // Si git no está inicializado, no falla catastróficamente
    }
  }

  async commit(message: string): Promise<void> {
    try {
      await this.run('git add -A');
      await this.run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    } catch {
      // Ignorar si no hay cambios
    }
  }

  async resetHardAndClean(): Promise<void> {
    try {
      await this.run('git reset --hard HEAD');
      await this.run('git clean -fd');
    } catch {
      // Git no inicializado o error controlado
    }
  }
}
