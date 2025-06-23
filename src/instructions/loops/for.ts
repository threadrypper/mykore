import { Instruction } from "../../classes/instruction";
import { Task } from "../../classes/compiler";
export default class ForInstruction extends Instruction {
    name = "$for";
    id = "$akoreFor";
    compile(task: Task): string {
        this.buildConditionArgument(task.arguments[1]?.token);
        this.processNestedArguments(task);
        const [def, condition, iter, code] = task.argumentValues();
        return `for (${def};${condition};${iter}) {${code}}`;
    };
}