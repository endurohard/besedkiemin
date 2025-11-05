interface YeastarConfig {
    host: string;
    username: string;
    password: string;
    extension: string;
}
interface YeastarCallResponse {
    callid: string;
    status: string;
}
export declare class YeastarService {
    private accessToken;
    private tokenExpiry;
    getAccessToken(config: YeastarConfig): Promise<string>;
    makeCall(config: YeastarConfig, phoneNumber: string): Promise<YeastarCallResponse>;
    hangupCall(config: YeastarConfig, callid: string): Promise<void>;
    getActiveCalls(config: YeastarConfig): Promise<any[]>;
    subscribeToEvents(config: YeastarConfig): Promise<void>;
}
export {};
