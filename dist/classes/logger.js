"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["ERROR"] = "ERROR";
    MessageType["WARN"] = "WARN";
    MessageType["DEBUG"] = "DEBUG";
    MessageType["INFO"] = "INFO";
})(MessageType || (exports.MessageType = MessageType = {}));
class Logger {
    static AKORE_TAG = "\x1b[94m[AKORE]\x1b[0m";
    static PATH_TAG = "\x1b[93m[${PATH}]\x1b[0m";
    static error(message, path = "") {
        console.error(`${Logger.AKORE_TAG} ${Logger.PATH_TAG.replace("${PATH}", path)} ${Logger.getTag("ERROR" /* MessageType.ERROR */)} ${message}`);
        process.exit();
    }
    ;
    static warn(message, path = "") {
        console.warn(`${Logger.AKORE_TAG} ${Logger.PATH_TAG.replace("${PATH}", path)} ${Logger.getTag("WARN" /* MessageType.WARN */)} ${message}`);
    }
    ;
    static debug(message, path = "") {
        console.debug(`${Logger.AKORE_TAG} ${Logger.PATH_TAG.replace("${PATH}", path)} ${Logger.getTag("DEBUG" /* MessageType.DEBUG */)} ${message}`);
    }
    ;
    static info(message, path = "") {
        console.info(`${Logger.AKORE_TAG} ${Logger.PATH_TAG.replace("${PATH}", path)} ${Logger.getTag("INFO" /* MessageType.INFO */)} ${message}`);
    }
    ;
    static getTag(type) {
        switch (type) {
            case "ERROR" /* MessageType.ERROR */:
                return "\x1b[31m[ERROR]\x1b[0m";
            case "WARN" /* MessageType.WARN */:
                return "\x1b[33m[WARN]\x1b[0m";
            case "DEBUG" /* MessageType.DEBUG */:
                return "\x1b[36m[DEBUG]\x1b[0m";
            case "INFO" /* MessageType.INFO */:
                return "\x1b[32m[INFO]\x1b[0m";
            default:
                return "";
        }
    }
    ;
}
exports.Logger = Logger;
