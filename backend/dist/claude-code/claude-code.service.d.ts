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
export declare class ClaudeCodeService {
    private readonly logger;
    private readonly projectPath;
    private isProcessing;
    private pendingPreviews;
    constructor();
    private cleanupOldPreviews;
    isClaudeInstalled(): Promise<boolean>;
    askClaude(prompt: string): Promise<ClaudeCodeResult>;
    previewChange(prompt: string, createPR?: boolean): Promise<ClaudeCodeResult>;
    applyPreview(previewId: string): Promise<ClaudeCodeResult>;
    cancelPreview(previewId: string): Promise<ClaudeCodeResult>;
    private truncateDiff;
    executeChange(prompt: string, createPR?: boolean): Promise<ClaudeCodeResult>;
    executeDirectChange(prompt: string): Promise<ClaudeCodeResult>;
    private escapeShellArg;
    getGitStatus(): Promise<string>;
    getCurrentBranch(): Promise<string>;
}
