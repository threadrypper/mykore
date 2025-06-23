export const enum MessageType {
    ERROR = "ERROR",
    WARN = "WARN",
    DEBUG = "DEBUG",
    INFO = "INFO",
}

export class Logger {
    private static AKORE_TAG = "\x1b[94m[AKORE]\x1b[0m";
    private static PATH_TAG = "\x1b[93m[${PATH}]\x1b[0m";
    static error(message: string, path: string = "") {
        console.error(`${Logger.AKORE_TAG} ${Logger.PATH_TAG.replace("${PATH}", path)} ${Logger.getTag(MessageType.ERROR)} ${message}`);
        process.exit();
    };
    static warn(message: string, path: string = ""): void {
        console.warn(`${Logger.AKORE_TAG} ${Logger.PATH_TAG.replace("${PATH}", path)} ${Logger.getTag(MessageType.WARN)} ${message}`);
    };
    static debug(message: unknown, path: string = ""): void {
        console.debug(`${Logger.AKORE_TAG} ${Logger.PATH_TAG.replace("${PATH}", path)} ${Logger.getTag(MessageType.DEBUG)} ${message}`);
    };
    static info(message: string, path: string = ""): void {
        console.info(`${Logger.AKORE_TAG} ${Logger.PATH_TAG.replace("${PATH}", path)} ${Logger.getTag(MessageType.INFO)} ${message}`);
    };
    private static getTag(type: MessageType) {
        switch (type) {
            case MessageType.ERROR:
                return "\x1b[31m[ERROR]\x1b[0m";
            case MessageType.WARN:
                return "\x1b[33m[WARN]\x1b[0m";
            case MessageType.DEBUG:
                return "\x1b[36m[DEBUG]\x1b[0m";
            case MessageType.INFO:
                return "\x1b[32m[INFO]\x1b[0m";
            default:
                return "";
        }
    };
}