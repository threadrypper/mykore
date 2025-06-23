import { Instruction } from "../classes/instruction";
import { Task } from "../classes/compiler";
export default class EscapeInstruction extends Instruction {
    name: string;
    id: string;
    compile(task: Task): string;
}
