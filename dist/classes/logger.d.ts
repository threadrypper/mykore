export declare const enum MessageType {
    ERROR = "ERROR",
    WARN = "WARN",
    DEBUG = "DEBUG",
    INFO = "INFO"
}
export declare class Logger {
    private static AKORE_TAG;
    private static PATH_TAG;
    static error(message: string, path?: string): void;
    static warn(message: string, path?: string): void;
    static debug(message: unknown, path?: string): void;
    static info(message: string, path?: string): void;
    private static getTag;
}
