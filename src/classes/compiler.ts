import { Instruction, InstructionsManager } from "./instruction";
import { TokenArgument, Token, Lexer } from "./lexer";
import { minify } from "uglify-js";
import { Logger } from "./logger";
import { toValidVarName } from "@/helpers/to_valid_var_name";
/**
 * Represents an argument in a compilation task.
 */
export interface TaskArgument {
    token: TokenArgument;
    nested: Task[];
}
/**
 * Represents a compilation task.
 */
export class Task {
    readonly token: Token;
    readonly instruction: Instruction;
    readonly compiler: Compiler;
    arguments: TaskArgument[] = [];
    /**
     * Creates an instance of Task.
     * @param token The token associated with the task.
     * @param instruction The instruction associated with the task.
     * @param compiler The compiler instance.
     */
    constructor(token: Token, instruction: Instruction, compiler: Compiler) {
        this.token = token;
        this.instruction = instruction;
        this.compiler = compiler;
        for (let i = 0; i < token.arguments.length; i++) {
            const arg = token.arguments[i];
            if (arg) {
                if (arg.nested.length > 0) {
                    this.arguments[i] = {
                        token: arg,
                        nested: compiler.createTasksFromTokens(arg.nested),
                    };
                }
                else {
                    this.arguments[i] = {
                        token: arg,
                        nested: [],
                    };
                }
            }
        }
    }

    /**
     * Retrieves the values of the arguments in the task.
     * @returns An array of argument values.
     */
    argumentValues<T extends string[]>(): T {
        return this.arguments.map((arg) => arg.token.value) as T;
    };
    /**
     * Compiles the task.
     * @returns The compiled code for the task.
     */
    compile(): string {
        return this.instruction.compile(this);
    };
}

