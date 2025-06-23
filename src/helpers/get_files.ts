import { readdirSync } from "node:fs"
import path from "node:path"

export function getFiles(mod: string): string[] {
    const entries = readdirSync(mod, { withFileTypes: true });
    let result: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(mod, entry.name);
        if (entry.isDirectory()) {
            result = result.concat(getFiles(fullPath));
        }
        else {
            result.push(fullPath);
        }
    }
    return result;
};