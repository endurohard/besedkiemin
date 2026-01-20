export declare class UploadService {
    private readonly logger;
    getMulterOptions(): {
        storage: import("multer").StorageEngine;
        fileFilter: (req: any, file: any, callback: any) => any;
        limits: {
            fileSize: number;
        };
    };
    deleteFile(filePath: string): Promise<void>;
    getFilePath(filename: string): string;
    getFileUrl(filename: string, baseUrl: string): string;
}
