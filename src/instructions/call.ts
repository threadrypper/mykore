import { Instruction } from "../classes/instruction";
import { Task } from "../classes/compiler";
export default class CallInstruction extends Instruction {
    name = "$call";
    id = "$akoreCall";
    compile(task: Task): string {
        for (let index = 1; index < task.arguments.length; index++) {
            this.buildConditionArgument(task.arguments[index]?.token);
        }
        this.processNestedArguments(task);
        let [name, ...args] = task.argumentValues();
        return `${name}(${args.join(", ")})`;
    };
}