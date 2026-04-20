import { PrismaService } from "../prisma/prisma.service";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { UpdateContactRequestDto } from "./dto/update-contact-request.dto";
export declare class ContactRequestsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateContactRequestDto): Promise<{
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }>;
    findAll(onlyUnprocessed?: boolean): Promise<{
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }>;
    update(id: string, updateDto: UpdateContactRequestDto): Promise<{
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }>;
    remove(id: string): Promise<{
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        notes: string | null;
        productId: string | null;
        phone: string;
        processedAt: Date | null;
        isProcessed: boolean;
    }>;
}
