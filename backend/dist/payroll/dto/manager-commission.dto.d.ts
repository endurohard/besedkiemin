export declare class CreateManagerCommissionDto {
    userId?: string;
    roleId?: string;
    baseSalary?: number;
    commissionPercent: number;
    minOrderAmount?: number;
    isActive?: boolean;
}
export declare class UpdateManagerCommissionDto {
    baseSalary?: number;
    commissionPercent?: number;
    minOrderAmount?: number;
    isActive?: boolean;
}
