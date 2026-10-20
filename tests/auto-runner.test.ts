import { describe, it, expect } from 'vitest';
import {
  parseTasksMarkdown,
  updateTaskStatusInMarkdown,
  executeAutonomousPlan,
} from '../src/core/auto-runner.js';

describe('Autonomous Runner Module', () => {
  const sampleTasksMarkdown = `
# TASKS-001: Testing

- [ ] **TASK-001-001**: Primera Tarea
  - **Requisito Asociado:** REQ-001-01
  - **Verificación:** \`npm test\`

- [ ] **TASK-001-002**: Segunda Tarea
  - **Requisito Asociado:** REQ-001-02
  - **Verificación:** \`npm run build\`
`;

  it('should parse micro-tasks correctly from markdown', () => {
    const tasks = parseTasksMarkdown(sampleTasksMarkdown);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].id).toBe('TASK-001-001');
    expect(tasks[0].status).toBe('PENDING');
    expect(tasks[0].reqId).toBe('REQ-001-01');
    expect(tasks[0].verifyCommand).toBe('npm test');
  });

  it('should update markdown task status to DONE', () => {
    const updated = updateTaskStatusInMarkdown(sampleTasksMarkdown, 'TASK-001-001', 'DONE');
    expect(updated).toContain('- [x] **TASK-001-001**:');
    expect(updated).toContain('- [ ] **TASK-001-002**:');
  });

  it('should complete tasks autonomously when executor succeeds', async () => {
    const mockExecutor = async () => ({ code: 0, output: 'Tests passed!' });

    const { updatedMarkdown, result } = await executeAutonomousPlan(sampleTasksMarkdown, {
      maxRetries: 2,
      executor: mockExecutor,
      skipCommit: true,
    });

    expect(result.success).toBe(true);
    expect(result.completedTasks).toEqual(['TASK-001-001', 'TASK-001-002']);
    expect(updatedMarkdown).toContain('- [x] **TASK-001-001**:');
    expect(updatedMarkdown).toContain('- [x] **TASK-001-002**:');
  });

  it('should rollback and mark BLOCKED after max retries fail', async () => {
    let callCount = 0;
    const mockFailExecutor = async () => {
      callCount++;
      return { code: 1, output: 'Assertion failed!' };
    };

    const { updatedMarkdown, result } = await executeAutonomousPlan(sampleTasksMarkdown, {
      maxRetries: 3,
      executor: mockFailExecutor,
      skipCommit: true,
    });

    expect(result.success).toBe(false);
    expect(result.blockedTask).toBe('TASK-001-001');
    expect(callCount).toBe(3);
    expect(updatedMarkdown).toContain('- [BLOCKED] **TASK-001-001**:');
    // La segunda tarea no debió ejecutarse
    expect(updatedMarkdown).toContain('- [ ] **TASK-001-002**:');
  });
});