export class Compiler {
    instructionsManager: InstructionsManager;
    private lexer: Lexer = new Lexer("");
    busy: boolean = false;
    variables: Set<string> = new Set();
    imports: Map<string, void | Set<string>> = new Map();
    #input = ''
    #output = ''
    /**
     * Creates an instance of Compiler.
     * @param input The input code to compile.
     * @param instructionsManager The instructions manager instance.
     */
    constructor(input: string = '', instructionsManager?: InstructionsManager) {
        this.instructionsManager = instructionsManager || new InstructionsManager();
        this.lexer.setInput(input);
        this.#input = input;
    };
    /**
     * Retrieves the compiled output.
     */
    get output(): string {
        return this.#output
    };
    /**
     * Retrieves the input code.
     */
    get input(): string {
        return this.#input
    };
    /**
     * Sets the input code for compilation.
     * @param input The input code to set.
     * @returns The Compiler instance for method chaining.
     */
    setInput(input: string): this {
        if (this.busy) {
            Logger.warn("The compiler is already busy!", "Compiler.setInput");
        }
        else {
            this.lexer.setInput((this.#input = input));
        }
        return this;
    };
    createTasksFromTokens(tokens: Token[]): Task[] {
        const tasks: Task[] = [];
        for (const token of tokens) {
            const instruction = this.findInstructionForToken(token);
            if (instruction && instruction.status === "ENABLED" /* InstructionStatus.Enabled */) {
                tasks.push(new Task(token, instruction, this));
            }
        }
        return tasks;
    };
    findInstructionForToken(token: Token): Instruction | undefined {
        return this.instructionsManager.instructions.find((instruction) => instruction.id === token.name || instruction.name === token.name);
    };
    appendToOutput(value: string): void {
        this.#output += value;
    };
    prependToOutput(value: string): void {
        this.#output = value + this.#output;
    };
    insertAtLine(lineNumber: number, value: string): void {
        const lines = this.#output.split("\n");
        if (lineNumber >= 0 && lineNumber < lines.length) {
            lines[lineNumber] += value;
            this.#output = lines.join("\n");
        }
    };
    insertAtPosition(position: number, value: string): void {
        if (position >= 0 && position <= this.#output.length) {
            this.#output = this.#output.slice(0, position) + value + this.#output.slice(position);
        }
    };
    /**
     * Compiles the input code.
     * @param debug Indicates whether debug mode is enabled.
     * @returns The compiled code, or void if an error occurred.
     */
    async compile(debug: boolean = false): Promise<string | void> {
        if (this.busy) {
            Logger.warn("The compiler is already busy!", "Compiler.compile");
            return;
        }
        const start = Date.now();
        this.busy = true;
        if (debug) {
            Logger.debug("Compiler set to busy", "Compiler");
        }
        // Create tasks from tokens
        const tasks = this.createTasksFromTokens(this.lexer.tokenize());
        if (debug) {
            Logger.debug(`Tasks created: ${tasks.length}`, "Compiler.compile");
        }
        // Compile tasks
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (debug) {
                Logger.debug(`Compiling task ${i + 1} of ${tasks.length}: ${task!.token.total}`, "Compiler.compile");
            }
            try {
                const compiled = task!.compile();
                if (debug) {
                    Logger.debug(`Task ${i + 1} compiled successfully:\n${compiled}`, "Compiler.compile");
                }
                if (compiled.trim() !== "")
                    this.appendToOutput(compiled + ";\n");
            }
            catch (error: any) {
                Logger.error(`Error compiling task ${i + 1}: ${error.message}`, "Compiler.compile");
            }
        }
        // Finalize the output
        this.prependToOutput(this.importsToString());
        this.prependToOutput(this.variablesToString());
        let code = minify(`"use strict";\nasync function Main() {\n\t${this.#output.replace(/\n/g, "\n\t")}\n}\n\nMain(this);`, { output: { beautify: true } }).code;
        if (debug) {
            Logger.debug(`Compilation completed in ${Date.now() - start} miliseconds.\nInput code:\n${this.#input}\nOutput code:\n${code}`, "Compiler.compile");
        }
        // Clear data
        this.variables.clear();
        this.imports.clear();
        this.#output = "";
        if (debug) {
            Logger.debug("Data was cleared", "Compiler.compile");
        }
        this.busy = false;
        if (debug) {
            Logger.debug("Compiler set to idle", "Compiler.compile");
        }
        return `// Generated by akore v${require("../../package.json").version} //\n` + code;
    };
    /**
     * Sets a variable in the module's variables set.
     * @param name The name of the variable.
     */
    setVariable(name: string): void {
        // Add the new variable
        this.variables.add(toValidVarName(name));
    };
    /**
     * Converts the variables to string format.
     * @returns A string containing variable statements.
     */
    variablesToString(): `var ${string};\n` {
        return `var ${[...this.variables].join(", ")};\n`;
    };
    /**
     * Adds import statements to the module's imports.
     * @param module The module path to import from.
     * @param keys The keys to import from the module.
     */
    setImport(module: string, ...keys: string[]): void {
        // Check if keys are provided and the import exists
        if (keys.length > 0)
            if (this.imports.has(module))
                keys.forEach((key) => this.imports.get(module)?.add(key));
            else
                this.imports.set(module, new Set(keys));
        // If no keys provided or import doesn't exist, set the import without keys
        else
            this.imports.set(module, undefined);
    };
    /**
     * Converts the module's imports to string format.
     * @returns A string containing import statements.
     */
    importsToString(): string {
        const imports = [];
        for (const [module, keys] of this.imports.entries())
            if (!keys)
                imports.push(`${toValidVarName(module)} = require("${module}")`);
            else
                imports.push(`({ ${[...keys].join(", ")} } = require("${module}"))`);
        return imports.join(";\n") + ";\n";
    };
    /**
     * Loads instructions from the specified directory.
     * @param path The directory path containing instruction files.
     * @returns True if the instructions were loaded successfully, otherwise false.
     */
    loaddir(path: string): boolean {
        return this.instructionsManager.loaddir(path, this);
    };
    addInstruction(...instructions: Instruction[]): void {
        this.instructionsManager.add(...instructions);
    };
    disableInstructions(...names: string[]): void {
        for (const name of names) {
            const index = this.instructionsManager.instructions.findIndex((instruction) => instruction.id === name || instruction.name === name);
            if (index !== -1) {
                this.instructionsManager.instructions[index]?.disable();
            }
        }
    };
    enableInstructions(...names: string[]): void {
        for (const name of names) {
            const index = this.instructionsManager.instructions.findIndex((instruction) => instruction.id === name || instruction.name === name);
            if (index !== -1) {
                this.instructionsManager.instructions[index]?.enable();
            }
        }
    };
}