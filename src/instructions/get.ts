import { toValidVarName } from "../helpers/to_valid_var_name";
import { Instruction } from "../classes/instruction";
import { Task } from "../classes/compiler";
export default class GetInstruction extends Instruction {
    name = "$get";
    id = "$akoreGet";
    compile(task: Task): string {
        this.processNestedArguments(task);
        return task.argumentValues().map(toValidVarName).join(".");
    };
}