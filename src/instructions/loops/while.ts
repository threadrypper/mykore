import { Instruction } from "../../classes/instruction";
import { Task } from "../../classes/compiler";
export default class WhileInstruction extends Instruction {
    name = "$while";
    id = "$akoreWhile";
    compile(task: Task): string {
        this.buildConditionArgument(task.arguments[0]?.token);
        this.processNestedArguments(task);
        const [condition, code] = task.argumentValues();
        return `while (${condition}) {${code}}`;
    };
}