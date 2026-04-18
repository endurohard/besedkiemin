import { UploadService } from "./upload.service";
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadSchemaImage(file: Express.Multer.File): Promise<{
        url: string;
        filename: string;
        originalName: string;
        size: number;
    }>;
}
