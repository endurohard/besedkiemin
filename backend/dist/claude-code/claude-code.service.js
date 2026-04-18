"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ClaudeCodeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ClaudeCodeService = ClaudeCodeService_1 = class ClaudeCodeService {
    constructor() {
        this.logger = new common_1.Logger(ClaudeCodeService_1.name);
        this.isProcessing = false;
        this.pendingPreviews = new Map();
        this.projectPath = path.resolve(__dirname, "..", "..", "..");
        setInterval(() => this.cleanupOldPreviews(), 10 * 60 * 1000);
    }
    cleanupOldPreviews() {
        const now = new Date();
        for (const [id, preview] of this.pendingPreviews) {
            if (now.getTime() - preview.createdAt.getTime() > 30 * 60 * 1000) {
                this.cancelPreview(id).catch((err) => this.logger.warn(`Cleanup of preview ${id} failed: ${err?.message ?? err}`));
            }
        }
    }
    async isClaudeInstalled() {
        try {
            await execAsync("which claude");
            return true;
        }
        catch {
            return false;
        }
    }
    async askClaude(prompt) {
        this.logger.log(`Asking Claude: ${prompt.substring(0, 100)}...`);
        try {
            const { stdout, stderr } = await execAsync(`claude --print "${this.escapeShellArg(prompt)}"`, {
                cwd: this.projectPath,
                timeout: 120000,
                maxBuffer: 1024 * 1024 * 10,
            });
            return {
                success: true,
                output: stdout || stderr,
            };
        }
        catch (error) {
            this.logger.error("Claude ask failed:", error);
            return {
                success: false,
                output: "",
                error: error.message || "Unknown error",
            };
        }
    }
    async previewChange(prompt, createPR = true) {
        if (this.isProcessing) {
            return {
                success: false,
                output: "",
                error: "Другой запрос Claude Code уже выполняется",
            };
        }
        this.isProcessing = true;
        this.logger.log(`Creating preview for: ${prompt.substring(0, 100)}...`);
        const previewId = `preview_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const branchName = `claude-preview/${previewId}`;
        try {
            const { stdout: currentBranch } = await execAsync("git branch --show-current", {
                cwd: this.projectPath,
            });
            await execAsync(`git checkout -b ${branchName}`, {
                cwd: this.projectPath,
            });
            const { stdout, stderr } = await execAsync(`claude --dangerously-skip-permissions "${this.escapeShellArg(prompt)}"`, {
                cwd: this.projectPath,
                timeout: 300000,
                maxBuffer: 1024 * 1024 * 10,
                env: {
                    ...process.env,
                    CLAUDE_CODE_ENTRYPOINT: "cli",
                },
            });
            const output = stdout || stderr;
            const { stdout: statusOutput } = await execAsync("git status --porcelain", {
                cwd: this.projectPath,
            });
            if (!statusOutput.trim()) {
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
            const filesChanged = statusOutput
                .split("\n")
                .filter(Boolean)
                .map((line) => line.substring(3).trim());
            const { stdout: diffOutput } = await execAsync("git diff", {
                cwd: this.projectPath,
                maxBuffer: 1024 * 1024 * 5,
            });
            await execAsync("git add .", { cwd: this.projectPath });
            const { stdout: stagedDiff } = await execAsync("git diff --cached", {
                cwd: this.projectPath,
                maxBuffer: 1024 * 1024 * 5,
            });
            const diff = stagedDiff || diffOutput;
            this.pendingPreviews.set(previewId, {
                id: previewId,
                prompt,
                branch: branchName,
                filesChanged,
                diff,
                createdAt: new Date(),
                createPR,
            });
            await execAsync(`git checkout ${currentBranch.trim()}`, {
                cwd: this.projectPath,
            });
            return {
                success: true,
                output,
                filesChanged,
                diff: this.truncateDiff(diff, 3000),
                previewId,
                branch: branchName,
            };
        }
        catch (error) {
            this.logger.error("Claude preview failed:", error);
            try {
                await execAsync("git checkout main 2>/dev/null || git checkout master", {
                    cwd: this.projectPath,
                });
            }
            catch {
            }
            return {
                success: false,
                output: "",
                error: error.message || "Unknown error",
            };
        }
        finally {
            this.isProcessing = false;
        }
    }
    async applyPreview(previewId) {
        const preview = this.pendingPreviews.get(previewId);
        if (!preview) {
            return {
                success: false,
                output: "",
                error: "Превью не найдено или истекло",
            };
        }
        if (this.isProcessing) {
            return {
                success: false,
                output: "",
                error: "Другая операция уже выполняется",
            };
        }
        this.isProcessing = true;
        this.logger.log(`Applying preview: ${previewId}`);
        try {
            await execAsync(`git checkout ${preview.branch}`, {
                cwd: this.projectPath,
            });
            const commitMessage = `Auto: ${preview.prompt.substring(0, 50)}${preview.prompt.length > 50 ? "..." : ""}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
            await execAsync(`git commit -m "${this.escapeShellArg(commitMessage)}"`, {
                cwd: this.projectPath,
            });
            let prUrl;
            if (preview.createPR) {
                await execAsync(`git push -u origin ${preview.branch}`, {
                    cwd: this.projectPath,
                });
                const prTitle = `[Claude Auto] ${preview.prompt.substring(0, 60)}`;
                const prBody = `## Автоматические изменения от Claude Code\n\n**Запрос:** ${preview.prompt}\n\n**Изменённые файлы:**\n${preview.filesChanged.map((f) => `- ${f}`).join("\n")}\n\n---\n🤖 Сгенерировано через Telegram`;
                const { stdout: prOutput } = await execAsync(`gh pr create --title "${this.escapeShellArg(prTitle)}" --body "${this.escapeShellArg(prBody)}" --base main`, { cwd: this.projectPath });
                prUrl = prOutput.trim();
            }
            await execAsync("git checkout main", { cwd: this.projectPath });
            this.pendingPreviews.delete(previewId);
            return {
                success: true,
                output: "Changes applied successfully",
                filesChanged: preview.filesChanged,
                branch: preview.branch,
                prUrl,
            };
        }
        catch (error) {
            this.logger.error("Apply preview failed:", error);
            try {
                await execAsync("git checkout main", { cwd: this.projectPath });
            }
            catch {
            }
            return {
                success: false,
                output: "",
                error: error.message || "Unknown error",
            };
        }
        finally {
            this.isProcessing = false;
        }
    }
    async cancelPreview(previewId) {
        const preview = this.pendingPreviews.get(previewId);
        if (!preview) {
            return {
                success: false,
                output: "",
                error: "Превью не найдено",
            };
        }
        this.logger.log(`Cancelling preview: ${previewId}`);
        try {
            await execAsync("git checkout main 2>/dev/null || git checkout master", {
                cwd: this.projectPath,
            });
            await execAsync(`git branch -D ${preview.branch}`, {
                cwd: this.projectPath,
            });
            this.pendingPreviews.delete(previewId);
            return {
                success: true,
                output: "Preview cancelled",
            };
        }
        catch (error) {
            this.pendingPreviews.delete(previewId);
            return {
                success: true,
                output: "Preview cancelled (branch may have been already deleted)",
            };
        }
    }
    truncateDiff(diff, maxLength) {
        if (diff.length <= maxLength) {
            return diff;
        }
        const lines = diff.split("\n");
        let result = "";
        let fileCount = 0;
        for (const line of lines) {
            if (line.startsWith("diff --git")) {
                fileCount++;
            }
            if (result.length + line.length > maxLength - 100) {
                result += `\n... (truncated, ${fileCount} files total)`;
                break;
            }
            result += line + "\n";
        }
        return result;
    }
    async executeChange(prompt, createPR = true) {
        if (this.isProcessing) {
            return {
                success: false,
                output: "",
                error: "Другой запрос Claude Code уже выполняется",
            };
        }
        this.isProcessing = true;
        this.logger.log(`Executing Claude change: ${prompt.substring(0, 100)}...`);
        try {
            const branchName = `claude-auto/${Date.now()}`;
            await execAsync(`git checkout -b ${branchName}`, {
                cwd: this.projectPath,
            });
            const { stdout, stderr } = await execAsync(`claude --dangerously-skip-permissions "${this.escapeShellArg(prompt)}"`, {
                cwd: this.projectPath,
                timeout: 300000,
                maxBuffer: 1024 * 1024 * 10,
                env: {
                    ...process.env,
                    CLAUDE_CODE_ENTRYPOINT: "cli",
                },
            });
            const output = stdout || stderr;
            const { stdout: statusOutput } = await execAsync("git status --porcelain", {
                cwd: this.projectPath,
            });
            if (!statusOutput.trim()) {
                await execAsync("git checkout main && git branch -D " + branchName, {
                    cwd: this.projectPath,
                });
                return {
                    success: true,
                    output,
                    filesChanged: [],
                };
            }
            const filesChanged = statusOutput
                .split("\n")
                .filter(Boolean)
                .map((line) => line.substring(3).trim());
            await execAsync("git add .", { cwd: this.projectPath });
            const commitMessage = `Auto: ${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
            await execAsync(`git commit -m "${this.escapeShellArg(commitMessage)}"`, {
                cwd: this.projectPath,
            });
            let prUrl;
            if (createPR) {
                await execAsync(`git push -u origin ${branchName}`, {
                    cwd: this.projectPath,
                });
                const prTitle = `[Claude Auto] ${prompt.substring(0, 60)}`;
                const prBody = `## Автоматические изменения от Claude Code\n\n**Запрос:** ${prompt}\n\n**Изменённые файлы:**\n${filesChanged.map((f) => `- ${f}`).join("\n")}\n\n---\n🤖 Сгенерировано через Telegram`;
                const { stdout: prOutput } = await execAsync(`gh pr create --title "${this.escapeShellArg(prTitle)}" --body "${this.escapeShellArg(prBody)}" --base main`, { cwd: this.projectPath });
                prUrl = prOutput.trim();
            }
            await execAsync("git checkout main", { cwd: this.projectPath });
            return {
                success: true,
                output,
                filesChanged,
                branch: branchName,
                prUrl,
            };
        }
        catch (error) {
            this.logger.error("Claude execute failed:", error);
            try {
                await execAsync("git checkout main", { cwd: this.projectPath });
            }
            catch {
            }
            return {
                success: false,
                output: "",
                error: error.message || "Unknown error",
            };
        }
        finally {
            this.isProcessing = false;
        }
    }
    async executeDirectChange(prompt) {
        if (this.isProcessing) {
            return {
                success: false,
                output: "",
                error: "Другой запрос Claude Code уже выполняется",
            };
        }
        this.isProcessing = true;
        this.logger.log(`Executing direct Claude change: ${prompt.substring(0, 100)}...`);
        try {
            const { stdout, stderr } = await execAsync(`claude --dangerously-skip-permissions "${this.escapeShellArg(prompt)}"`, {
                cwd: this.projectPath,
                timeout: 300000,
                maxBuffer: 1024 * 1024 * 10,
                env: {
                    ...process.env,
                    CLAUDE_CODE_ENTRYPOINT: "cli",
                },
            });
            const output = stdout || stderr;
            const { stdout: statusOutput } = await execAsync("git status --porcelain", {
                cwd: this.projectPath,
            });
            const filesChanged = statusOutput
                .split("\n")
                .filter(Boolean)
                .map((line) => line.substring(3).trim());
            if (filesChanged.length > 0) {
                await execAsync("git add .", { cwd: this.projectPath });
                const commitMessage = `Auto: ${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
                await execAsync(`git commit -m "${this.escapeShellArg(commitMessage)}"`, {
                    cwd: this.projectPath,
                });
            }
            return {
                success: true,
                output,
                filesChanged,
            };
        }
        catch (error) {
            this.logger.error("Claude direct execute failed:", error);
            return {
                success: false,
                output: "",
                error: error.message || "Unknown error",
            };
        }
        finally {
            this.isProcessing = false;
        }
    }
    escapeShellArg(arg) {
        return arg.replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
    }
    async getGitStatus() {
        try {
            const { stdout } = await execAsync("git status --short", {
                cwd: this.projectPath,
            });
            return stdout || "No changes";
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
    async getCurrentBranch() {
        try {
            const { stdout } = await execAsync("git branch --show-current", {
                cwd: this.projectPath,
            });
            return stdout.trim();
        }
        catch {
            return "unknown";
        }
    }
};
exports.ClaudeCodeService = ClaudeCodeService;
exports.ClaudeCodeService = ClaudeCodeService = ClaudeCodeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ClaudeCodeService);
//# sourceMappingURL=claude-code.service.js.map