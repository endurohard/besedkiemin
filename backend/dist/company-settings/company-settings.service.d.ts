import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
export declare class CompanySettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(): Promise<{
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        phone: string;
        address: string;
        inn: string;
        logoUrl: string | null;
        website: string;
        director: string;
        bank: string;
        bik: string;
        accountNumber: string;
    }>;
    update(updateDto: UpdateCompanySettingsDto): Promise<{
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        phone: string;
        address: string;
        inn: string;
        logoUrl: string | null;
        website: string;
        director: string;
        bank: string;
        bik: string;
        accountNumber: string;
    }>;
}
