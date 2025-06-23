import { Instruction } from "../classes/instruction";
import { Task } from "../classes/compiler";
export default class EscapeInstruction extends Instruction {
    name = "$escape";
    id = "$akoreEscape";
    compile(task: Task): string {
        return task.token.total.slice(task.token.name.length + 1, -1);
    };
}