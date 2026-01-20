export declare class CreatePenaltyDto {
    userId: string;
    amount: number;
    reason: string;
    productId?: string;
    date?: string;
    notes?: string;
}
export declare class UpdatePenaltyDto {
    amount?: number;
    reason?: string;
    notes?: string;
}
export declare class CancelPenaltyDto {
    notes?: string;
}
