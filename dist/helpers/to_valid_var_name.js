"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toValidVarName = void 0;
/**
 * Converts a string into a valid variable name in JavaScript.
 * @param str The string to convert into a valid variable name.
 * @returns The string converted into a valid variable name.
 */
function toValidVarName(str) {
    // Replace all non-alphanumeric and non-underscore characters with underscores
    const validName = str.trim().replace(/[^a-zA-Z0-9_]/g, "_");
    // If the name starts with a number, add an underscore at the beginning
    if (/^[0-9]/.test(validName)) {
        return "_" + validName;
    }
    return validName;
}
exports.toValidVarName = toValidVarName;
;
