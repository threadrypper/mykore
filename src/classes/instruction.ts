import { Compiler, Task, TaskArgument } from "./compiler";
import { TokenArgument } from "./lexer";
import lodash from "lodash"
import colors from "colors"
import { Logger } from "./logger";
import { startsWithSome } from "@/helpers/starts_with_some";
import { BooleanMapping, EscapableCharacters, Falsys, Operators } from "@/helpers/constants";
import { getFiles } from "@/helpers/get_files";

export enum ArgumentTypes {
    ANY = 0,
    TEXT = 1,
    NUMBER = 2,
    REGEXP = 3,
    OBJECT = 4,
    ARRAY = 5,
    CONDITION = 6,
    NONE = 7
}

export const enum InstructionStatus {
    Disabled = "DISABLED",
    Enabled = "ENABLED"
}

export abstract class Instruction {
    readonly compiler: Compiler;
    abstract readonly name: string;
    abstract readonly id: string;
    status: InstructionStatus;
    constructor(compiler: Compiler) {
        this.compiler = compiler
        this.status = InstructionStatus.Enabled
    };
    abstract compile(task: Task): string;
    /**
     * Validates the number of arguments and processes each argument based on its type.
     * @param args - The array of arguments to be processed.
     * @param min - The minimum number of arguments required.
     * @param types - The types of arguments.
     */
    validateAndProcessArguments(args: TaskArgument[], min: number, ...types: ArgumentTypes[]): void {
        if (args.length < min) {
            Logger.error(`${colors.bgYellow(this.name)} requires at least ${colors.green(min.toString())} arguments but receives ${colors.red(args.length.toString())} instead!`, `${this.constructor.name}.validateAndProcessArguments`);
        }
        for (let i = 0, type = types[i]; i < args.length; i++, type = types[i]) {
            switch (type) {
                case ArgumentTypes.NUMBER:
                    this.buildNumberArgument(args[i]?.token);
                    break;
                case ArgumentTypes.CONDITION:
                    this.buildConditionArgument(args[i]?.token);
                    break;
                case ArgumentTypes.NONE:
                    break;
                case ArgumentTypes.TEXT:
                case ArgumentTypes.ANY:
                default:
                    this.buildStringArgument(args[i]?.token);
            }
        }
    };
    /**
     * Builds a condition argument by parsing and processing tokens.
     * @param {TokenArgument} arg The token argument to process.
     * @returns {string} The processed condition argument.
     */
    buildConditionArgument(arg: TokenArgument | undefined): string {
        if (lodash.isNil(arg))
            return "";
        let result = "", current = "", depth = 0, i = 0;
        while (i < arg.value.length) {
            const char = arg.value.charAt(i);
            const op = startsWithSome(arg.value, i, Operators);
            // If an operator is found, process the current string as a standalone argument
            if (depth == 0 && op) {
                result += this.buildStringArgument(arg, current.trim()) + " " + op;
                i += op.length; // Skip the length of the operator
                current = "";
            }
            // If it's the beginning of a nested, increment depth
            else if (char === "[") {
                current += char;
                depth++;
                i++;
            }
            // If it's the end of a nested, decrement depth
            else if (char === "]" && depth) {
                current += char;
                depth--;
                i++;
            }
            // If it's backslash, escapes the next character
            else if (char === "\\") {
                const next = arg.value.charAt(i + 1);
                if (typeof next === "string") {
                    current += next;
                    i += 2;
                }
                else {
                    current += char;
                    i++;
                }
            }
            // Otherwise, accumulate characters to form the current argument
            else {
                current += char;
                i++;
            }
        }
        // Process the remaining string as a standalone argument
        result += " " + this.buildStringArgument(arg, current.trim());
        // Update the value of the original argument with the processed result
        return (arg.value = result.trim());
    };
    /**
     * Builds a string argument by processing the given token argument
     * with support for nested tokens and escape characters.
     * @param arg The token argument to build.
     * @param input Optional input string to use for building.
     * @returns The built string argument.
     */
    buildStringArgument(arg: TokenArgument | undefined, input?: string): string {
        if (lodash.isNil(arg))
            return "";
        // Determine the value to use for building.
        const value = input ?? arg.value;
        // Return early if the value is empty or numeric.
        if (!value)
            return "";
        if (value in BooleanMapping)
            return (arg.value = BooleanMapping[value]!);
        if (!isNaN(Number(value)))
            return value;
        // Check if the value is a single nested token and return it directly if so.
        if (arg.nested.length === 1 && arg.nested[0]?.total === value)
            return value;
        // Find nested tokens within the value.
        const nesteds = arg.nested
            .filter((nested) => value.includes(nested.total))
            .map((nested) => ({
            ...nested,
            start: value.indexOf(nested.total),
            end: value.indexOf(nested.total) + nested.total.length,
        }));
        // Initialize the result string.
        let result = "";
        // Initialize variables for tracking the current nested token.
        let nestedIndex = 0;
        let actualNested = nesteds[nestedIndex];
        // Iterate over each character in the value.
        for (let i = 0; i < value.length; i++) {
            // Get the current character.
            const char = value[i];
            const special = startsWithSome(value, i, EscapableCharacters);
            // If the character is a backtick, backslash or interpolation, escape it.
            if (special)
                result += `\\${char}`;
            // If a nested token starts at the current index, replace it with its value.
            else if (actualNested && actualNested.start === i) {
                result += "${" + actualNested.total + "}";
                i = actualNested.end - 1; // Skip the nested token.
                actualNested = nesteds[++nestedIndex]; // Move to the next nested token.
            }
            // Otherwise, add the character to the result.
            else
                result += char;
        }
        // Add backticks to the result.
        if ((result.startsWith("'") && result.endsWith("'")) ||
            (result.startsWith('"') && result.endsWith('"'))) {
            result = `\`${result.slice(1, -1)}\``;
        }
        else
            result = /\${.*}/g.test(result) ? `\`${result}\`` : `"${result}"`;
        // Return the result or update the argument's value if no input was provided.
        return input ? result : (arg.value = result);
    };
    /**
     * Builds string arguments by processing each token in the given array of task arguments.
     * @param {TaskArgument[]} args Array of task arguments containing tokens to be processed.
     */
    buildStringArguments(args: TaskArgument[]): void {
        for (const arg of args) {
            this.buildStringArgument(arg.token);
        }
    };
    /**
     * Builds a number argument by processing the given token argument.
     * @param {TokenArgument | undefined} arg The token argument to be processed.
     * @returns {string} The processed number value.
     */
    buildNumberArgument(arg: TokenArgument | undefined): string {
        if (!arg)
            return "NaN";
        return isNaN(Number(arg.value)) ? (arg.value = "NaN") : arg.value;
    };
    /**
     * Builds number arguments by processing each token in the given array of task arguments.
     * @param {TaskArgument[]} args Array of task arguments containing tokens to be processed.
     */
    buildNumberArguments(args: TaskArgument[]): void {
        for (const arg of args) {
            this.buildNumberArgument(arg.token);
        }
    };
    /**
     * Builds a boolean argument by processing the given token argument.
     * @param {TokenArgument | undefined} arg The token argument to be processed.
     * @returns {string} The processed boolean value.
     */
    buildBooleanArgument(arg: TokenArgument | undefined): "true" | "false" {
        if (!arg)
            return "false";
        return Falsys.has(arg.value) ? "false" : "true";
    };
    /**
     * Builds number arguments by processing each token in the given array of task arguments.
     * @param {TaskArgument[]} args Array of task arguments containing tokens to be processed.
     */
    buildBooleanArguments(args: TaskArgument[]): void {
        for (const arg of args) {
            this.buildBooleanArgument(arg.token);
        }
    };
    /**
     * Processes nested arguments within the given task argument, replacing nested tokens with their compiled values.
     *
     * @param {TaskArgument} arg The task argument to process.
     * @returns {string} The processed value of the task argument.
     */
    processNestedArgument(arg?: TaskArgument): string {
        if (arg) {
            let value = arg.token.value;
            for (const nested of arg.nested) {
                if (nested) {
                    value = value.replace(nested.token.total, nested.compile());
                }
                if (value !== arg.token.value) {
                    arg.token.value = value;
                }
            }
        }
        return arg?.token.value ?? "";
    };
    /**
     * Processes nested arguments within the given task, replacing nested tokens with their compiled values.
     * @param {Task} task The task whose arguments are to be processed.
     */
    processNestedArguments(task: Task): void {
        for (const arg of task.arguments) {
            this.processNestedArgument(arg);
        }
    };
    /**
     * Enables the instruction
     */
    enable(): void {
        this.status = InstructionStatus.Enabled;
    };
    /**
     * Disables the instruction
     */
    disable(): void {
        this.status = InstructionStatus.Disabled;
    };
}

export class InstructionsManager {
    #insts: Instruction[] = [];
    get instructions(): Instruction[] {
        return this.#insts
    };
    add(...instructions: Instruction[]): void {
        this.#insts.push(...instructions);
    };
    loaddir(mod: string, compiler: Compiler): boolean {
        const copy = [...this.#insts];
        for (const file of getFiles(mod).filter((el) => el.endsWith(".js"))) {
            const imported = require(file);
            if ("default" in imported && imported.default?.prototype instanceof Instruction) {
                this.add(new imported.default(compiler));
            }
        }
        return this.#insts !== copy;
    };
}