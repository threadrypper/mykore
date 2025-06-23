"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const to_valid_var_name_1 = require("../helpers/to_valid_var_name");
const instruction_1 = require("../classes/instruction");
class GetInstruction extends instruction_1.Instruction {
    name = "$get";
    id = "$akoreGet";
    compile(task) {
        this.processNestedArguments(task);
        return task.argumentValues().map(to_valid_var_name_1.toValidVarName).join(".");
    }
    ;
}
exports.default = GetInstruction;
