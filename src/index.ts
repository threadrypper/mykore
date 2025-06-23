import { Instruction } from "./classes/instruction";
import { Compiler } from "./classes/compiler";
import { getFiles } from "./helpers/get_files";
import { join } from "node:path";

export const BasicInstructions: Record<string, new (compiler: Compiler) => Instruction> = {};
for (const file of getFiles(join(__dirname, "/instructions")).filter(e => e.endsWith(".js"))) {
    const imported = require(file).default;
    BasicInstructions[imported.name] = imported
}

export * from "./classes/instruction";
export * from "./classes/compiler";
export * from "./classes/logger";
export * from "./classes/lexer";