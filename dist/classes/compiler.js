"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = exports.Task = void 0;
const instruction_1 = require("./instruction");
const lexer_1 = require("./lexer");
const uglify_js_1 = require("uglify-js");
const logger_1 = require("./logger");
const to_valid_var_name_1 = require("../helpers/to_valid_var_name");
/**
 * Represents a compilation task.
 */
class Task {
    token;
    instruction;
    compiler;
    arguments = [];
    /**
     * Creates an instance of Task.
     * @param token The token associated with the task.
     * @param instruction The instruction associated with the task.
     * @param compiler The compiler instance.
     */
    constructor(token, instruction, compiler) {
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
    argumentValues() {
        return this.arguments.map((arg) => arg.token.value);
    }
    ;
    /**
     * Compiles the task.
     * @returns The compiled code for the task.
     */
    compile() {
        return this.instruction.compile(this);
    }
    ;
}
exports.Task = Task;
class Compiler {
    instructionsManager;
    lexer = new lexer_1.Lexer("");
    busy = false;
    variables = new Set();
    imports = new Map();
    #input = '';
    #output = '';
    /**
     * Creates an instance of Compiler.
     * @param input The input code to compile.
     * @param instructionsManager The instructions manager instance.
     */
    constructor(input = '', instructionsManager) {
        this.instructionsManager = instructionsManager || new instruction_1.InstructionsManager();
        this.lexer.setInput(input);
        this.#input = input;
    }
    ;
    /**
     * Retrieves the compiled output.
     */
    get output() {
        return this.#output;
    }
    ;
    /**
     * Retrieves the input code.
     */
    get input() {
        return this.#input;
    }
    ;
    /**
     * Sets the input code for compilation.
     * @param input The input code to set.
     * @returns The Compiler instance for method chaining.
     */
    setInput(input) {
        if (this.busy) {
            logger_1.Logger.warn("The compiler is already busy!", "Compiler.setInput");
        }
        else {
            this.lexer.setInput((this.#input = input));
        }
        return this;
    }
    ;
    createTasksFromTokens(tokens) {
        const tasks = [];
        for (const token of tokens) {
            const instruction = this.findInstructionForToken(token);
            if (instruction && instruction.status === "ENABLED" /* InstructionStatus.Enabled */) {
                tasks.push(new Task(token, instruction, this));
            }
        }
        return tasks;
    }
    ;
    findInstructionForToken(token) {
        return this.instructionsManager.instructions.find((instruction) => instruction.id === token.name || instruction.name === token.name);
    }
    ;
    appendToOutput(value) {
        this.#output += value;
    }
    ;
    prependToOutput(value) {
        this.#output = value + this.#output;
    }
    ;
    insertAtLine(lineNumber, value) {
        const lines = this.#output.split("\n");
        if (lineNumber >= 0 && lineNumber < lines.length) {
            lines[lineNumber] += value;
            this.#output = lines.join("\n");
        }
    }
    ;
    insertAtPosition(position, value) {
        if (position >= 0 && position <= this.#output.length) {
            this.#output = this.#output.slice(0, position) + value + this.#output.slice(position);
        }
    }
    ;
    /**
     * Compiles the input code.
     * @param debug Indicates whether debug mode is enabled.
     * @returns The compiled code, or void if an error occurred.
     */
    async compile(debug = false) {
        if (this.busy) {
            logger_1.Logger.warn("The compiler is already busy!", "Compiler.compile");
            return;
        }
        const start = Date.now();
        this.busy = true;
        if (debug) {
            logger_1.Logger.debug("Compiler set to busy", "Compiler");
        }
        // Create tasks from tokens
        const tasks = this.createTasksFromTokens(this.lexer.tokenize());
        if (debug) {
            logger_1.Logger.debug(`Tasks created: ${tasks.length}`, "Compiler.compile");
        }
        // Compile tasks
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (debug) {
                logger_1.Logger.debug(`Compiling task ${i + 1} of ${tasks.length}: ${task.token.total}`, "Compiler.compile");
            }
            try {
                const compiled = task.compile();
                if (debug) {
                    logger_1.Logger.debug(`Task ${i + 1} compiled successfully:\n${compiled}`, "Compiler.compile");
                }
                if (compiled.trim() !== "")
                    this.appendToOutput(compiled + ";\n");
            }
            catch (error) {
                logger_1.Logger.error(`Error compiling task ${i + 1}: ${error.message}`, "Compiler.compile");
            }
        }
        // Finalize the output
        this.prependToOutput(this.importsToString());
        this.prependToOutput(this.variablesToString());
        let code = (0, uglify_js_1.minify)(`"use strict";\nasync function Main() {\n\t${this.#output.replace(/\n/g, "\n\t")}\n}\n\nMain(this);`, { output: { beautify: true } }).code;
        if (debug) {
            logger_1.Logger.debug(`Compilation completed in ${Date.now() - start} miliseconds.\nInput code:\n${this.#input}\nOutput code:\n${code}`, "Compiler.compile");
        }
        // Clear data
        this.variables.clear();
        this.imports.clear();
        this.#output = "";
        if (debug) {
            logger_1.Logger.debug("Data was cleared", "Compiler.compile");
        }
        this.busy = false;
        if (debug) {
            logger_1.Logger.debug("Compiler set to idle", "Compiler.compile");
        }
        return `// Generated by akore v${require("../../package.json").version} //\n` + code;
    }
    ;
    /**
     * Sets a variable in the module's variables set.
     * @param name The name of the variable.
     */
    setVariable(name) {
        // Add the new variable
        this.variables.add((0, to_valid_var_name_1.toValidVarName)(name));
    }
    ;
    /**
     * Converts the variables to string format.
     * @returns A string containing variable statements.
     */
    variablesToString() {
        return `var ${[...this.variables].join(", ")};\n`;
    }
    ;
    /**
     * Adds import statements to the module's imports.
     * @param module The module path to import from.
     * @param keys The keys to import from the module.
     */
    setImport(module, ...keys) {
        // Check if keys are provided and the import exists
        if (keys.length > 0)
            if (this.imports.has(module))
                keys.forEach((key) => this.imports.get(module)?.add(key));
            else
                this.imports.set(module, new Set(keys));
        // If no keys provided or import doesn't exist, set the import without keys
        else
            this.imports.set(module, undefined);
    }
    ;
    /**
     * Converts the module's imports to string format.
     * @returns A string containing import statements.
     */
    importsToString() {
        const imports = [];
        for (const [module, keys] of this.imports.entries())
            if (!keys)
                imports.push(`${(0, to_valid_var_name_1.toValidVarName)(module)} = require("${module}")`);
            else
                imports.push(`({ ${[...keys].join(", ")} } = require("${module}"))`);
        return imports.join(";\n") + ";\n";
    }
    ;
    /**
     * Loads instructions from the specified directory.
     * @param path The directory path containing instruction files.
     * @returns True if the instructions were loaded successfully, otherwise false.
     */
    loaddir(path) {
        return this.instructionsManager.loaddir(path, this);
    }
    ;
    addInstruction(...instructions) {
        this.instructionsManager.add(...instructions);
    }
    ;
    disableInstructions(...names) {
        for (const name of names) {
            const index = this.instructionsManager.instructions.findIndex((instruction) => instruction.id === name || instruction.name === name);
            if (index !== -1) {
                this.instructionsManager.instructions[index]?.disable();
            }
        }
    }
    ;
    enableInstructions(...names) {
        for (const name of names) {
            const index = this.instructionsManager.instructions.findIndex((instruction) => instruction.id === name || instruction.name === name);
            if (index !== -1) {
                this.instructionsManager.instructions[index]?.enable();
            }
        }
    }
    ;
}
exports.Compiler = Compiler;
