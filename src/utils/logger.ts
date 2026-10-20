export type ArbiterRole = 'INQUISITOR' | 'ARCHITECT' | 'AUDITOR' | 'SUPERVISOR';

export class Logger {
  private static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
  };

  static info(message: string): void {
    console.log(`${this.colors.cyan}ℹ [SDD INFO]${this.colors.reset} ${message}`);
  }

  static success(message: string): void {
    console.log(`${this.colors.green}✔ [SDD ÉXITO]${this.colors.reset} ${message}`);
  }

  static warn(message: string): void {
    console.warn(`${this.colors.yellow}⚠ [SDD ALERTA]${this.colors.reset} ${message}`);
  }

  static error(message: string): void {
    console.error(`${this.colors.red}✖ [SDD ERROR]${this.colors.reset} ${message}`);
  }

  static arbiter(role: ArbiterRole, message: string): void {
    const roleColors: Record<ArbiterRole, string> = {
      INQUISITOR: this.colors.magenta,
      ARCHITECT: this.colors.blue,
      AUDITOR: this.colors.yellow,
      SUPERVISOR: this.colors.cyan,
    };
    const color = roleColors[role] || this.colors.cyan;
    console.log(
      `\n${color}${this.colors.bright}› [ÁRBITRO SDD :: ${role}]${this.colors.reset} ${message}`
    );
  }

  static banner(title: string): void {
    const line = '═'.repeat(60);
    console.log(`\n${this.colors.cyan}${line}${this.colors.reset}`);
    console.log(`${this.colors.bright}  ${title}${this.colors.reset}`);
    console.log(`${this.colors.cyan}${line}${this.colors.reset}\n`);
  }
}
