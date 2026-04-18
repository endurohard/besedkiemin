import { PrismaService } from "../prisma/prisma.service";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { UpdateContactRequestDto } from "./dto/update-contact-request.dto";
export declare class ContactRequestsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateContactRequestDto): Promise<{
        message: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }>;
    findAll(onlyUnprocessed?: boolean): Promise<{
        message: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }[]>;
    findOne(id: string): Promise<{
        message: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }>;
    update(id: string, updateDto: UpdateContactRequestDto): Promise<{
        message: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }>;
    remove(id: string): Promise<{
        message: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }>;
}
