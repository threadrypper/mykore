"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicInstructions = void 0;
const tslib_1 = require("tslib");
const get_files_1 = require("./helpers/get_files");
const node_path_1 = require("node:path");
exports.BasicInstructions = {};
for (const file of (0, get_files_1.getFiles)((0, node_path_1.join)(__dirname, "/instructions")).filter(e => e.endsWith(".js"))) {
    const imported = require(file).default;
    exports.BasicInstructions[imported.name] = imported;
}
tslib_1.__exportStar(require("./classes/instruction"), exports);
tslib_1.__exportStar(require("./classes/compiler"), exports);
tslib_1.__exportStar(require("./classes/logger"), exports);
tslib_1.__exportStar(require("./classes/lexer"), exports);
