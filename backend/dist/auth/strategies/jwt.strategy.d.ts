import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
export interface JwtPayload {
    email: string;
    sub: string;
    role: string;
}
export interface AuthenticatedUser {
    userId: string;
    email: string;
    role: Role | null;
    roleCode: string | undefined;
    permissions: string[];
    firstName: string;
    lastName: string;
    telegramId: string | null;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
}
export {};
