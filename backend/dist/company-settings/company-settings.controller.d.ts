import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
export declare class CompanySettingsController {
    private readonly companySettingsService;
    constructor(companySettingsService: CompanySettingsService);
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
