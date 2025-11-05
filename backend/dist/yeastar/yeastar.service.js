"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YeastarService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let YeastarService = class YeastarService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }
    async getAccessToken(config) {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }
        try {
            const response = await axios_1.default.post(`https://${config.host}/api/v2.0.0/login`, {
                username: config.username,
                password: config.password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false,
                }),
            });
            this.accessToken = response.data.access_token;
            this.tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
            return this.accessToken;
        }
        catch (error) {
            console.error('Yeastar login error:', error.response?.data || error.message);
            throw new common_1.HttpException('Не удалось подключиться к Yeastar API', error.response?.status || 500);
        }
    }
    async makeCall(config, phoneNumber) {
        const token = await this.getAccessToken(config);
        try {
            const response = await axios_1.default.post(`https://${config.host}/api/v2.0.0/extension/dial`, {
                caller: config.extension,
                callee: phoneNumber,
                autoanswer: 'yes',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false,
                }),
            });
            return {
                callid: response.data.callid,
                status: 'calling',
            };
        }
        catch (error) {
            console.error('Yeastar call error:', error.response?.data || error.message);
            throw new common_1.HttpException('Не удалось совершить звонок через Yeastar', error.response?.status || 500);
        }
    }
    async hangupCall(config, callid) {
        const token = await this.getAccessToken(config);
        try {
            await axios_1.default.post(`https://${config.host}/api/v2.0.0/call/hangup`, {
                callid: callid,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false,
                }),
            });
        }
        catch (error) {
            console.error('Yeastar hangup error:', error.response?.data || error.message);
            throw new common_1.HttpException('Не удалось завершить звонок', error.response?.status || 500);
        }
    }
    async getActiveCalls(config) {
        const token = await this.getAccessToken(config);
        try {
            const response = await axios_1.default.get(`https://${config.host}/api/v2.0.0/call/query`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false,
                }),
            });
            return response.data.calls || [];
        }
        catch (error) {
            console.error('Yeastar query error:', error.response?.data || error.message);
            return [];
        }
    }
    async subscribeToEvents(config) {
        console.log('Subscribe to Yeastar events not implemented yet');
    }
};
exports.YeastarService = YeastarService;
exports.YeastarService = YeastarService = __decorate([
    (0, common_1.Injectable)()
], YeastarService);
//# sourceMappingURL=yeastar.service.js.map