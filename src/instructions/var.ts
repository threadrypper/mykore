import { Instruction } from "../classes/instruction";
import { Task } from "../classes/compiler";
export default class VarInstruction extends Instruction {
    name = "$var";
    id = "$akoreVar";
    compile(task: Task): string {
        this.buildStringArgument(task.arguments[1]?.token);
        this.processNestedArguments(task);
        const [key, value] = task.argumentValues();
        this.compiler.setVariable(key!.split(".")[0]!);
        return value ? `${key} = ${value}` : key!;
    };
}