import { Injectable, Logger } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface ClaudeCodeResult {
  success: boolean;
  output: string;
  error?: string;
  filesChanged?: string[];
  branch?: string;
  prUrl?: string;
  diff?: string;
  previewId?: string;
}

interface PendingPreview {
  id: string;
  prompt: string;
  branch: string;
  filesChanged: string[];
  diff: string;
  createdAt: Date;
  createPR: boolean;
}

@Injectable()
export class ClaudeCodeService {
  private readonly logger = new Logger(ClaudeCodeService.name);
  private readonly projectPath: string;
  private isProcessing = false;

  // Хранилище pending previews (ожидают подтверждения)
  private pendingPreviews = new Map<string, PendingPreview>();

  constructor() {
    // Путь к корню проекта (на уровень выше backend)
    this.projectPath = path.resolve(__dirname, '..', '..', '..');

    // Очистка старых previews каждые 10 минут
    setInterval(() => this.cleanupOldPreviews(), 10 * 60 * 1000);
  }

  private cleanupOldPreviews() {
    const now = new Date();
    for (const [id, preview] of this.pendingPreviews) {
      // Удаляем previews старше 30 минут
      if (now.getTime() - preview.createdAt.getTime() > 30 * 60 * 1000) {
        this.cancelPreview(id).catch(() => {});
      }
    }
  }

