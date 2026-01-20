export declare class CreatePayrollPeriodDto {
    userId: string;
    periodStart: string;
    periodEnd: string;
    baseSalary?: number;
    notes?: string;
}
export declare class UpdatePayrollPeriodDto {
    baseSalary?: number;
    notes?: string;
}
export declare class CalculatePayrollDto {
    periodStart: string;
    periodEnd: string;
    userId?: string;
}
export declare class ApprovePayrollDto {
    notes?: string;
}
export declare class PayPayrollDto {
    notes?: string;
}
