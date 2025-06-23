"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = void 0;
const tslib_1 = require("tslib");
const node_fs_1 = require("node:fs");
const node_path_1 = tslib_1.__importDefault(require("node:path"));
function getFiles(mod) {
    const entries = (0, node_fs_1.readdirSync)(mod, { withFileTypes: true });
    let result = [];
    for (const entry of entries) {
        const fullPath = node_path_1.default.join(mod, entry.name);
        if (entry.isDirectory()) {
            result = result.concat(getFiles(fullPath));
        }
        else {
            result.push(fullPath);
        }
    }
    return result;
}
exports.getFiles = getFiles;
;