  /**
   * Проверяет, установлен ли Claude Code CLI
   */
  async isClaudeInstalled(): Promise<boolean> {
    try {
      await execAsync('which claude');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Выполняет запрос к Claude Code в режиме только чтения (без изменений)
   */
  async askClaude(prompt: string): Promise<ClaudeCodeResult> {
    this.logger.log(`Asking Claude: ${prompt.substring(0, 100)}...`);

    try {
      const { stdout, stderr } = await execAsync(
        `claude --print "${this.escapeShellArg(prompt)}"`,
        {
          cwd: this.projectPath,
          timeout: 120000, // 2 минуты
          maxBuffer: 1024 * 1024 * 10, // 10MB
        }
      );

      return {
        success: true,
        output: stdout || stderr,
      };
    } catch (error: any) {
      this.logger.error('Claude ask failed:', error);
      return {
        success: false,
        output: '',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Создаёт preview изменений без коммита (для подтверждения)
   */
  async previewChange(prompt: string, createPR: boolean = true): Promise<ClaudeCodeResult> {
    if (this.isProcessing) {
      return {
        success: false,
        output: '',
        error: 'Другой запрос Claude Code уже выполняется',
      };
    }

    this.isProcessing = true;
    this.logger.log(`Creating preview for: ${prompt.substring(0, 100)}...`);

    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const branchName = `claude-preview/${previewId}`;

    try {
      // Сохраняем текущую ветку
      const { stdout: currentBranch } = await execAsync('git branch --show-current', {
        cwd: this.projectPath,
      });

      // Создаём новую ветку для preview
      await execAsync(`git checkout -b ${branchName}`, { cwd: this.projectPath });

      // Запускаем Claude Code
      const { stdout, stderr } = await execAsync(
        `claude --dangerously-skip-permissions "${this.escapeShellArg(prompt)}"`,
        {
          cwd: this.projectPath,
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 10,
          env: {
            ...process.env,
            CLAUDE_CODE_ENTRYPOINT: 'cli',
          },
        }
      );

      const output = stdout || stderr;

      // Проверяем изменения
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: this.projectPath,
      });

      if (!statusOutput.trim()) {
        // Нет изменений
        await execAsync(`git checkout ${currentBranch.trim()} && git branch -D ${branchName}`, {
          cwd: this.projectPath,
        });
        return {
          success: true,
          output,
          filesChanged: [],
          previewId: undefined,
        };
      }

      // Получаем список файлов и diff
      const filesChanged = statusOutput
        .split('\n')
        .filter(Boolean)
        .map(line => line.substring(3).trim());

      // Получаем diff
      const { stdout: diffOutput } = await execAsync('git diff', {
        cwd: this.projectPath,
        maxBuffer: 1024 * 1024 * 5,
      });

      // Stage изменения (но не коммитим)
      await execAsync('git add .', { cwd: this.projectPath });

      // Также получаем staged diff
      const { stdout: stagedDiff } = await execAsync('git diff --cached', {
        cwd: this.projectPath,
        maxBuffer: 1024 * 1024 * 5,
      });

      const diff = stagedDiff || diffOutput;

      // Сохраняем preview
      this.pendingPreviews.set(previewId, {
        id: previewId,
        prompt,
        branch: branchName,
        filesChanged,
        diff,
        createdAt: new Date(),
        createPR,
      });

      // Возвращаемся на исходную ветку (preview остаётся)
      await execAsync(`git checkout ${currentBranch.trim()}`, { cwd: this.projectPath });

      return {
        success: true,
        output,
        filesChanged,
        diff: this.truncateDiff(diff, 3000),
        previewId,
        branch: branchName,
      };
    } catch (error: any) {
      this.logger.error('Claude preview failed:', error);

      try {
        await execAsync('git checkout main 2>/dev/null || git checkout master', {
          cwd: this.projectPath,
        });
      } catch {
        // Ignore
      }

      return {
        success: false,
        output: '',
        error: error.message || 'Unknown error',
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Применяет ранее созданный preview
   */
  async applyPreview(previewId: string): Promise<ClaudeCodeResult> {
    const preview = this.pendingPreviews.get(previewId);

    if (!preview) {
      return {
        success: false,
        output: '',
        error: 'Превью не найдено или истекло',
      };
    }

    if (this.isProcessing) {
      return {
        success: false,
        output: '',
        error: 'Другая операция уже выполняется',
      };
    }

    this.isProcessing = true;
    this.logger.log(`Applying preview: ${previewId}`);

    try {
      // Переключаемся на ветку preview
      await execAsync(`git checkout ${preview.branch}`, { cwd: this.projectPath });

      // Коммитим изменения
      const commitMessage = `Auto: ${preview.prompt.substring(0, 50)}${preview.prompt.length > 50 ? '...' : ''}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
      await execAsync(`git commit -m "${this.escapeShellArg(commitMessage)}"`, {
        cwd: this.projectPath,
      });

      let prUrl: string | undefined;

      if (preview.createPR) {
        // Пушим и создаём PR
        await execAsync(`git push -u origin ${preview.branch}`, { cwd: this.projectPath });

        const prTitle = `[Claude Auto] ${preview.prompt.substring(0, 60)}`;
        const prBody = `## Автоматические изменения от Claude Code\n\n**Запрос:** ${preview.prompt}\n\n**Изменённые файлы:**\n${preview.filesChanged.map(f => `- ${f}`).join('\n')}\n\n---\n🤖 Сгенерировано через Telegram`;

        const { stdout: prOutput } = await execAsync(
          `gh pr create --title "${this.escapeShellArg(prTitle)}" --body "${this.escapeShellArg(prBody)}" --base main`,
          { cwd: this.projectPath }
        );

        prUrl = prOutput.trim();
      }

      // Возвращаемся на main
      await execAsync('git checkout main', { cwd: this.projectPath });

      // Удаляем preview из хранилища
      this.pendingPreviews.delete(previewId);

      return {
        success: true,
        output: 'Changes applied successfully',
        filesChanged: preview.filesChanged,
        branch: preview.branch,
        prUrl,
      };
    } catch (error: any) {
      this.logger.error('Apply preview failed:', error);

      try {
        await execAsync('git checkout main', { cwd: this.projectPath });
      } catch {
        // Ignore
      }

      return {
        success: false,
        output: '',
        error: error.message || 'Unknown error',
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Отменяет preview и удаляет ветку
   */
  async cancelPreview(previewId: string): Promise<ClaudeCodeResult> {
    const preview = this.pendingPreviews.get(previewId);

    if (!preview) {
      return {
        success: false,
        output: '',
        error: 'Превью не найдено',
      };
    }

    this.logger.log(`Cancelling preview: ${previewId}`);

    try {
      // Убеждаемся что мы на main
      await execAsync('git checkout main 2>/dev/null || git checkout master', {
        cwd: this.projectPath,
      });

      // Удаляем ветку preview
      await execAsync(`git branch -D ${preview.branch}`, { cwd: this.projectPath });

      // Удаляем из хранилища
      this.pendingPreviews.delete(previewId);

      return {
        success: true,
        output: 'Preview cancelled',
      };
    } catch (error: any) {
      // Всё равно удаляем из хранилища
      this.pendingPreviews.delete(previewId);

      return {
        success: true,
        output: 'Preview cancelled (branch may have been already deleted)',
      };
    }
  }

  /**
   * Обрезает diff до разумного размера для Telegram
   */
  private truncateDiff(diff: string, maxLength: number): string {
    if (diff.length <= maxLength) {
      return diff;
    }

    const lines = diff.split('\n');
    let result = '';
    let fileCount = 0;

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        fileCount++;
      }

      if (result.length + line.length > maxLength - 100) {
        result += `\n... (truncated, ${fileCount} files total)`;
        break;
      }

      result += line + '\n';
    }

    return result;
  }

  /**
   * Выполняет изменения через Claude Code с автоматическим применением
   */
  async executeChange(prompt: string, createPR: boolean = true): Promise<ClaudeCodeResult> {
    if (this.isProcessing) {
      return {
        success: false,
        output: '',
        error: 'Другой запрос Claude Code уже выполняется',
      };
    }

    this.isProcessing = true;
    this.logger.log(`Executing Claude change: ${prompt.substring(0, 100)}...`);

    try {
      // Создаём новую ветку для изменений
      const branchName = `claude-auto/${Date.now()}`;
      await execAsync(`git checkout -b ${branchName}`, { cwd: this.projectPath });

      // Запускаем Claude Code с автоматическим применением изменений
      const { stdout, stderr } = await execAsync(
        `claude --dangerously-skip-permissions "${this.escapeShellArg(prompt)}"`,
        {
          cwd: this.projectPath,
          timeout: 300000, // 5 минут
          maxBuffer: 1024 * 1024 * 10,
          env: {
            ...process.env,
            CLAUDE_CODE_ENTRYPOINT: 'cli',
          },
        }
      );

      const output = stdout || stderr;

      // Проверяем, есть ли изменения
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: this.projectPath,
      });

      if (!statusOutput.trim()) {
        // Нет изменений, возвращаемся на main
        await execAsync('git checkout main && git branch -D ' + branchName, {
          cwd: this.projectPath,
        });
        return {
          success: true,
          output,
          filesChanged: [],
        };
      }

      // Получаем список изменённых файлов
      const filesChanged = statusOutput
        .split('\n')
        .filter(Boolean)
        .map(line => line.substring(3).trim());

      // Коммитим изменения
      await execAsync('git add .', { cwd: this.projectPath });

      const commitMessage = `Auto: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
      await execAsync(`git commit -m "${this.escapeShellArg(commitMessage)}"`, {
        cwd: this.projectPath,
      });

      let prUrl: string | undefined;

      if (createPR) {
        // Пушим ветку и создаём PR
        await execAsync(`git push -u origin ${branchName}`, { cwd: this.projectPath });

        const prTitle = `[Claude Auto] ${prompt.substring(0, 60)}`;
        const prBody = `## Автоматические изменения от Claude Code\n\n**Запрос:** ${prompt}\n\n**Изменённые файлы:**\n${filesChanged.map(f => `- ${f}`).join('\n')}\n\n---\n🤖 Сгенерировано через Telegram`;

        const { stdout: prOutput } = await execAsync(
          `gh pr create --title "${this.escapeShellArg(prTitle)}" --body "${this.escapeShellArg(prBody)}" --base main`,
          { cwd: this.projectPath }
        );

        prUrl = prOutput.trim();
      }

      // Возвращаемся на main
      await execAsync('git checkout main', { cwd: this.projectPath });

      return {
        success: true,
        output,
        filesChanged,
        branch: branchName,
        prUrl,
      };
    } catch (error: any) {
      this.logger.error('Claude execute failed:', error);

      // Пытаемся вернуться на main в случае ошибки
      try {
        await execAsync('git checkout main', { cwd: this.projectPath });
      } catch {
        // Игнорируем ошибку checkout
      }

      return {
        success: false,
        output: '',
        error: error.message || 'Unknown error',
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Применяет изменения напрямую в текущую ветку (без PR)
   */
  async executeDirectChange(prompt: string): Promise<ClaudeCodeResult> {
    if (this.isProcessing) {
      return {
        success: false,
        output: '',
        error: 'Другой запрос Claude Code уже выполняется',
      };
    }

    this.isProcessing = true;
    this.logger.log(`Executing direct Claude change: ${prompt.substring(0, 100)}...`);

    try {
      // Запускаем Claude Code
      const { stdout, stderr } = await execAsync(
        `claude --dangerously-skip-permissions "${this.escapeShellArg(prompt)}"`,
        {
          cwd: this.projectPath,
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 10,
          env: {
            ...process.env,
            CLAUDE_CODE_ENTRYPOINT: 'cli',
          },
        }
      );

      const output = stdout || stderr;

      // Проверяем изменения
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: this.projectPath,
      });

      const filesChanged = statusOutput
        .split('\n')
        .filter(Boolean)
        .map(line => line.substring(3).trim());

      if (filesChanged.length > 0) {
        // Коммитим
        await execAsync('git add .', { cwd: this.projectPath });
        const commitMessage = `Auto: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
        await execAsync(`git commit -m "${this.escapeShellArg(commitMessage)}"`, {
          cwd: this.projectPath,
        });
      }

      return {
        success: true,
        output,
        filesChanged,
      };
    } catch (error: any) {
      this.logger.error('Claude direct execute failed:', error);
      return {
        success: false,
        output: '',
        error: error.message || 'Unknown error',
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Экранирование аргументов для shell
   */
  private escapeShellArg(arg: string): string {
    return arg.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
  }

  /**
   * Получает текущий статус git
   */
  async getGitStatus(): Promise<string> {
    try {
      const { stdout } = await execAsync('git status --short', { cwd: this.projectPath });
      return stdout || 'No changes';
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  /**
   * Получает текущую ветку
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: this.projectPath });
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }
}
